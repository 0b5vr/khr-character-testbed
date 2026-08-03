import type { GLTFProperty } from './GLTFProperty.ts';

export interface KHRCharacterExpressionMaskMask extends GLTFProperty {
  /**
   * Index of the target expression that this mask will affect.
   */
  target: number;

  /**
   * The name of the target expression.
   */
  name?: string;

  /**
   * The type of the mask. 'blend' reduces the target proportionally to this expression's value. 'block' fully reduces the target when this expression exceeds the threshold.
   */
  type?: string;

  /**
   * The amount of influence this mask has on the target expression. A value of 1.0 means full influence.
   */
  amount?: number;

  /**
   * For 'block' type masks, the threshold value above which the target expression is blocked. When this expression's value exceeds the threshold, the target is reduced by the amount.
   */
  threshold?: number;
}

export interface KHRCharacterExpressionMask extends GLTFProperty {
  masks: KHRCharacterExpressionMaskMask[];
}
