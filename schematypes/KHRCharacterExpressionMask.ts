import type { GLTFProperty } from './GLTFProperty.ts';

export interface KHRCharacterExpressionMaskMask extends GLTFProperty {
  target: string;
  type: 'blend' | 'block';
  amount?: number;
  threshold?: number;
}

export interface KHRCharacterExpressionMask extends GLTFProperty {
  masks: KHRCharacterExpressionMaskMask[];
}
