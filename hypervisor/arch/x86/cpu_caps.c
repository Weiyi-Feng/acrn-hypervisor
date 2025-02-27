/*
 * Copyright (C) 2018 Intel Corporation. All rights reserved.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */

#include <types.h>
#include <asm/msr.h>
#include <asm/page.h>
#include <asm/cpufeatures.h>
#include <asm/cpuid.h>
#include <asm/cpu.h>
#include <asm/per_cpu.h>
#include <asm/vmx.h>
#include <asm/cpu_caps.h>
#include <errno.h>
#include <logmsg.h>
#include <asm/guest/vmcs.h>

/* TODO: add more capability per requirement */
/* APICv features */
#define VAPIC_FEATURE_VIRT_ACCESS	(1U << 0U)
#define VAPIC_FEATURE_VIRT_REG		(1U << 1U)
#define VAPIC_FEATURE_INTR_DELIVERY	(1U << 2U)
#define VAPIC_FEATURE_TPR_SHADOW	(1U << 3U)
#define VAPIC_FEATURE_POST_INTR		(1U << 4U)
#define VAPIC_FEATURE_VX2APIC_MODE	(1U << 5U)

/* BASIC features: must supported by the physical platform and will enabled by default */
#define APICV_BASIC_FEATURE	(VAPIC_FEATURE_TPR_SHADOW | VAPIC_FEATURE_VIRT_ACCESS | VAPIC_FEATURE_VX2APIC_MODE)
/* ADVANCED features: enable them by default if the physical platform support them all, otherwise, disable them all */
#define APICV_ADVANCED_FEATURE	(VAPIC_FEATURE_VIRT_REG | VAPIC_FEATURE_INTR_DELIVERY | VAPIC_FEATURE_POST_INTR)

static struct cpu_capability {
	uint8_t apicv_features;
	uint8_t ept_features;

	uint64_t vmx_ept_vpid;
	uint32_t core_caps;	/* value of MSR_IA32_CORE_CAPABLITIES */
} cpu_caps;

static struct cpuinfo_x86 boot_cpu_data;

struct vmx_capability {
	uint32_t msr;
	uint32_t bits;
};

/* SDM APPENDIX A:
 * Bits 31:0 indicate the allowed 0-settings of these controls. VM entry allows control X
 *  to be 0 if bit X in the MSR is cleared to 0; if bit X in the MSR is set to 1,
 *  VM entry fails if control X is 0.
 * Bits 63:32 indicate the allowed 1-settings of these controls. VM entry allows control X to be 1
 *  if bit 32+X in the MSR is set to 1; if bit 32+X in the MSR is cleared to 0, VM entry fails if control X is 1.
 */
static struct vmx_capability vmx_caps[] = {
	{
		MSR_IA32_VMX_PINBASED_CTLS, VMX_PINBASED_CTLS_IRQ_EXIT
	},
	{
		MSR_IA32_VMX_PROCBASED_CTLS, VMX_PROCBASED_CTLS_TSC_OFF | VMX_PROCBASED_CTLS_TPR_SHADOW |
					VMX_PROCBASED_CTLS_IO_BITMAP | VMX_PROCBASED_CTLS_MSR_BITMAP |
					VMX_PROCBASED_CTLS_HLT | VMX_PROCBASED_CTLS_SECONDARY
	},
	{
		MSR_IA32_VMX_PROCBASED_CTLS2, VMX_PROCBASED_CTLS2_VAPIC | VMX_PROCBASED_CTLS2_EPT |
					VMX_PROCBASED_CTLS2_VPID | VMX_PROCBASED_CTLS2_RDTSCP |
					VMX_PROCBASED_CTLS2_UNRESTRICT
	},
	{
		MSR_IA32_VMX_EXIT_CTLS, VMX_EXIT_CTLS_ACK_IRQ | VMX_EXIT_CTLS_SAVE_PAT |
					VMX_EXIT_CTLS_LOAD_PAT | VMX_EXIT_CTLS_HOST_ADDR64
	},
	{
		MSR_IA32_VMX_ENTRY_CTLS, VMX_ENTRY_CTLS_LOAD_PAT | VMX_ENTRY_CTLS_IA32E_MODE
	}
};

