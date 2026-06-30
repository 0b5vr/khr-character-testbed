import { GLTFAnimationPointerExtension } from '@needle-tools/three-animation-pointer';
import { VRMAnimation, VRMAnimationLoaderPlugin } from '@pixiv/three-vrm-animation';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KHRCharacterExpressionLoaderPlugin } from './khr-character/expressions/KHRCharacterExpressionLoaderPlugin';
import { VRMCCharacterExpressionLookatLoaderPlugin } from './khr-character/lookat/VRMCCharacterExpressionLookatLoaderPlugin';
import { KHRCharacterSkeletonLoaderPlugin } from './khr-character/skeleton/KHRCharacterSkeletonLoaderPlugin';
import type { KHRCharacterExpressionManager } from './khr-character/expressions/KHRCharacterExpressionManager';
import type { VRMCCharacterExpressionLookat } from './khr-character/lookat/VRMCCharacterExpressionLookat';
import type { KHRCharacterSkeletonMapping } from './khr-character/skeleton/KHRCharacterSkeletonMapping';
import { KHRNodeCameraHintLoaderPlugin } from './khr-character/camera-hint/KHRNodeCameraHintLoaderPlugin';
import type { KHRNodeCameraHint } from './khr-character/camera-hint/KHRNodeCameraHint';
import { KHRCharacterNodeVisibilityLoaderPlugin } from './khr-character/node-visibility/KHRCharacterNodeVisibilityLoaderPlugin';
import type { KHRCharacterNodeVisibility } from './khr-character/node-visibility/KHRCharacterNodeVisibility';
import { KHRCharacterMeshVisibilityLoaderPlugin } from './khr-character/mesh-visibility/KHRCharacterMeshVisibilityLoaderPlugin';
import type { KHRCharacterMeshVisibility } from './khr-character/mesh-visibility/KHRCharacterMeshVisibility';

/**
 * Create a GLTFLoader with bunch of KHR_character related plugins registered.
 */
function createLoader(): GLTFLoader {
  const loader = new GLTFLoader();

  loader.register((parser) => new GLTFAnimationPointerExtension(parser));
  loader.register((parser) => new KHRCharacterSkeletonLoaderPlugin(parser));
  loader.register((parser) => new KHRCharacterExpressionLoaderPlugin(parser));
  loader.register((parser) => new VRMCCharacterExpressionLookatLoaderPlugin(parser));
  loader.register((parser) => new KHRNodeCameraHintLoaderPlugin(parser));
  loader.register((parser) => new KHRCharacterNodeVisibilityLoaderPlugin(parser));
  loader.register((parser) => new KHRCharacterMeshVisibilityLoaderPlugin(parser));
  loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

  return loader;
}

/**
 * Load a GLTF file.
 * It also extracts KHR_character extensions and VRM Animations.
 *
 * @param url - The URL of the GLTF file to load.
 * @returns An object containing the loaded GLTF and bunch of extension related stuff.
 */
export async function loadGLTF(url: string): Promise<{
  gltf: GLTF;
  skeletonMapping: KHRCharacterSkeletonMapping | undefined;
  expressionManager: KHRCharacterExpressionManager | undefined;
  lookat: VRMCCharacterExpressionLookat | undefined;
  cameraHints: KHRNodeCameraHint[] | undefined;
  nodeVisibility: KHRCharacterNodeVisibility | undefined;
  meshVisibility: KHRCharacterMeshVisibility | undefined;
  vrmAnimations: VRMAnimation[] | undefined;
}> {
  const loader = createLoader();

  const gltf = await loader.loadAsync(url);

  const skeletonMapping = gltf.userData.khrCharacterSkeletonMapping as KHRCharacterSkeletonMapping | undefined;
  const expressionManager = gltf.userData.khrCharacterExpressionManager as KHRCharacterExpressionManager | undefined;
  const lookat = gltf.userData.vrmcCharacterExpressionLookat as VRMCCharacterExpressionLookat | undefined;
  const cameraHints = gltf.userData.khrNodeCameraHints as KHRNodeCameraHint[] | undefined;
  const nodeVisibility = gltf.userData.khrCharacterNodeVisibility as KHRCharacterNodeVisibility | undefined;
  const meshVisibility = gltf.userData.khrCharacterMeshVisibility as KHRCharacterMeshVisibility | undefined;

  const vrmAnimations = gltf.userData.vrmAnimations as VRMAnimation[] | undefined;

  return {
    gltf,
    skeletonMapping,
    expressionManager,
    lookat,
    cameraHints,
    nodeVisibility,
    meshVisibility,
    vrmAnimations,
  };
}
