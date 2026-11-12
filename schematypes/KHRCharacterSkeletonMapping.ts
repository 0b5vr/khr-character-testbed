import type { GLTFProperty } from './GLTFProperty.ts';

/**
 * Associates a role from an external skeletal vocabulary with a glTF node. The node index is authoritative; the optional name belongs to the association.
 */
export interface KHRCharacterSkeletonMappingJointAssociation extends GLTFProperty {
  /**
   * Index of the associated glTF node in the top-level nodes array.
   */
  node: number;

  /**
   * Optional name of this association.
   */
  name?: string;
}

/**
 * Nonempty role-association dictionary. Each key is a nonempty role identifier; exporters write only identifiers that the mapping set's vocabulary defines, but other keys remain valid. Each value is a role association.
 */
export interface KHRCharacterSkeletonMappingSkeletalRigMapping {
  /**
   * Associates a role from an external skeletal vocabulary with a glTF node. The node index is authoritative; the optional name belongs to the association.
   */
  [rigName: string]: KHRCharacterSkeletonMappingJointAssociation;
}

/**
 * Nonempty dictionary of skeletal vocabulary mappings. Each key is a nonempty mapping-set identifier that names a skeletal vocabulary; each value associates that vocabulary's role identifiers with glTF nodes.
 */
export interface KHRCharacterSkeletonMappingSkeletalRigMappings {
  /**
   * Nonempty role-association dictionary. Each key is a nonempty role identifier; exporters write only identifiers that the mapping set's vocabulary defines, but other keys remain valid. Each value is a role association.
   */
  [skeletalRigName: string]: KHRCharacterSkeletonMappingSkeletalRigMapping;
}

/**
 * Associates roles from externally defined skeletal vocabularies with glTF nodes.
 */
export interface KHRCharacterSkeletonMapping extends GLTFProperty {
  /**
   * Nonempty dictionary of skeletal vocabulary mappings. Each key is a nonempty mapping-set identifier that names a skeletal vocabulary; each value associates that vocabulary's role identifiers with glTF nodes.
   */
  skeletalRigMappings: KHRCharacterSkeletonMappingSkeletalRigMappings;
}