bool pcpu_has_cap(uint32_t bit)
{
	uint32_t feat_idx = bit >> 5U;
	uint32_t feat_bit = bit & 0x1fU;
	bool ret;

	if (feat_idx >= FEATURE_WORDS) {
		ret = false;
	} else {
		ret = ((boot_cpu_data.cpuid_leaves[feat_idx] & (1U << feat_bit)) != 0U);
	}

	return ret;
}

bool has_monitor_cap(void)
{
	bool ret = false;

	if (pcpu_has_cap(X86_FEATURE_MONITOR)) {
		/* don't use monitor for CPU (family: 0x6 model: 0x5c)
		 * in hypervisor, but still expose it to the guests and
		 * let them handle it correctly
		 */
		if (!is_apl_platform()) {
			ret = true;
		}
	}

	return ret;
}

bool disable_host_monitor_wait(void)
{
	bool ret = true;
	uint32_t eax = 0U, ebx = 0U, ecx = 0U, edx = 0U;

	cpuid_subleaf(0x1U, 0x0U, &eax, &ebx, &ecx, &edx);
	if ((ecx & CPUID_ECX_MONITOR) != 0U) {
		/* According to SDM Vol4 2.1 Table 2-2,
		 * update on 'MSR_IA32_MISC_ENABLE_MONITOR_ENA' bit
		 * is not allowed if the SSE3 feature flag is set to 0.
		 */
		if ((ecx & CPUID_ECX_SSE3) != 0U) {
			msr_write(MSR_IA32_MISC_ENABLE, (msr_read(MSR_IA32_MISC_ENABLE) &
				~MSR_IA32_MISC_ENABLE_MONITOR_ENA));

			/* Update cpuid_leaves of boot_cpu_data to
			 * refresh 'has_monitor_cap' state.
			 */
			if (has_monitor_cap()) {
				cpuid_subleaf(CPUID_FEATURES, 0x0U, &eax, &ebx,
					&boot_cpu_data.cpuid_leaves[FEAT_1_ECX],
					&boot_cpu_data.cpuid_leaves[FEAT_1_EDX]);
			}

		} else {
			ret = false;
		}
	}
	return ret;
}

static inline bool is_fast_string_erms_supported_and_enabled(void)
{
	bool ret = false;
	uint64_t misc_enable = msr_read(MSR_IA32_MISC_ENABLE);

	if ((misc_enable & MSR_IA32_MISC_ENABLE_FAST_STRING) == 0UL) {
		pr_fatal("%s, fast string is not enabled\n", __func__);
	} else {
		if (!pcpu_has_cap(X86_FEATURE_ERMS)) {
			pr_fatal("%s, enhanced rep movsb/stosb not supported\n", __func__);
		} else {
			ret = true;
		}
	}

	return ret;
}

/*check allowed ONEs setting in vmx control*/
static bool is_ctrl_setting_allowed(uint64_t msr_val, uint32_t ctrl)
{
	/*
	 * Intel SDM Appendix A.3
	 * - bitX in ctrl can be set 1
	 *   only if bit 32+X in msr_val is 1
	 */
	return ((((uint32_t)(msr_val >> 32UL)) & ctrl) == ctrl);
}

bool is_apl_platform(void)
{
	bool ret = false;

	if ((boot_cpu_data.displayfamily == 0x6U) && (boot_cpu_data.displaymodel == 0x5cU)) {
		ret = true;
	}

	return ret;
}

bool has_core_cap(uint32_t bit_mask)
{
	return ((cpu_caps.core_caps & bit_mask) != 0U);
}

bool is_ac_enabled(void)
{
	bool ac_enabled = false;

	if (has_core_cap(CORE_CAP_SPLIT_LOCK) && ((msr_read(MSR_TEST_CTL) & MSR_TEST_CTL_AC_SPLITLOCK) != 0UL)) {
		ac_enabled = true;
	}

	return ac_enabled;
}

bool is_gp_enabled(void)
{
	bool gp_enabled = false;

	if (has_core_cap(CORE_CAP_UC_LOCK) && ((msr_read(MSR_TEST_CTL) & MSR_TEST_CTL_GP_UCLOCK) != 0UL)) {
		gp_enabled = true;
	}

	return gp_enabled;
}


