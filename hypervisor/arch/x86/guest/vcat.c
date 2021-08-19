/*
 * Copyright (C) 2021 Intel Corporation. All rights reserved.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */

#include <types.h>
#include <errno.h>
#include <logmsg.h>
#include <asm/cpufeatures.h>
#include <asm/cpuid.h>
#include <asm/rdt.h>
#include <asm/lib/bits.h>
#include <asm/board.h>
#include <asm/vm_config.h>
#include <asm/msr.h>
#include <asm/guest/vcpu.h>
#include <asm/guest/vm.h>
#include <asm/guest/vcat.h>
#include <asm/per_cpu.h>

/**
 * @brief Map vCAT MSR address to zero based index
 *
 * @pre  ((msr >= MSR_IA32_L3_MASK_BASE) && msr < (MSR_IA32_L3_MASK_BASE + NUM_VCAT_L3_MSRS))
 *       || ((msr >= MSR_IA32_L2_MASK_BASE) && msr < (MSR_IA32_L2_MASK_BASE + NUM_VCAT_L2_MSRS))
 *       || (msr == MSR_IA32_PQR_ASSOC)
 */
uint32_t vcat_msr2index(uint32_t msr)
{
	uint32_t index = 0U;

	/*  L3 MSRs indices assignment for MSR_IA32_L3_MASK_BASE ~ (MSR_IA32_L3_MASK_BASE + NUM_VCAT_L3_MSRS):
	 *  0
	 *  1
	 *  ...
	 *  (NUM_VCAT_L3_MSRS - 1)
	 *
	 *  L2 MSRs indices assignment:
	 *  NUM_VCAT_L3_MSRS
	 *  ...
	 *  NUM_VCAT_L3_MSRS + NUM_VCAT_L2_MSRS - 1

	 *  PQR index assignment for MSR_IA32_PQR_ASSOC:
	 *  NUM_VCAT_L3_MSRS
	 */

	if ((msr >= MSR_IA32_L3_MASK_BASE) && (msr < (MSR_IA32_L3_MASK_BASE + NUM_VCAT_L3_MSRS))) {
		index = msr - MSR_IA32_L3_MASK_BASE;
	} else if ((msr >= MSR_IA32_L2_MASK_BASE) && (msr < (MSR_IA32_L2_MASK_BASE + NUM_VCAT_L2_MSRS))) {
		index = msr - MSR_IA32_L2_MASK_BASE + NUM_VCAT_L3_MSRS;
	} else if (msr == MSR_IA32_PQR_ASSOC) {
		index = NUM_VCAT_L3_MSRS + NUM_VCAT_L2_MSRS;
	} else {
		ASSERT(false, "invalid msr address");
	}

	return index;
}
