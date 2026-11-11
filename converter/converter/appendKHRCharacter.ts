import type { GLTF } from '@gltf-transform/core';
import type { KHRCharacter } from '../../schematypes/KHRCharacter.ts';

/**
 * Appends the KHR_character extension to the given glTF model.
 *
 * @param gltf The glTF model to process.
 */
export function appendKHRCharacter(gltf: GLTF.IGLTF): void {
  // append KHR_character extension
  gltf.extensionsUsed ||= [];
  gltf.extensionsUsed.push('KHR_character');

  gltf.extensions ||= {};
  gltf.extensions['KHR_character'] = {} satisfies KHRCharacter;
}
