import * as THREE from 'three';
import type { GLTF, GLTFLoaderPlugin, GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF as GLTFSchema } from '@gltf-transform/core';
import type { VRMCCharacterExpressionLookat as VRMCCharacterExpressionLookatSchema } from '../../../../schematypes/VRMCCharacterExpressionLookat.ts';
import { VRMCCharacterExpressionLookat } from './VRMCCharacterExpressionLookat.ts';

export class VRMCCharacterExpressionLookatLoaderPlugin implements GLTFLoaderPlugin {
  public readonly parser: GLTFParser;

  public get name(): string {
    return 'VRMCCharacterExpressionLookatLoaderPlugin';
  }

  public constructor(parser: GLTFParser) {
    this.parser = parser;
  }

  public async afterRoot(gltf: GLTF): Promise<void> {
    gltf.userData.vrmcCharacterExpressionLookat = await this._import(gltf);
  }

  public async _import(gltf: GLTF): Promise<VRMCCharacterExpressionLookat | null> {
    const json = gltf.parser.json as GLTFSchema.IGLTF;

    const isExtensionUsed = json.extensionsUsed?.includes('VRMC_character_expression_lookat');
    if (!isExtensionUsed) {
      return null;
    }

    const extension = json.extensions?.['VRMC_character_expression_lookat'] as VRMCCharacterExpressionLookatSchema | undefined;
    if (!extension) {
      console.warn('VRMC_character_expression_lookat extension is listed in extensionsUsed but not found in extensions.');
      return null;
    }

    const referenceNode = await this.parser.getDependency('node', extension.referenceNode) as THREE.Object3D | undefined;
    if (!referenceNode) {
      console.warn(`Node with index ${extension.referenceNode} not found for VRMC_character_expression_lookat.referenceNode.`);
      return null;
    }

    return new VRMCCharacterExpressionLookat({
      referenceNode,
      expressions: extension.expressions,
    });
  }
}
