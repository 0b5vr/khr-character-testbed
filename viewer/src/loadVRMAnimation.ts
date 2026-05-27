import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMAnimation, VRMAnimationLoaderPlugin } from '@pixiv/three-vrm-animation';

export async function loadVRMAnimation(url: string): Promise<VRMAnimation> {
  const loader = new GLTFLoader();
  loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

  const gltf = await loader.loadAsync(url);
  const vrmAnimations = gltf.userData.vrmAnimations;
  return vrmAnimations[0];
}
