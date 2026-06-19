import { type GLTF } from '@gltf-transform/core';
import { type convertVRMToKHRCharacter } from './convertVRMToKHRCharacter.ts';

/**
 * Result of {@link convertVRMToKHRCharacter}.
 */
export interface ConvertVRMToKHRCharacterResult {
  glb: Uint8Array;
  gltf: GLTF.IGLTF;
  binChunk: Uint8Array;
}