static void detect_ept_cap(void)
{
	uint64_t msr_val;

	cpu_caps.ept_features = 0U;

	/* Read primary processor based VM control. */
	msr_val = msr_read(MSR_IA32_VMX_PROCBASED_CTLS);

	/*
	 * According to SDM A.3.2 Primary Processor-Based VM-Execution Controls:
	 * The IA32_VMX_PROCBASED_CTLS MSR (index 482H) reports on the allowed
	 * settings of most of the primary processor-based VM-execution controls
	 * (see Section 24.6.2):
	 * Bits 63:32 indicate the allowed 1-settings of these controls.
	 * VM entry allows control X to be 1 if bit 32+X in the MSR is set to 1;
	 * if bit 32+X in the MSR is cleared to 0, VM entry fails if control X
	 * is 1.
	 */
	msr_val = msr_val >> 32U;

	/* Check if secondary processor based VM control is available. */
	if ((msr_val & VMX_PROCBASED_CTLS_SECONDARY) != 0UL) {
		/* Read secondary processor based VM control. */
		msr_val = msr_read(MSR_IA32_VMX_PROCBASED_CTLS2);

		if (is_ctrl_setting_allowed(msr_val, VMX_PROCBASED_CTLS2_EPT)) {
			cpu_caps.ept_features = 1U;
		}
	}
}

static void detect_apicv_cap(void)
{
	uint8_t features = 0U;
	uint64_t msr_val;

	msr_val = msr_read(MSR_IA32_VMX_PROCBASED_CTLS);
	if (is_ctrl_setting_allowed(msr_val, VMX_PROCBASED_CTLS_TPR_SHADOW)) {
		features |= VAPIC_FEATURE_TPR_SHADOW;
	}

	msr_val = msr_read(MSR_IA32_VMX_PROCBASED_CTLS2);
	if (is_ctrl_setting_allowed(msr_val, VMX_PROCBASED_CTLS2_VAPIC)) {
		features |= VAPIC_FEATURE_VIRT_ACCESS;
	}
	if (is_ctrl_setting_allowed(msr_val, VMX_PROCBASED_CTLS2_VX2APIC)) {
		features |= VAPIC_FEATURE_VX2APIC_MODE;
	}
	if (is_ctrl_setting_allowed(msr_val, VMX_PROCBASED_CTLS2_VAPIC_REGS)) {
		features |= VAPIC_FEATURE_VIRT_REG;
	}
	if (is_ctrl_setting_allowed(msr_val, VMX_PROCBASED_CTLS2_VIRQ)) {
		features |= VAPIC_FEATURE_INTR_DELIVERY;
	}

	msr_val = msr_read(MSR_IA32_VMX_PINBASED_CTLS);
	if (is_ctrl_setting_allowed(msr_val, VMX_PINBASED_CTLS_POST_IRQ)) {
		features |= VAPIC_FEATURE_POST_INTR;
	}

	cpu_caps.apicv_features = features;

	vlapic_set_apicv_ops();
}

static void detect_vmx_mmu_cap(void)
{
	/* Read the MSR register of EPT and VPID Capability -  SDM A.10 */
	cpu_caps.vmx_ept_vpid = msr_read(MSR_IA32_VMX_EPT_VPID_CAP);
}

static bool pcpu_vmx_set_32bit_addr_width(void)
{
	return ((msr_read(MSR_IA32_VMX_BASIC) & MSR_IA32_VMX_BASIC_ADDR_WIDTH) != 0UL);
}

static void detect_xsave_cap(void)
{
	uint32_t unused;

	cpuid_subleaf(CPUID_XSAVE_FEATURES, 0x0U,
		&boot_cpu_data.cpuid_leaves[FEAT_D_0_EAX],
		&unused,
		&unused,
		&boot_cpu_data.cpuid_leaves[FEAT_D_0_EDX]);
	cpuid_subleaf(CPUID_XSAVE_FEATURES, 1U,
		&boot_cpu_data.cpuid_leaves[FEAT_D_1_EAX],
		&unused,
		&boot_cpu_data.cpuid_leaves[FEAT_D_1_ECX],
		&boot_cpu_data.cpuid_leaves[FEAT_D_1_EDX]);
}

static void detect_core_caps(void)
{
	if (pcpu_has_cap(X86_FEATURE_CORE_CAP)) {
		cpu_caps.core_caps = (uint32_t)msr_read(MSR_IA32_CORE_CAPABILITIES);
	}
}

static void detect_pcpu_cap(void)
{
	detect_apicv_cap();
	detect_ept_cap();
	detect_vmx_mmu_cap();
	detect_xsave_cap();
	detect_core_caps();
}

static uint64_t get_address_mask(uint8_t limit)
{
	return ((1UL << limit) - 1UL) & PAGE_MASK;
}

