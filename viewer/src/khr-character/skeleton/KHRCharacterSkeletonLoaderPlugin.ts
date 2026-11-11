import * as THREE from 'three';
import { type GLTF, type GLTFParser, type GLTFLoaderPlugin } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { type GLTF as GLTFSchema } from '@gltf-transform/core';
import { type KHRCharacterSkeletonMapping as KHRCharacterSkeletonMappingSchema } from '../../../../schematypes/KHRCharacterSkeletonMapping.ts';
import { KHRCharacterSkeletonMapping } from './KHRCharacterSkeletonMapping';

/**
 * A GLTFLoader plugin for loading `KHR_character_skeleton_mapping` extension.
 *
 * It reads the content of `KHR_character_skeleton_mapping` extension and creates a {@link KHRCharacterSkeletonMapping}.
 * The created {@link KHRCharacterSkeletonMapping} is stored in `gltf.userData.khrCharacterSkeletonMapping` property.
 */
export class KHRCharacterSkeletonLoaderPlugin implements GLTFLoaderPlugin {
  public readonly parser: GLTFParser;

  public get name(): string {
    return 'KHRCharacterSkeletonLoaderPlugin';
  }

  public constructor(parser: GLTFParser) {
    this.parser = parser;
  }

  public async afterRoot(gltf: GLTF): Promise<void> {
    gltf.userData.khrCharacterSkeletonMapping = await this._import(gltf);
  }

  public async _import(gltf: GLTF): Promise<any> {
    const json = gltf.parser.json as GLTFSchema.IGLTF;

    const isExtensionUsed = json.extensionsUsed?.includes('KHR_character_skeleton_mapping');
    if (!isExtensionUsed) {
      return null;
    }

    const extension = json.extensions?.['KHR_character_skeleton_mapping'] as KHRCharacterSkeletonMappingSchema | undefined;
    if (!extension) {
      console.warn('KHR_character_skeleton_mapping extension is listed in extensionsUsed but not found in extensions.');
      return null;
    }

    if (!json.extensionsUsed?.includes('KHR_character') || !json.extensions?.['KHR_character']) {
      throw new Error('KHR_character_skeleton_mapping requires KHR_character');
    }
    if (!extension.skeletalRigMappings || !Object.keys(extension.skeletalRigMappings).length) {
      throw new Error('Skeletal rig mappings must not be empty');
    }

    const skeletonMapping = new KHRCharacterSkeletonMapping();

    // build a map, target rig name -> (target joint name -> node)
    const skeletalRigMappings: Map<string, Map<string, THREE.Object3D>> = new Map();
    for (const [targetRigName, mapping] of Object.entries(extension.skeletalRigMappings)) {
      if (!targetRigName.length || !Object.keys(mapping).length || Object.keys(mapping).some(role => !role.length)) {
        throw new Error('Invalid skeletal mapping identifier or empty mapping');
      }
      // build a map, target joint name -> node
      const targetJointNameToNodeMap: Map<string, THREE.Object3D> = new Map();

      for (const [targetJointName, association] of Object.entries(mapping)) {
        const sourceNodeIndex = association.node;
        if (!Number.isInteger(sourceNodeIndex) || sourceNodeIndex < 0 || sourceNodeIndex >= (json.nodes?.length ?? 0)) {
          console.warn(`Invalid source node index "${sourceNodeIndex}" for joint "${targetJointName}" in mapping "${targetRigName}".`);
          continue;
        }

        const node = await gltf.parser.getDependency('node', sourceNodeIndex);
        targetJointNameToNodeMap.set(targetJointName, node);
      }
      skeletalRigMappings.set(targetRigName, targetJointNameToNodeMap);
    }

    skeletonMapping.skeletalRigMappings = skeletalRigMappings;

    return skeletonMapping;
  }
}
