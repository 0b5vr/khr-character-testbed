import type { GLTFProperty } from './GLTFProperty.ts';

export interface KHRCharacterExpressionMaskMask extends GLTFProperty {
  target: string;

  /**
   * The masking mode. When omitted, the schema default is `"blend"`.
   *
   * The extension reserves `blend` and `block`, while allowing applications
   * to define other non-empty string values.
   */
  type?: string;

  amount?: number;
  threshold?: number;
}

export interface KHRCharacterExpressionMask extends GLTFProperty {
  masks: KHRCharacterExpressionMaskMask[];
}
