import type { GLTFProperty } from './GLTFProperty.ts';
import type { VRMCCharacterExpressionLookatExpressions } from './VRMCCharacterExpressionLookatExpressions.ts';

export interface VRMCCharacterExpressionLookat extends GLTFProperty {
  referenceNode: number;
  expressions?: VRMCCharacterExpressionLookatExpressions;
}
