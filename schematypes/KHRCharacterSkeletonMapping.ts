import type { GLTFProperty } from './GLTFProperty.ts';

export interface KHRCharacterSkeletonMappingSkeletalRigMapping {
  [sourceNode: string]: string;
}

export interface KHRCharacterSkeletonMappingSkeletalRigMappings {
  [skeletalRigName: string]: KHRCharacterSkeletonMappingSkeletalRigMapping;
}

export interface KHRCharacterSkeletonMapping extends GLTFProperty {
  skeletalRigMappings: KHRCharacterSkeletonMappingSkeletalRigMappings;
}
