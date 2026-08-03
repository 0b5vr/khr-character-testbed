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
  /**
   * Expression mapping dictionary where each key is a target expression name and each value is an array of source expression mappings.
   */
  [expressionSetName: string]: KHRCharacterExpressionMappingExpressionSetMapping;
}

/**
 * glTF extension that enables encoding multiple expression set mappings, mapping source expressions present in the model to target expressions that a runtime/endpoint understands.
 */
export interface KHRCharacterExpressionMapping extends GLTFProperty {
  /**
   * Dictionary of expression set mappings, where each key is a target expression set name.
   */
  expressionSetMappings: KHRCharacterExpressionMappingExpressionSetMappings;
}
