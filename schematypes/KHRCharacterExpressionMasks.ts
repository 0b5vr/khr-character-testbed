import type { GLTFProperty } from './GLTFProperty.ts';

export interface KHRCharacterExpressionMasksMask extends GLTFProperty {
  target: string;
  type: 'blend' | 'block';
  amount?: number;
  threshold?: number;
}

export interface KHRCharacterExpressionMasks extends GLTFProperty {
  masks: KHRCharacterExpressionMasksMask[];
}
