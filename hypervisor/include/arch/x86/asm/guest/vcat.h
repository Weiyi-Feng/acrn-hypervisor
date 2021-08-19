/*
 * Copyright (C) 2021 Intel Corporation. All rights reserved.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */

#ifndef VCAT_H_
#define VCAT_H_

#include <asm/guest/vm.h>

uint32_t vcat_msr2index(uint32_t msr);
bool is_vcat_enabled(const struct acrn_vm *vm);
bool is_l2_vcat_enabled(const struct acrn_vm *vm);
bool is_l3_vcat_enabled(const struct acrn_vm *vm);
uint16_t vcat_get_vcbm_len(const struct acrn_vm *vm, int res);
uint32_t vcat_get_max_vcbm(const struct acrn_vm *vm, int res);
void init_vcat_msrs(struct acrn_vcpu *vcpu);
uint16_t vcat_get_num_vclosids(const struct acrn_vm *vm);
uint32_t vcat_pcbm_to_vcbm(const struct acrn_vm *vm, uint32_t pcbm, int res);
int32_t vcat_rdmsr(const struct acrn_vcpu *vcpu, uint32_t msr, uint64_t *rval);

#endif /* VCAT_H_ */

