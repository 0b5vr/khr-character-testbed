import type { GLTFProperty } from './GLTFProperty.ts';

export interface KHRCharacterExpressionSuppressionSuppression extends GLTFProperty {
  target: number;
  /** Independent label for this rule, not the target expression name. */
  name?: string;
  type?: string;
  amount?: number;
  threshold?: number;
}

export interface KHRCharacterExpressionSuppression extends GLTFProperty {
  suppressions: KHRCharacterExpressionSuppressionSuppression[];
}
