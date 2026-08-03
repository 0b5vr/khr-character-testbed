import type { GLTFProperty } from './GLTFProperty.ts';

/**
 * Defines how the parent expression affects a target expression.
 */
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

/**
 * glTF extension that extends KHR_character_expression to define how this expression masks or influences other expressions.
 */
export interface KHRCharacterExpressionMask extends GLTFProperty {
  /**
   * An array of mask objects that define how this expression affects other expressions.
   */
  masks: KHRCharacterExpressionMaskMask[];
}