void init_pcpu_capabilities(void)
{
	uint32_t eax, unused;
	uint32_t family_id, model_id, displayfamily, displaymodel;

	cpuid_subleaf(CPUID_VENDORSTRING, 0x0U,
		&boot_cpu_data.cpuid_level,
		&unused, &unused, &unused);

	cpuid_subleaf(CPUID_FEATURES, 0x0U, &eax, &unused,
		&boot_cpu_data.cpuid_leaves[FEAT_1_ECX],
		&boot_cpu_data.cpuid_leaves[FEAT_1_EDX]);

	/* SDM Vol.2A 3-211 states the algorithm to calculate DisplayFamily and DisplayModel */
	family_id = (eax >> 8U) & 0xfU;
	displayfamily = family_id;
	if (family_id == 0xFU) {
		displayfamily += ((eax >> 20U) & 0xffU);
	}
	boot_cpu_data.displayfamily = (uint8_t)displayfamily;

	model_id = (eax >> 4U) & 0xfU;
	displaymodel = model_id;
	if ((family_id == 0x06U) || (family_id == 0xFU)) {
		displaymodel += ((eax >> 16U) & 0xfU) << 4U;
	}
	boot_cpu_data.displaymodel = (uint8_t)displaymodel;


	cpuid_subleaf(CPUID_EXTEND_FEATURE, 0x0U, &unused,
		&boot_cpu_data.cpuid_leaves[FEAT_7_0_EBX],
		&boot_cpu_data.cpuid_leaves[FEAT_7_0_ECX],
		&boot_cpu_data.cpuid_leaves[FEAT_7_0_EDX]);

	cpuid_subleaf(CPUID_MAX_EXTENDED_FUNCTION, 0x0U,
		&boot_cpu_data.extended_cpuid_level,
		&unused, &unused, &unused);

	if (boot_cpu_data.extended_cpuid_level >= CPUID_EXTEND_FUNCTION_1) {
		cpuid_subleaf(CPUID_EXTEND_FUNCTION_1, 0x0U, &unused, &unused,
			&boot_cpu_data.cpuid_leaves[FEAT_8000_0001_ECX],
			&boot_cpu_data.cpuid_leaves[FEAT_8000_0001_EDX]);
	}

	if (boot_cpu_data.extended_cpuid_level >= CPUID_EXTEND_INVA_TSC) {
		cpuid_subleaf(CPUID_EXTEND_INVA_TSC, 0x0U, &eax, &unused, &unused,
			&boot_cpu_data.cpuid_leaves[FEAT_8000_0007_EDX]);
	}

	if (boot_cpu_data.extended_cpuid_level >= CPUID_EXTEND_ADDRESS_SIZE) {
		cpuid_subleaf(CPUID_EXTEND_ADDRESS_SIZE, 0x0U, &eax,
			&boot_cpu_data.cpuid_leaves[FEAT_8000_0008_EBX],
			&unused, &unused);

			/* EAX bits 07-00: #Physical Address Bits
			 *     bits 15-08: #Linear Address Bits
			 */
			boot_cpu_data.virt_bits = (uint8_t)((eax >> 8U) & 0xffU);
			boot_cpu_data.phys_bits = (uint8_t)(eax & 0xffU);
			boot_cpu_data.physical_address_mask =
				get_address_mask(boot_cpu_data.phys_bits);
	}

	detect_pcpu_cap();
}

static bool is_ept_supported(void)
{
	return (cpu_caps.ept_features != 0U);
}

static inline bool is_apicv_basic_feature_supported(void)
{
	return ((cpu_caps.apicv_features & APICV_BASIC_FEATURE) == APICV_BASIC_FEATURE);
}

bool is_apicv_advanced_feature_supported(void)
{
	return ((cpu_caps.apicv_features & APICV_ADVANCED_FEATURE) == APICV_ADVANCED_FEATURE);
}

bool pcpu_has_vmx_ept_vpid_cap(uint64_t bit_mask)
{
	return ((cpu_caps.vmx_ept_vpid & bit_mask) != 0U);
}

