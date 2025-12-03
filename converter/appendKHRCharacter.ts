import type { GLTF } from 'npm:@gltf-transform/core@4.2.1';
import type { KHRCharacter } from '../schematypes/KHRCharacter.ts';

export function appendKHRCharacter(gltf: GLTF.IGLTF): void {
  gltf.extensionsUsed ||= [];
  gltf.extensionsUsed.push('KHR_character');

  gltf.extensions ||= {};
  gltf.extensions['KHR_character'] = {
    sceneIndex: gltf.scene ?? 0
  } satisfies KHRCharacter;
}
