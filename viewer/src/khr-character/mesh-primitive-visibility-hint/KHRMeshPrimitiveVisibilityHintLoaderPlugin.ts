import type * as THREE from 'three';
import {
  type GLTF,
  type GLTFLoaderPlugin,
  type GLTFParser,
  type GLTFReference,
} from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF as GLTFSchema } from '@gltf-transform/core';
import type { KHRMeshPrimitiveVisibilityHint as KHRMeshPrimitiveVisibilityHintSchema } from '../../../../schematypes/KHRMeshPrimitiveVisibilityHint.ts';
import { KHRMeshPrimitiveVisibilityHint } from './KHRMeshPrimitiveVisibilityHint.ts';
import type { KHRMeshPrimitiveVisibilityHintItem } from './KHRMeshPrimitiveVisibilityHintItem.ts';

const EXTENSION_NAME = 'KHR_mesh_primitive_visibility_hint';

/**
 * `GLTFReference` should have a `primitives` property, but it is not currently
 * defined in the Three.js type declaration.
 */
interface GLTFPrimitiveReference extends GLTFReference {
  primitives?: number;
}

export class KHRMeshPrimitiveVisibilityHintLoaderPlugin
  implements GLTFLoaderPlugin {
  public readonly parser: GLTFParser;

  public get name(): string {
    return EXTENSION_NAME;
  }

  public constructor(parser: GLTFParser) {
    this.parser = parser;
  }

  public async afterRoot(gltf: GLTF): Promise<void> {
    gltf.userData.khrMeshPrimitiveVisibilityHint = await this._import(gltf);
  }

  public async _import(gltf: GLTF): Promise<KHRMeshPrimitiveVisibilityHint | null> {
    const json = gltf.parser.json as GLTFSchema.IGLTF;

    if (!json.extensionsUsed?.includes(EXTENSION_NAME)) {
      return null;
    }

    const items: KHRMeshPrimitiveVisibilityHintItem[] = [];

    for (const scene of gltf.scenes) {
      scene.traverse((object: THREE.Object3D) => {
        const reference = this.parser.associations.get(object) as GLTFPrimitiveReference | undefined;
        if (reference?.meshes == null || reference.primitives == null) {
          return;
        }

        const primitiveDef = json.meshes?.[reference.meshes]?.primitives?.[reference.primitives];
        const extension = primitiveDef?.extensions?.[EXTENSION_NAME] as KHRMeshPrimitiveVisibilityHintSchema | undefined;
        if (extension == null) {
          return;
        }

        items.push({
          object,
          role: extension.role,
          label: extension.label,
        });
      });
    }

    return new KHRMeshPrimitiveVisibilityHint(items);
  }
}
