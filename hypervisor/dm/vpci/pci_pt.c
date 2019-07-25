/*-
* Copyright (c) 2011 NetApp, Inc.
* Copyright (c) 2018 Intel Corporation
* All rights reserved.
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions
* are met:
* 1. Redistributions of source code must retain the above copyright
*    notice, this list of conditions and the following disclaimer.
* 2. Redistributions in binary form must reproduce the above copyright
*    notice, this list of conditions and the following disclaimer in the
*    documentation and/or other materials provided with the distribution.
*
* THIS SOFTWARE IS PROVIDED BY NETAPP, INC ``AS IS'' AND
* ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
* IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
* ARE DISCLAIMED.  IN NO EVENT SHALL NETAPP, INC OR CONTRIBUTORS BE LIABLE
* FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
* DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
* OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
* HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
* LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
* OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
* SUCH DAMAGE.
*
* $FreeBSD$
*/
#include <vm.h>
#include <errno.h>
#include <ept.h>
#include <mmu.h>
#include <vmx.h>
#include <logmsg.h>
#include "vpci_priv.h"

/**
 * @brief get bar's full base address in 64-bit
 * @pre idx < nr_bars
 * For 64-bit MMIO bar, its lower 32-bits base address and upper 32-bits base are combined
 * into one 64-bit base address
 */
static uint64_t pci_bar_2_bar_base(const struct pci_bar *pbars, uint32_t nr_bars, uint32_t idx)
{
	uint64_t base = 0UL;
	uint64_t tmp;
	const struct pci_bar *bar;

	bar = &pbars[idx];

	if (bar->is_64bit_high) {
		ASSERT(idx > 0U, "idx for upper 32-bit of the 64-bit bar should be greater than 0!");
		if (idx > 0U) {
			const struct pci_bar *prev_bar = &pbars[idx - 1U];

			/* Upper 32-bit of 64-bit bar (does not have flags portion) */
			base = (uint64_t)(bar->reg.value);
			base <<= 32U;

			/* Lower 32-bit of a 64-bit bar (BITS 31-4 = base address, 16-byte aligned) */
			tmp = (uint64_t)(prev_bar->reg.bits.mem.base);
			tmp <<= 4U;

			base |= tmp;
		}
	} else {
		enum pci_bar_type type = pci_get_bar_type(bar->reg.value);

		switch (type) {

		case PCIBAR_MEM32:
			base = (uint64_t)(bar->reg.bits.mem.base);
			base <<= 4U;
			break;

		case PCIBAR_MEM64:
			ASSERT((idx + 1U) < nr_bars, "idx for upper 32-bit of the 64-bit bar is out of range!");
			if ((idx + 1U) < nr_bars) {
				const struct pci_bar *next_bar = &pbars[idx + 1U];

				/* Upper 32-bit of 64-bit bar */
				base = (uint64_t)(next_bar->reg.value);
				base <<= 32U;

				/* Lower 32-bit of a 64-bit bar (BITS 31-4 = base address, 16-byte aligned) */
				tmp = (uint64_t)(bar->reg.bits.mem.base);
				tmp <<= 4U;

				base |= tmp;
			}
			break;

		default:
			/* Nothing to do */
			break;
		}
	}

	return base;
}

/**
 * @brief get vbar's full base address in 64-bit
 * For 64-bit MMIO bar, its lower 32-bits base address and upper 32-bits base are combined
 * into one 64-bit base address
 * @pre vdev != NULL
 */
static uint64_t get_vbar_base(const struct pci_vdev *vdev, uint32_t idx)
{
	return pci_bar_2_bar_base(&vdev->bar[0], vdev->nr_bars, idx);
}

/**
 * @brief get pbar's full address in 64-bit
 * For 64-bit MMIO bar, its lower 32-bits base address and upper 32-bits base are combined
 * into one 64-bit base address
 * @pre pdev != NULL
 */
static uint64_t get_pbar_base(const struct pci_pdev *pdev, uint32_t idx)
{
	return pci_bar_2_bar_base(&pdev->bar[0], pdev->nr_bars, idx);
}

/**
 * @pre vdev != NULL
 */
int32_t vdev_pt_read_cfg(const struct pci_vdev *vdev, uint32_t offset, uint32_t bytes, uint32_t *val)
{
	/* bar access must be 4 bytes and offset must also be 4 bytes aligned */
	if ((bytes == 4U) && ((offset & 0x3U) == 0U)) {
		*val = pci_vdev_read_cfg(vdev, offset, bytes);
	} else {
		*val = ~0U;
	}

	return 0;
}

