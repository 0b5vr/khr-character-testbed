import type * as THREE from 'three';
import {
  type GLTF,
  type GLTFLoaderPlugin,
  type GLTFParser,
  type GLTFReference,
} from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF as GLTFSchema } from '@gltf-transform/core';
import type { KHRNodeVisibilityHint as KHRNodeVisibilityHintSchema } from '../../../../schematypes/KHRNodeVisibilityHint.ts';
import { KHRNodeVisibilityHint } from './KHRNodeVisibilityHint.ts';
import type { KHRNodeVisibilityHintItem } from './KHRNodeVisibilityHintItem.ts';

const EXTENSION_NAME = 'KHR_node_visibility_hint';

interface GLTFNodeReference extends GLTFReference {
  nodes?: number;
}

interface ParsedVisibilityHint {
  role: string;
  label?: string;
}

export class KHRNodeVisibilityHintLoaderPlugin
  implements GLTFLoaderPlugin {
  public readonly parser: GLTFParser;

  public get name(): string {
    return EXTENSION_NAME;
  }

  public constructor(parser: GLTFParser) {
    this.parser = parser;
  }

  public async afterRoot(gltf: GLTF): Promise<void> {
    gltf.userData.khrNodeVisibilityHint = this._import(gltf);
  }

  public _import(gltf: GLTF): KHRNodeVisibilityHint | null {
    const json = gltf.parser.json as GLTFSchema.IGLTF;

    if (!json.extensionsUsed?.includes(EXTENSION_NAME)) {
      return null;
    }

    const hints = (json.nodes ?? []).map((nodeDef): ParsedVisibilityHint | undefined => {
      const extension = nodeDef.extensions?.[EXTENSION_NAME] as KHRNodeVisibilityHintSchema | undefined;
      if (extension == null) {
        return undefined;
      }

      return {
        role: extension.role,
        label: extension.label,
      };
    });

    const items: KHRNodeVisibilityHintItem[] = [];

    const visit = (object: THREE.Object3D, inheritedHint: ParsedVisibilityHint): void => {
      const reference = this.parser.associations.get(object) as GLTFNodeReference | undefined;
      const ownHint = reference?.nodes != null ? hints[reference.nodes] : undefined;
      const effectiveHint = ownHint ?? inheritedHint;

      if (reference?.nodes != null) {
        items.push({
          node: object,
          role: effectiveHint.role,
          ...(ownHint?.label != null ? { label: ownHint.label } : {}),
        });
      }

      for (const child of object.children) {
        visit(child, effectiveHint);
      }
    };

    for (const scene of gltf.scenes) {
      visit(scene, { role: 'always' });
    }

    return new KHRNodeVisibilityHint(items);
  }
}
