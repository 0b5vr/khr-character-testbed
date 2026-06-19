import { type convertVRMToKHRCharacter } from './convertVRMToKHRCharacter.ts';

/**
 * Options for {@link convertVRMToKHRCharacter}.
 */
export interface ConvertVRMToKHRCharacterOptions {
  /**
   * If true, the converter will log verbose messages to the console.
   * The implementation of verbose logging is pretty rough and vulnerable to parallel calls.
   */
  verbose?: boolean;
}
