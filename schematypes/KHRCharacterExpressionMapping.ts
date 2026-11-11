import type { GLTFProperty } from './GLTFProperty.ts';

export interface KHRCharacterExpressionMappingExpressionSetMapping {
  /**
   * Array of source expression mappings that contribute to the target expression.
   */
  [targetExpression: string]: Array<{
    /**
     * Index of the source expression in the top-level KHR_character_expression extension object.
     */
    source: number;

    /**
     * Optional name of this mapping entry.
     */
    name?: string;

    /**
     * Contribution coefficient from this external input to the referenced native expression driver.
     */
    weight: number;
  }>;
}

export interface KHRCharacterExpressionMappingExpressionSetMappings {
  /**
   * Expression mapping dictionary where each key is a target expression name and each value is an array of source expression mappings.
   */
  [expressionSetName: string]: KHRCharacterExpressionMappingExpressionSetMapping;
}

/**
 * Maps inputs from external expression vocabularies to native expression drivers.
 */
export interface KHRCharacterExpressionMapping extends GLTFProperty {
  /**
   * Dictionary of expression set mappings, where each key is a target expression set name.
   */
  expressionSetMappings: KHRCharacterExpressionMappingExpressionSetMappings;
}
