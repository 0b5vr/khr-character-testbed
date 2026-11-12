import type { GLTFProperty } from './GLTFProperty.ts';

/**
 * Classifies listed expression-animation channels as node-TRS channels.
 */
export interface KHRCharacterExpressionJoint extends GLTFProperty {
  /**
   * Nonempty array of unique indices classifying node-TRS channels. A consumer that supports this extension produces response records for the listed channels when the expression entry's effective driver is positive, subject to the base extension's target-support rules; a consumer that does not support it produces none for them. Every channel of the selected animation still contributes to the base expression duration.
   */
  channels: number[];
}
