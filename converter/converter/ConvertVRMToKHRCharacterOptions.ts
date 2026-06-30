import { type convertVRMToKHRCharacter } from './convertVRMToKHRCharacter.ts';

/**
 * Options for {@link convertVRMToKHRCharacter}.
 */
export interface ConvertVRMToKHRCharacterOptions {
  /**
   * When set, mesh nodes named "Face" or "Hair" get KHR_character_node_visibility with `visibility: "thirdPerson"`.
   */
  autoVisibility?: boolean;

  /**
   * When set, the converter will call this function with verbose messages.
   * The implementation of verbose logging is pretty rough and vulnerable to parallel calls.
   */
  verboseHandler?: (...message: string[]) => void;
}
