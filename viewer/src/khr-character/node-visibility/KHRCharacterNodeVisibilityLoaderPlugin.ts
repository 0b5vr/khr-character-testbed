import * as THREE from 'three';
import {
  type GLTF,
  type GLTFLoaderPlugin,
  type GLTFParser,
} from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF as GLTFSchema } from '@gltf-transform/core';
import type { KHRCharacterNodeVisibility as KHRCharacterNodeVisibilitySchema } from '../../../../schematypes/KHRCharacterNodeVisibility.ts';
import { KHRCharacterNodeVisibility } from './KHRCharacterNodeVisibility';
import { type KHRCharacterNodeVisibilityItem } from './KHRCharacterNodeVisibilityItem.ts';

const EXTENSION_NAME = 'KHR_character_node_visibility';

function validateVisibilityValue(value: unknown): value is KHRCharacterNodeVisibilitySchema['visibility'] {
  return value === 'firstPerson' || value === 'thirdPerson' || value === 'always';
}

export class KHRCharacterNodeVisibilityLoaderPlugin
  implements GLTFLoaderPlugin {
  public readonly parser: GLTFParser;

  public get name(): string {
    return 'KHRCharacterNodeVisibilityLoaderPlugin';
  }

  public constructor(parser: GLTFParser) {
    this.parser = parser;
  }

  public async afterRoot(gltf: GLTF): Promise<void> {
    gltf.userData.khrCharacterNodeVisibility = await this._import(gltf);
  }

  public async _import(gltf: GLTF): Promise<KHRCharacterNodeVisibility | null> {
    const json = gltf.parser.json as GLTFSchema.IGLTF;

    const isExtensionUsed = json.extensionsUsed?.includes(EXTENSION_NAME);
    if (!isExtensionUsed) {
      return null;
    }

    const items: KHRCharacterNodeVisibilityItem[] = [];

    for (const [index, nodeDef] of (json.nodes ?? []).entries()) {
      const extension = nodeDef.extensions?.[EXTENSION_NAME] as KHRCharacterNodeVisibilitySchema | undefined;
      if (extension == null) {
        continue;
      }

      if (!validateVisibilityValue(extension.visibility)) {
        console.warn(`${EXTENSION_NAME} extension on node ${index} does not have a valid visibility. Skipping.`);
        continue;
      }

      const node = await this.parser.getDependency('node', index) as THREE.Object3D | undefined;
      if (!node) {
        console.error(`Unreachable. Node #${index} not found. GLTFLoader should have loaded it.`);
        continue;
      }

      items.push({
        node,
        visibility: extension.visibility,
      });
    }

    return new KHRCharacterNodeVisibility(items);
  }
}
