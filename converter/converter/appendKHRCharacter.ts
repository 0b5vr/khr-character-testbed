import type { GLTF } from '@gltf-transform/core';
import type { KHRCharacter } from '../../schematypes/KHRCharacter.ts';

/** Designate this asset as containing one character; no hierarchy is implied. */
export function appendKHRCharacter(gltf: GLTF.IGLTF): void {
  gltf.extensionsUsed = [...new Set([...(gltf.extensionsUsed ?? []), 'KHR_character'])];
  gltf.extensions ||= {};
  gltf.extensions['KHR_character'] = {} satisfies KHRCharacter;
}
