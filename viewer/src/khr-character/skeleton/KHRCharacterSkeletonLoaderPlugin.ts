import * as THREE from 'three';
import { type GLTF, type GLTFParser, type GLTFLoaderPlugin } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { type GLTF as GLTFSchema } from '@gltf-transform/core';
import { type KHRCharacterSkeletonMapping as KHRCharacterSkeletonMappingSchema } from '../../../../schematypes/KHRCharacterSkeletonMapping.ts';
import { KHRCharacterSkeletonMapping } from './KHRCharacterSkeletonMapping.ts';

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

    const required = json.extensionsRequired?.includes('KHR_character_skeleton_mapping');
    const skip = (message: string): null => {
      console.warn(message);
      if (required) throw new Error('Required skeletal mapping is unavailable');
      return null;
    };
    const isExtensionUsed = json.extensionsUsed?.includes('KHR_character_skeleton_mapping');
    if (!isExtensionUsed && !required) {
      return null;
    }

    if (!isExtensionUsed) console.warn('KHR_character_skeleton_mapping is required but missing from extensionsUsed.');

    const extension = json.extensions?.['KHR_character_skeleton_mapping'] as KHRCharacterSkeletonMappingSchema | undefined;
    if (!extension || typeof extension !== 'object' || Array.isArray(extension)) {
      return skip('KHR_character_skeleton_mapping extension is missing or invalid.');
    }

    if (!json.extensionsUsed?.includes('KHR_character') || !json.extensions?.['KHR_character']) {
      console.warn('KHR_character_skeleton_mapping requires KHR_character');
    }
    if (!extension.skeletalRigMappings || typeof extension.skeletalRigMappings !== 'object' || Array.isArray(extension.skeletalRigMappings) || !Object.keys(extension.skeletalRigMappings).length) {
      return skip('Skeletal rig mappings must not be empty.');
    }

    const skeletonMapping = new KHRCharacterSkeletonMapping();

    // build a map, target rig name -> (target joint name -> node)
    const skeletalRigMappings: Map<string, Map<string, THREE.Object3D>> = new Map();
    for (const [targetRigName, mapping] of Object.entries(extension.skeletalRigMappings)) {
      if (!targetRigName.length || !mapping || typeof mapping !== 'object' || Array.isArray(mapping) || !Object.keys(mapping).length) {
        console.warn('Invalid skeletal mapping identifier or empty mapping. Skipping.');
        continue;
      }
      // build a map, target joint name -> node
      const targetJointNameToNodeMap: Map<string, THREE.Object3D> = new Map();

      for (const [targetJointName, association] of Object.entries(mapping)) {
        if (!targetJointName.length || !association || typeof association !== 'object' || Array.isArray(association)) {
          console.warn('Invalid skeletal role association. Skipping.');
          continue;
        }
        const sourceNodeIndex = association.node;
        if (!Number.isInteger(sourceNodeIndex) || sourceNodeIndex < 0 || sourceNodeIndex >= (json.nodes?.length ?? 0)) {
          console.warn(`Invalid source node index "${sourceNodeIndex}" for joint "${targetJointName}" in mapping "${targetRigName}".`);
          continue;
        }

        const node = await gltf.parser.getDependency('node', sourceNodeIndex);
        targetJointNameToNodeMap.set(targetJointName, node);
      }
      if (targetJointNameToNodeMap.size) skeletalRigMappings.set(targetRigName, targetJointNameToNodeMap);
    }

    if (!skeletalRigMappings.size) return skip('No usable skeletal mappings.');
    skeletonMapping.skeletalRigMappings = skeletalRigMappings;

    return skeletonMapping;
  }
}
