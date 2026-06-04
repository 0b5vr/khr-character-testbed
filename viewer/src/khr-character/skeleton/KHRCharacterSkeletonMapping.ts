import { type KHRCharacterSkeletalRigMapping } from './KHRCharacterSkeletalRigMapping';

export class KHRCharacterSkeletonMapping {
  /**
   * A map, target rig name -> (target joint name -> node).
   */
  skeletalRigMappings: Map<string, KHRCharacterSkeletalRigMapping> = new Map();
}
