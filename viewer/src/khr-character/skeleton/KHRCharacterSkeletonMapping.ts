import { type KHRCharacterSkeletalRigMapping } from './KHRCharacterSkeletalRigMapping';

export class KHRCharacterSkeletonMapping {
  /**
   * A map, rig mapping name -> (node -> mapping name).
   */
  skeletalRigMappings: Map<string, KHRCharacterSkeletalRigMapping> = new Map();
}