void init_pcpu_model_name(void)
{
	cpuid_subleaf(CPUID_EXTEND_FUNCTION_2, 0x0U,
		(uint32_t *)(boot_cpu_data.model_name),
		(uint32_t *)(&boot_cpu_data.model_name[4]),
		(uint32_t *)(&boot_cpu_data.model_name[8]),
		(uint32_t *)(&boot_cpu_data.model_name[12]));
	cpuid_subleaf(CPUID_EXTEND_FUNCTION_3, 0x0U,
		(uint32_t *)(&boot_cpu_data.model_name[16]),
		(uint32_t *)(&boot_cpu_data.model_name[20]),
		(uint32_t *)(&boot_cpu_data.model_name[24]),
		(uint32_t *)(&boot_cpu_data.model_name[28]));
	cpuid_subleaf(CPUID_EXTEND_FUNCTION_4, 0x0U,
		(uint32_t *)(&boot_cpu_data.model_name[32]),
		(uint32_t *)(&boot_cpu_data.model_name[36]),
		(uint32_t *)(&boot_cpu_data.model_name[40]),
		(uint32_t *)(&boot_cpu_data.model_name[44]));

	boot_cpu_data.model_name[48] = '\0';
}

static inline bool is_vmx_disabled(void)
{
	uint64_t msr_val;
	bool ret = false;

	/* Read Feature ControL MSR */
	msr_val = msr_read(MSR_IA32_FEATURE_CONTROL);

	/* Check if feature control is locked and vmx cannot be enabled */
	if (((msr_val & MSR_IA32_FEATURE_CONTROL_LOCK) != 0U) &&
		((msr_val & MSR_IA32_FEATURE_CONTROL_VMX_NO_SMX) == 0U)) {
		ret = true;
	}

	return ret;
}

static inline bool pcpu_has_vmx_unrestricted_guest_cap(void)
{
	return ((msr_read(MSR_IA32_VMX_MISC) & MSR_IA32_MISC_UNRESTRICTED_GUEST) != 0UL);
}

static int32_t check_vmx_mmu_cap(void)
{
	int32_t ret = 0;

	if (!pcpu_has_vmx_ept_vpid_cap(VMX_EPT_INVEPT)) {
		printf("%s, invept not supported\n", __func__);
		ret = -ENODEV;
	} else if (!pcpu_has_vmx_ept_vpid_cap(VMX_VPID_INVVPID) ||
		!pcpu_has_vmx_ept_vpid_cap(VMX_VPID_INVVPID_SINGLE_CONTEXT) ||
		!pcpu_has_vmx_ept_vpid_cap(VMX_VPID_INVVPID_GLOBAL_CONTEXT)) {
		printf("%s, invvpid not supported\n", __func__);
		ret = -ENODEV;
	} else if (!pcpu_has_vmx_ept_vpid_cap(VMX_EPT_2MB_PAGE)) {
		printf("%s, ept not support 2MB large page\n", __func__);
		ret = -ENODEV;
	} else {
		/* No other state currently, do nothing */
	}

	return ret;
}

static bool is_vmx_cap_supported(uint32_t msr, uint32_t bits)
{
	uint64_t vmx_msr;
	uint32_t vmx_msr_low, vmx_msr_high;

	vmx_msr = msr_read(msr);
	vmx_msr_low  = (uint32_t)vmx_msr;
	vmx_msr_high = (uint32_t)(vmx_msr >> 32U);
	/* Bits 31:0 indicate the allowed 0-settings
	 * Bits 63:32 indicate the allowed 1-settings
	 */
	return (((vmx_msr_high & bits) == bits) && ((vmx_msr_low & bits) == 0U));
}

static int32_t check_essential_vmx_caps(void)
{
	int32_t ret = 0;
	uint32_t i;

	if (check_vmx_mmu_cap() != 0) {
		ret = -ENODEV;
	} else if (!pcpu_has_vmx_unrestricted_guest_cap()) {
		printf("%s, unrestricted guest not supported\n", __func__);
		ret = -ENODEV;
	} else if (pcpu_vmx_set_32bit_addr_width()) {
		printf("%s, Only support Intel 64 architecture.\n", __func__);
		ret = -ENODEV;
	} else {
		for (i = 0U; i < ARRAY_SIZE(vmx_caps);	i++) {
			if (!is_vmx_cap_supported(vmx_caps[i].msr, vmx_caps[i].bits)) {
				printf("%s, check MSR[0x%x]:0x%lx bits:0x%x failed\n", __func__,
						vmx_caps[i].msr, msr_read(vmx_caps[i].msr), vmx_caps[i].bits);
				ret = -ENODEV;
				break;
			}
		}
	}

	return ret;
}

/*
 * basic hardware capability check
 * we should supplement which feature/capability we must support
 * here later.
 */
