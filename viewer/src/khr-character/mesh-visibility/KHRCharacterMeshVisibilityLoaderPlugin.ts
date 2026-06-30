import type * as THREE from 'three';
import {
  type GLTF,
  type GLTFLoaderPlugin,
  type GLTFParser,
  type GLTFReference,
} from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF as GLTFSchema } from '@gltf-transform/core';
import type { KHRCharacterMeshVisibility as KHRCharacterMeshVisibilitySchema } from '../../../../schematypes/KHRCharacterMeshVisibility.ts';
import { KHRCharacterMeshVisibility } from './KHRCharacterMeshVisibility';
import { type KHRCharacterMeshVisibilityItem } from './KHRCharacterMeshVisibilityItem.ts';

const EXTENSION_NAME = 'KHR_character_mesh_visibility';

/**
 * `GLTFReference` should have `primitives` property, but it's not defined in the type definition.
 * After the PR below is merged we can remove this and use `GLTFReference` directly.
 *
 * Ongoing PR: https://github.com/three-types/three-ts-types/pull/2242
 */
interface GLTFPrimitiveReference extends GLTFReference {
  primitives?: number;
}

function validateVisibilityValue(value: unknown): value is KHRCharacterMeshVisibilitySchema['visibility'] {
  return value === 'firstPerson' || value === 'thirdPerson' || value === 'always';
}

export class KHRCharacterMeshVisibilityLoaderPlugin
  implements GLTFLoaderPlugin {
  public readonly parser: GLTFParser;

  public get name(): string {
    return 'KHRCharacterMeshVisibilityLoaderPlugin';
  }

  public constructor(parser: GLTFParser) {
    this.parser = parser;
  }

  public async afterRoot(gltf: GLTF): Promise<void> {
    gltf.userData.khrCharacterMeshVisibility = await this._import(gltf);
  }

  public async _import(gltf: GLTF): Promise<KHRCharacterMeshVisibility | null> {
    const json = gltf.parser.json as GLTFSchema.IGLTF;

    const isExtensionUsed = json.extensionsUsed?.includes(EXTENSION_NAME);
    if (!isExtensionUsed) {
      return null;
    }

    const items: KHRCharacterMeshVisibilityItem[] = [];

    for (const scene of gltf.scenes) {
      scene.traverse((object: THREE.Object3D) => {
        const reference = this.parser.associations.get(object) as GLTFPrimitiveReference | undefined;
        if (reference?.meshes == null || reference.primitives == null) {
          return;
        }

        const primitiveDef = json.meshes?.[reference.meshes]?.primitives?.[reference.primitives];
        const extension = primitiveDef?.extensions?.[EXTENSION_NAME] as KHRCharacterMeshVisibilitySchema | undefined;
        if (extension == null) {
          return;
        }

        if (!validateVisibilityValue(extension.visibility)) {
          console.warn(`${EXTENSION_NAME} extension on mesh ${reference.meshes} primitive ${reference.primitives} does not have a valid visibility. Skipping.`);
          return;
        }

        items.push({
          object,
          visibility: extension.visibility,
        });
      });
    }

    return new KHRCharacterMeshVisibility(items);
  }
}
