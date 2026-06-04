import type { GLTFProperty } from './GLTFProperty.ts';

/**
 * Joint mapping dictionary. Each key is a target joint name in the target rig vocabulary, each value is the source joint name from the model's native rig.
 */
export interface KHRCharacterSkeletonMappingSkeletalRigMapping {
  [rigName: string]: string;
}

/**
 * Dictionary of target rig mappings. Each key is a target rig name, each value is a mapping dictionary.
 */
export interface KHRCharacterSkeletonMappingSkeletalRigMappings {
  [skeletalRigName: string]: KHRCharacterSkeletonMappingSkeletalRigMapping;
}

/**
 * glTF extension that provides a mechanism to map a skeleton rig to a reference rig for retargeting and compatibility.
 */
export interface KHRCharacterSkeletonMapping extends GLTFProperty {
  skeletalRigMappings: KHRCharacterSkeletonMappingSkeletalRigMappings;
}
