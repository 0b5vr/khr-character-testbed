import type { GLTFProperty } from './GLTFProperty.ts';

/**
 * Nonempty dictionary of input expression keys. Each value lists weighted contributions from that input to native expression drivers.
 */
export interface KHRCharacterExpressionMappingExpressionSetMapping {
  /**
   * Nonempty array of contributions from this input to native expression drivers.
   */
  [targetExpression: string]: Array<{
    /**
     * Index of the native expression to drive in the top-level KHR_character_expression expressions array.
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

/**
 * Nonempty dictionary of mapping sets from external expression inputs to native expression drivers. Each key identifies one external vocabulary.
 */
export interface KHRCharacterExpressionMappingExpressionSetMappings {
  /**
   * Nonempty dictionary of input expression keys. Each value lists weighted contributions from that input to native expression drivers.
   */
  [expressionSetName: string]: KHRCharacterExpressionMappingExpressionSetMapping;
}

/**
 * Maps inputs from external expression vocabularies to native expression drivers.
 */
export interface KHRCharacterExpressionMapping extends GLTFProperty {
  /**
   * Nonempty dictionary of mapping sets from external expression inputs to native expression drivers. Each key identifies one external vocabulary.
   */
  expressionSetMappings: KHRCharacterExpressionMappingExpressionSetMappings;
}
