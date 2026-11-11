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
     * Optional label for this mapping entry, independent of the referenced expression name.
     */
    name?: string;

    /**
     * Contribution coefficient in [0, 1] from this external input to the referenced native expression driver.
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
 * glTF extension that enables encoding multiple expression set mappings, mapping external inputs to native expression drivers.
 */
export interface KHRCharacterExpressionMapping extends GLTFProperty {
  /**
   * Dictionary of expression set mappings, where each key is a target expression set name.
   */
  expressionSetMappings: KHRCharacterExpressionMappingExpressionSetMappings;
}
