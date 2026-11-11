import { validateVisibilityRoles } from '../visibility-hint/isVisibilityHintRoleVisible.ts';
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
  roles: string[];
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
        roles: extension.roles,
        label: extension.label,
      };
    });

    if (json.extensionsRequired?.includes(EXTENSION_NAME)) throw new Error(`${EXTENSION_NAME} must not be required`);

    const items: KHRNodeVisibilityHintItem[] = [];

    // Keep each node's own restriction. Three.js traversal provides cumulative ancestor AND.
    for (const scene of gltf.scenes) {
      scene.traverse(object => {
        const reference = this.parser.associations.get(object) as GLTFNodeReference | undefined;
        const hint = reference?.nodes != null ? hints[reference.nodes] : undefined;
        if (hint) {
          validateVisibilityRoles(hint.roles);
          items.push({ node: object, roles: hint.roles, label: hint.label });
        }
      });
    }

    return new KHRNodeVisibilityHint(items);
  }
}
