import type { GLTFProperty } from './GLTFProperty.ts';

/**
 * One labeled expression driver and its response animation.
 */
export interface KHRCharacterExpressionExpression extends GLTFProperty {
  /**
   * Nonempty descriptive name, unique among entries in the containing expressions array.
   */
  name: string;

  /**
   * Index of the animation used as this entry's expression response curve.
   */
  animation: number;
}

/**
 * Associates character-expression entries with animations used as normalized, stateless response curves.
 */
export interface KHRCharacterExpression extends GLTFProperty {
  /**
   * Nonempty array of expression entries with unique nonempty names. Array indices are the authoritative entry identities.
   */
  expressions: KHRCharacterExpressionExpression[];
}