/**
 * @brief Remaps guest MMIO BARs other than MSI-x Table BAR
 * This API is invoked upon guest re-programming PCI BAR with MMIO region
 * after a new vbar is set.
 * @pre vdev != NULL
 * @pre vdev->vpci != NULL
 * @pre vdev->vpci->vm != NULL
 */
static void vdev_pt_remap_generic_mem_vbar(struct pci_vdev *vdev, uint32_t idx)
{
	struct acrn_vm *vm = vdev->vpci->vm;
	struct pci_bar *vbar;
	uint64_t vbar_base = get_vbar_base(vdev, idx); /* vbar (gpa) */

	vbar = &vdev->bar[idx];

	/* If the old vbar is mapped before, unmap it first */
	if (vdev->bar_base_mapped[idx] != 0UL) {
		ept_del_mr(vm, (uint64_t *)(vm->arch_vm.nworld_eptp),
			vdev->bar_base_mapped[idx], /* GPA (old vbar) */
			vbar->size);
		vdev->bar_base_mapped[idx] = 0UL;
	}

	/* If a new vbar is set (nonzero), set the EPT mapping accordingly */
	if (vbar_base != 0UL) {
		uint64_t hpa = gpa2hpa(vdev->vpci->vm, vbar_base);
		uint64_t pbar_base = get_pbar_base(vdev->pdev, idx); /* pbar (hpa) */

		if (hpa != pbar_base) {
			/* Unmap the existing mapping for new vbar */
			if (hpa != INVALID_HPA) {
				ept_del_mr(vm, (uint64_t *)(vm->arch_vm.nworld_eptp),
				vbar_base, /* GPA (new vbar) */
				vbar->size);
			}

			/* Map the physical BAR in the guest MMIO space */
			ept_add_mr(vm, (uint64_t *)(vm->arch_vm.nworld_eptp),
				pbar_base, /* HPA (pbar) */
				vbar_base, /* GPA (new vbar) */
				vbar->size,
				EPT_WR | EPT_RD | EPT_UNCACHED);

			/* Remember the previously mapped MMIO vbar */
			vdev->bar_base_mapped[idx] = vbar_base;
		}
	}
}

/**
 * @pre vdev != NULL
 */
static void vdev_pt_remap_mem_vbar(struct pci_vdev *vdev, uint32_t idx)
{
	bool is_msix_table_bar;

	is_msix_table_bar = (has_msix_cap(vdev) && (idx == vdev->msix.table_bar));

	vdev_pt_remap_generic_mem_vbar(vdev, idx);
}

/**
 * @brief Set the base address portion of the vbar base address register (32-bit)
 * base: bar value with flags portion masked off
 * @pre vbar != NULL
 */
static void set_vbar_base(struct pci_bar *vbar, uint32_t base)
{
	union pci_bar_reg bar_reg;

	bar_reg.value = base;

	if (vbar->is_64bit_high) {
		/* Upper 32-bit of a 64-bit bar does not have the flags portion */
		vbar->reg.value = bar_reg.value;
	} else if (vbar->reg.bits.io.is_io == 1U) {
		/* IO bar, BITS 31-2 = base address, 4-byte aligned */
		vbar->reg.bits.io.base = bar_reg.bits.io.base;
	} else {
		/* MMIO bar, BITS 31-4 = base address, 16-byte aligned */
		vbar->reg.bits.mem.base = bar_reg.bits.mem.base;
	}
}

/**
 * @pre vdev != NULL
 */
static void vdev_pt_write_vbar(struct pci_vdev *vdev, uint32_t offset, uint32_t val)
{
	uint32_t idx;
	uint64_t base;
	bool bar_update_normal;
	struct pci_bar *vbar;

	base = 0UL;
	idx = (offset - pci_bar_offset(0U)) >> 2U;
	bar_update_normal = (val != (uint32_t)~0U);

	vbar = &vdev->bar[idx];

	if (vbar->is_64bit_high) {
		if (idx > 0U) {
			uint32_t prev_idx = idx - 1U;

			base = git_size_masked_bar_base(vdev->bar[prev_idx].size, ((uint64_t)val) << 32U) >> 32U;
			set_vbar_base(vbar, (uint32_t)base);

			if (bar_update_normal) {
				vdev_pt_remap_mem_vbar(vdev, prev_idx);
			}
		} else {
			ASSERT(false, "idx for upper 32-bit of the 64-bit bar should be greater than 0!");
		}
	} else {
		enum pci_bar_type type = pci_get_bar_type(vbar->reg.value);

		switch (type) {

		case PCIBAR_MEM32:
			base = git_size_masked_bar_base(vbar->size, (uint64_t)val);
			set_vbar_base(vbar, (uint32_t)base);

			if (bar_update_normal) {
				vdev_pt_remap_mem_vbar(vdev, idx);
			}
			break;

		case PCIBAR_MEM64:
			base = git_size_masked_bar_base(vbar->size, (uint64_t)val);
			set_vbar_base(vbar, (uint32_t)base);
			break;

		default:
			/* Nothing to do */
			break;
		}
	}

	/* Write the vbar value to corresponding virtualized vbar reg */
	pci_vdev_write_cfg_u32(vdev, offset, vbar->reg.value);
}

