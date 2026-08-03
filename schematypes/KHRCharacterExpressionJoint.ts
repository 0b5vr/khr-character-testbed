import type { GLTFProperty } from './GLTFProperty.ts';

/**
 * glTF extension that extends KHR_character_expression to specify joint-based expression animations.
 */
export interface KHRCharacterExpressionJoint extends GLTFProperty {
  /**
   * Array of animation channel indices that drive joint-based expressions.
   */
  channels: number[];
}
