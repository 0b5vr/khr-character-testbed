import type { GLTFProperty } from './GLTFProperty.ts';

export interface KHRCharacterExpressionSuppressionSuppression extends GLTFProperty {
  target: number;
  /** Optional name of this suppression. */
  name?: string;
  type?: string;
  amount?: number;
  threshold?: number;
}

export interface KHRCharacterExpressionSuppression extends GLTFProperty {
  suppressions: KHRCharacterExpressionSuppressionSuppression[];
}
