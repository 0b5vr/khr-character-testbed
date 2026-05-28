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

    const skeletonMapping = new KHRCharacterSkeletonMapping();

    // Build a map, bone name -> node
    const boneNameToNodeMap: Map<string, THREE.Object3D> = new Map();
    for (const node of await gltf.parser.getDependencies('node')) {
      if (node.name) {
        boneNameToNodeMap.set(node.name, node);
      }
    }

    // build a map, rig mapping name -> (node -> mapping name)
    const skeletalRigMappings: Map<string, Map<THREE.Object3D, string>> = new Map();
    for (const [mappingName, mapping] of Object.entries(extension.skeletalRigMappings)) {
      // build a map, node -> mapping name
      const nodeToMappingNameMap: Map<THREE.Object3D, string> = new Map();

      for (const [boneName, mappingName] of Object.entries(mapping)) {
        const sanitizedBoneName = THREE.PropertyBinding.sanitizeNodeName(boneName);
        const node = boneNameToNodeMap.get(sanitizedBoneName);
        if (!node) {
          console.warn(`Bone with name "${sanitizedBoneName}" not found for mapping "${mappingName}".`);
          continue;
        }

        nodeToMappingNameMap.set(node, mappingName);
      }
      skeletalRigMappings.set(mappingName, nodeToMappingNameMap);
    }

    skeletonMapping.skeletalRigMappings = skeletalRigMappings;

    return skeletonMapping;
  }
}
