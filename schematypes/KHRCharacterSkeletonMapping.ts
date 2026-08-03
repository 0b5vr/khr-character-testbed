import type { GLTFProperty } from './GLTFProperty.ts';

/**
 * Associates a target joint vocabulary entry with a source glTF node.
 */
export interface KHRCharacterSkeletonMappingJointAssociation extends GLTFProperty {
  /**
   * Index of the source joint's glTF node in the nodes array.
   */
  node: number;

  /**
   * The name of the source joint node.
   */
  name?: string;
}

export interface KHRCharacterSkeletonMappingSkeletalRigMapping {
  /**
   * Joint mapping dictionary. Each key is a target joint name in the target rig vocabulary, each value is a source joint association.
   */
  [rigName: string]: KHRCharacterSkeletonMappingJointAssociation;
}

export interface KHRCharacterSkeletonMappingSkeletalRigMappings {
  [skeletalRigName: string]: KHRCharacterSkeletonMappingSkeletalRigMapping;
}

/**
 * glTF extension that provides a mechanism to map a skeleton rig to a reference rig for retargeting and compatibility.
 */
export interface KHRCharacterSkeletonMapping extends GLTFProperty {
  /**
   * Dictionary of target rig mappings. Each key is a target rig name, each value is a mapping dictionary.
   */
  skeletalRigMappings: KHRCharacterSkeletonMappingSkeletalRigMappings;
}
