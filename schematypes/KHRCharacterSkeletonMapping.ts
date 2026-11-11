import type { GLTFProperty } from './GLTFProperty.ts';

/**
 * Associates a target joint vocabulary entry with a source glTF node.
 */
export interface KHRCharacterSkeletonMappingJointAssociation extends GLTFProperty {
  /**
   * Associated node index; membership in skin.joints is not required.
   */
  node: number;

  /**
   * Optional association name, independent of the referenced node's name.
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
 * Generic associations between external skeletal vocabulary roles and glTF nodes.
 */
export interface KHRCharacterSkeletonMapping extends GLTFProperty {
  /**
   * Dictionary of target rig mappings. Each key is a target rig name, each value is a mapping dictionary.
   */
  skeletalRigMappings: KHRCharacterSkeletonMappingSkeletalRigMappings;
}
