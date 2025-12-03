import type { GLTFProperty } from './GLTFProperty.ts';

export interface KHRCharacterExpressionMappingExpressionSetMapping {
  [targetExpression: string]: Array<{
    source: string;
    weight: number;
  }>;
}

export interface KHRCharacterExpressionMappingExpressionSetMappings {
  [expressionSetName: string]: KHRCharacterExpressionMappingExpressionSetMapping;
}

export interface KHRCharacterExpressionMapping extends GLTFProperty {
  expressionSetMappings: KHRCharacterExpressionMappingExpressionSetMappings;
}