int32_t detect_hardware_support(void)
{
	int32_t ret;

	/* Long Mode (x86-64, 64-bit support) */
	if (!pcpu_has_cap(X86_FEATURE_LM)) {
		printf("%s, LM not supported\n", __func__);
		ret = -ENODEV;
	} else if ((boot_cpu_data.phys_bits == 0U) ||
		(boot_cpu_data.virt_bits == 0U)) {
		printf("%s, can't detect Linear/Physical Address size\n", __func__);
		ret = -ENODEV;
	} else if (boot_cpu_data.phys_bits > MAXIMUM_PA_WIDTH) {
		printf("%s, physical-address width (%d) over maximum physical-address width (%d)\n",
			__func__, boot_cpu_data.phys_bits, MAXIMUM_PA_WIDTH);
		ret = -ENODEV;
	} else if ((boot_cpu_data.phys_bits > 39U) && (!pcpu_has_cap(X86_FEATURE_PAGE1GB) ||
			!pcpu_has_vmx_ept_vpid_cap(VMX_EPT_1GB_PAGE))) {
		printf("%s, physical-address width %d over 39 bits must support 1GB large page\n",
			__func__, boot_cpu_data.phys_bits);
		ret = -ENODEV;
	} else if (!pcpu_has_cap(X86_FEATURE_INVA_TSC)) {
		/* check invariant TSC */
		printf("%s, invariant TSC not supported\n", __func__);
		ret = -ENODEV;
	} else if (!pcpu_has_cap(X86_FEATURE_TSC_DEADLINE)) {
		/* lapic TSC deadline timer */
		printf("%s, TSC deadline not supported\n", __func__);
		ret = -ENODEV;
	} else if (!pcpu_has_cap(X86_FEATURE_NX)) {
		/* Execute Disable */
		printf("%s, NX not supported\n", __func__);
		ret = -ENODEV;
	} else if (!pcpu_has_cap(X86_FEATURE_SMEP)) {
		/* Supervisor-Mode Execution Prevention */
		printf("%s, SMEP not supported\n", __func__);
		ret = -ENODEV;
	} else if (!pcpu_has_cap(X86_FEATURE_SMAP)) {
		/* Supervisor-Mode Access Prevention */
		printf("%s, SMAP not supported\n", __func__);
		ret = -ENODEV;
	} else if (!pcpu_has_cap(X86_FEATURE_MTRR)) {
		printf("%s, MTRR not supported\n", __func__);
		ret = -ENODEV;
	} else if (!pcpu_has_cap(X86_FEATURE_CLFLUSHOPT)) {
		printf("%s, CLFLUSHOPT not supported\n", __func__);
		ret = -ENODEV;
	} else if (!pcpu_has_cap(X86_FEATURE_VMX)) {
		printf("%s, vmx not supported\n", __func__);
		ret = -ENODEV;
	} else if (!is_fast_string_erms_supported_and_enabled()) {
		ret = -ENODEV;
	} else if (!is_ept_supported()) {
		printf("%s, EPT not supported\n", __func__);
		ret = -ENODEV;
	} else if (!is_apicv_basic_feature_supported()) {
		printf("%s, APICV not supported\n", __func__);
		ret = -ENODEV;
	} else if (boot_cpu_data.cpuid_level < 0x15U) {
		printf("%s, required CPU feature not supported\n", __func__);
		ret = -ENODEV;
	} else if (is_vmx_disabled()) {
		printf("%s, VMX can not be enabled\n", __func__);
		ret = -ENODEV;
	} else if (!pcpu_has_cap(X86_FEATURE_X2APIC)) {
		printf("%s, x2APIC not supported\n", __func__);
		ret = -ENODEV;
	} else if (!pcpu_has_cap(X86_FEATURE_POPCNT)) {
		printf("%s, popcnt instruction not supported\n", __func__);
		ret = -ENODEV;
	} else if (!pcpu_has_cap(X86_FEATURE_SSE)) {
		printf("%s, SSE not supported\n", __func__);
		ret = -ENODEV;
	} else if (!pcpu_has_cap(X86_FEATURE_RDRAND)) {
		printf("%s, RDRAND is not supported\n", __func__);
		ret = -ENODEV;
	} else {
		ret = check_essential_vmx_caps();
	}

	return ret;
}

struct cpuinfo_x86 *get_pcpu_info(void)
{
	return &boot_cpu_data;
}
