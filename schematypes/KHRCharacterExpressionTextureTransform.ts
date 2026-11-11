import type { GLTFProperty } from './GLTFProperty.ts';

export interface KHRCharacterExpressionTextureTransform extends GLTFProperty {
  /** Unique channel indices targeting authored KHR_texture_transform properties. */
  channels: number[];
}
