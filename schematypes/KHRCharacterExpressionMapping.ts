import type { GLTFProperty } from './GLTFProperty.ts';

export interface KHRCharacterExpressionMappingExpressionSetMapping {
  [targetExpression: string]: Array<{
    /**
     * Index of the source expression in the top-level KHR_character_expression extension object.
     */
    source: number;

    /**
     * The name of the source expression.
     */
    name?: string;

    /**
     * Relative influence of this source expression on the target. Weights represent the proportional contribution needed to achieve the desired target result.
     */
    weight: number;
  }>;
}

export interface KHRCharacterExpressionMappingExpressionSetMappings {
  [expressionSetName: string]: KHRCharacterExpressionMappingExpressionSetMapping;
}

export interface KHRCharacterExpressionMapping extends GLTFProperty {
  expressionSetMappings: KHRCharacterExpressionMappingExpressionSetMappings;
}
