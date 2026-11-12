import type { GLTFProperty } from './GLTFProperty.ts';
import type { VRMCCharacterExpressionLookatExpressions } from './VRMCCharacterExpressionLookatExpressions.ts';

/**
 * glTF extension defining how KHR_character_expression expressions are used for eye gaze look-at control.
 */
export interface VRMCCharacterExpressionLookat extends GLTFProperty {
  /**
   * The index of the node used as the reference for look-at direction calculation.
   */
  referenceNode: number;
  /**
   * The mapping of look-at expressions to the expressions defined in KHR_character_expression. Each mapped value MUST match an expression name defined in KHR_character_expression.expressions. The values of lookUp, lookDown, lookLeft, and lookRight MUST be distinct from each other.
   */
  expressions?: VRMCCharacterExpressionLookatExpressions;
}
