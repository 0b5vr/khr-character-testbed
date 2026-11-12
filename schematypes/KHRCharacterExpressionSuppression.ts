import type { GLTFProperty } from './GLTFProperty.ts';

/**
 * Defines one attenuation contribution from the containing source expression to a target expression.
 */
export interface KHRCharacterExpressionSuppressionSuppression extends GLTFProperty {
  /**
   * Index of the native expression driver attenuated by this suppression.
   */
  target: number;
  /** Optional name of this suppression. */
  name?: string;
  /**
   * Suppression type. 'blend' contributes amount times the source driver; 'block' contributes amount when the source driver exceeds threshold, otherwise 0. All attenuation contributions are summed and clamped per target. A custom value is shaped like a glTF vendor extension name and MUST be ignored at runtime unless a supported companion extension object on this suppression, keyed by exactly this value, defines its attenuation as one finite value in [0, 1].
   */
  type?: string;
  /**
   * Attenuation amount used by the 'blend' and 'block' contributions.
   */
  amount?: number;
  /**
   * Strict source-driver threshold for a 'block' suppression. The suppression contributes amount only when the source value is greater than this value.
   */
  threshold?: number;
}

/**
 * Defines a nonempty array of suppressions originating from the containing expression entry.
 */
export interface KHRCharacterExpressionSuppression extends GLTFProperty {
  /**
   * Nonempty array of suppressions whose implicit source is the containing expression entry.
   */
  suppressions: KHRCharacterExpressionSuppressionSuppression[];
}
