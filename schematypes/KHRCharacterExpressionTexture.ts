import type { GLTFProperty } from './GLTFProperty.ts';

/**
 * glTF extension that extends KHR_character_expression to specify texture-based expression animations.
 */
export interface KHRCharacterExpressionTexture extends GLTFProperty {
  /**
   * Array of animation channel indices that drive texture-based expressions.
   */
  channels: number[];
}