/**
 * @pre vdev != NULL
 * bar write access must be 4 bytes and offset must also be 4 bytes aligned, it will be dropped otherwise
 */
int32_t vdev_pt_write_cfg(struct pci_vdev *vdev, uint32_t offset, uint32_t bytes, uint32_t val)
{
	/* bar write access must be 4 bytes and offset must also be 4 bytes aligned */
	if ((bytes == 4U) && ((offset & 0x3U) == 0U)) {
		vdev_pt_write_vbar(vdev, offset, val);
	}

	return 0;
}

/**
 * PCI base address register (bar) virtualization:
 *
 * Virtualize the PCI bars (up to 6 bars at byte offset 0x10~0x24 for type 0 PCI device,
 * 2 bars at byte offset 0x10-0x14 for type 1 PCI device) of the PCI configuration space
 * header.
 *
 * pbar: bar for the physical PCI device (pci_pdev), the value of pbar (hpa) is assigned
 * by platform firmware during boot. It is assumed a valid hpa is always assigned to a
 * mmio pbar, hypervisor shall not change the value of a pbar.
 *
 * vbar: for each pci_pdev, it has a virtual PCI device (pci_vdev) counterpart. pci_vdev
 * virtualizes all the bars (called vbars). a vbar can be initialized by hypervisor by
 * assigning a gpa to it; if vbar has a value of 0 (unassigned), guest may assign
 * and program a gpa to it. The guest only sees the vbars, it will not see and can
 * never change the pbars.
 *
 * Hypervisor traps guest changes to the mmio vbar (gpa) to establish ept mapping
 * between vbar(gpa) and pbar(hpa). pbar should always align on 4K boundary.
 *
 * @pre vdev != NULL
 * @pre vdev->vpci != NULL
 * @pre vdev->vpci->vm != NULL
 * @pre vdev->pdev != NULL
 */
void init_vdev_pt(struct pci_vdev *vdev)
{
	uint32_t idx;
	struct pci_bar *pbar, *vbar;
	uint16_t pci_command;
	uint64_t vbar_base;

	vdev->nr_bars = vdev->pdev->nr_bars;

	ASSERT(vdev->nr_bars > 0U, "vdev->nr_bars should be greater than 0!");

	for (idx = 0U; idx < vdev->nr_bars; idx++) {
		pbar = &vdev->pdev->bar[idx];
		vbar = &vdev->bar[idx];

		vbar->size = 0UL;
		vbar->reg.value = pbar->reg.value;
		vbar->is_64bit_high = pbar->is_64bit_high;

		if (pbar->is_64bit_high) {
			ASSERT(idx > 0U, "idx for upper 32-bit of the 64-bit bar should be greater than 0!");

			if (idx > 0U) {
				/* For pre-launched VMs: vbar base is predefined in vm_config */
				vbar_base = vdev->ptdev_config->vbar_base[idx - 1U];
			} else {
				vbar_base = 0UL;
			}
			/* Write the upper 32-bit of a 64-bit bar */
			vdev_pt_write_vbar(vdev, pci_bar_offset(idx), (uint32_t)(vbar_base >> 32U));
		} else {
			enum pci_bar_type type = pci_get_bar_type(pbar->reg.value);

			switch (type) {
			case PCIBAR_MEM32:
			case PCIBAR_MEM64:
				/**
				 * If vbar->base is 0 (unassigned), Linux kernel will reprogram the vbar on
				 * its bar size boundary, so in order to ensure the MMIO vbar allocated by guest
				 * is 4k aligned, set its size to be 4K aligned.
				 */
				vbar->size = round_page_up(pbar->size);

				/* For pre-launched VMs: vbar base is predefined in vm_config */
				vbar_base = vdev->ptdev_config->vbar_base[idx];
				vdev_pt_write_vbar(vdev, pci_bar_offset(idx), (uint32_t)vbar_base);
				break;

			default:
				/* Nothing to do in this case */
				break;
			}
		}
	}

	pci_command = (uint16_t)pci_pdev_read_cfg(vdev->pdev->bdf, PCIR_COMMAND, 2U);

	/* Disable INTX */
	pci_command |= 0x400U;
	pci_pdev_write_cfg(vdev->pdev->bdf, PCIR_COMMAND, 2U, pci_command);
}
