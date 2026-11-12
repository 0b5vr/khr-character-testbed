import type { GLTFProperty } from './GLTFProperty.ts';

/**
 * The mapping of look-at expressions to the expressions defined in KHR_character_expression. Each mapped value MUST match an expression name defined in KHR_character_expression.expressions. The values of lookUp, lookDown, lookLeft, and lookRight MUST be distinct from each other.
 */
export interface VRMCCharacterExpressionLookatExpressions extends GLTFProperty {
  /**
   * The name of the expression used for looking up.
   */
  lookUp?: string;
  /**
   * The name of the expression used for looking down.
   */
  lookDown?: string;
  /**
   * The name of the expression used for looking left.
   */
  lookLeft?: string;
  /**
   * The name of the expression used for looking right.
   */
  lookRight?: string;
}
