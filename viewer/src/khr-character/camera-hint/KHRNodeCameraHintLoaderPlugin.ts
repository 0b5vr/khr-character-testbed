import * as THREE from 'three';
import { type GLTF, type GLTFLoaderPlugin, type GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF as GLTFSchema } from '@gltf-transform/core';
import type { KHRNodeCameraHint } from './KHRNodeCameraHint';

const EXTENSION_NAME = 'KHR_node_camera_hint';

type NodeWithCameraHint = NonNullable<GLTFSchema.IGLTF['nodes']>[number] & {
  extensions?: {
    [EXTENSION_NAME]?: {
      role?: unknown;
      label?: unknown;
    };
  };
};

export class KHRNodeCameraHintLoaderPlugin implements GLTFLoaderPlugin {
  public readonly parser: GLTFParser;

  public get name(): string {
    return 'KHRNodeCameraHintLoaderPlugin';
  }

  public constructor(parser: GLTFParser) {
    this.parser = parser;
  }

  public async afterRoot(gltf: GLTF): Promise<void> {
    gltf.userData.khrNodeCameraHints = await this._import(gltf);
  }

  public async _import(gltf: GLTF): Promise<KHRNodeCameraHint[] | null> {
    const json = gltf.parser.json as GLTFSchema.IGLTF;

    const isExtensionUsed = json.extensionsUsed?.includes(EXTENSION_NAME);
    if (!isExtensionUsed) {
      return null;
    }

    const cameraHints: KHRNodeCameraHint[] = [];

    for (const [index, nodeDef] of (json.nodes ?? []).entries()) {
      const extension = (nodeDef as NodeWithCameraHint).extensions?.[EXTENSION_NAME];
      if (extension == null) {
        continue;
      }

      if (typeof extension.role !== 'string') {
        console.warn(`${EXTENSION_NAME} extension on node ${index} does not have a valid role. Skipping.`);
        continue;
      }

      const node = await this.parser.getDependency('node', index) as THREE.Object3D | undefined;
      if (!node) {
        console.warn(`Node with index ${index} not found for ${EXTENSION_NAME}.`);
        continue;
      }

      cameraHints.push({
        node,
        role: extension.role,
        label: typeof extension.label === 'string' ? extension.label : undefined,
      });
    }

    return cameraHints;
  }
}
