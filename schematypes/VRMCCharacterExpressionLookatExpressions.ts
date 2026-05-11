import type { GLTFProperty } from './GLTFProperty.ts';

export interface VRMCCharacterExpressionLookatExpressions extends GLTFProperty {
  lookUp?: string;
  lookDown?: string;
  lookLeft?: string;
  lookRight?: string;
}
