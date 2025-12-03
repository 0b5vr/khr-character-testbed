import type { GLTFProperty } from './GLTFProperty.ts';

export interface KHRCharacterExpressionExpression extends GLTFProperty {
  expression: string;
  animation: number;
}

export interface KHRCharacterExpression extends GLTFProperty {
  expressions: KHRCharacterExpressionExpression[];
}
