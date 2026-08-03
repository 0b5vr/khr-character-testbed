import type { GLTFProperty } from './GLTFProperty.ts';

/**
 * glTF extension that extends KHR_character_expression to specify morph target-based expression animations.
 */
export interface KHRCharacterExpressionMorphtarget extends GLTFProperty {
  /**
   * Array of animation channel indices that drive morph target-based expressions.
   */
  channels: number[];
}
