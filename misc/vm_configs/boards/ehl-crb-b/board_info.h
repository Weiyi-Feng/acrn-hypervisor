/*
 * Copyright (C) 2020 Intel Corporation. All rights reserved.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */

#ifndef BOARD_INFO_H
#define BOARD_INFO_H

#define MAX_PCPU_NUM			4U
#define MAX_VMSIX_ON_MSI_PDEVS_NUM	5U
#define MAX_HIDDEN_PDEVS_NUM		0U

#define HI_MMIO_START			~0UL
#define HI_MMIO_END			0UL
#define HI_MMIO_SIZE			0x10000000UL

#define P2SB_VGPIO_DM_ENABLED
#define P2SB_BAR_ADDR			0xFD000000UL
#define P2SB_BAR_ADDR_GPA		0xFD000000UL
#define P2SB_BAR_SIZE			0x1000000UL

#define P2SB_BASE_GPIO_PORT_ID		0x69U
#define P2SB_MAX_GPIO_COMMUNITIES	0x6U

#endif /* BOARD_INFO_H */
