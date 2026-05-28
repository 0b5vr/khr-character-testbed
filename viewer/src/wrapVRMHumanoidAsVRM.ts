import * as THREE from 'three';
import { VRMCore, VRMHumanoid } from '@pixiv/three-vrm-core';
import { type createVRMAnimationClip } from '@pixiv/three-vrm-animation';

/**
 * Wrap a {@link VRMHumanoid} as a {@link VRMCore}.
 * Intended to be used when you only have a VRMHumanoid and want to use it with {@link createVRMAnimationClip}.
 *
 * This function also add the {@link VRMHumanoid.normalizedHumanBonesRoot} to the scene, which is necessary for the normalized bones to work correctly.
 *
 * @param scene - The GLTF root.
 * @param vrmHumanoid - The VRMHumanoid to wrap.
 * @return A VRMCore instance that contains the given VRMHumanoid.
 */
export function wrapVRMHumanoidAsVRM(scene: THREE.Group, vrmHumanoid: VRMHumanoid): VRMCore {
  scene.add(vrmHumanoid.normalizedHumanBonesRoot);

  return new VRMCore({
    scene,
    humanoid: vrmHumanoid,
    meta: { // temporary meta, since VRMCore requires it
      metaVersion: '1',
      name: '-',
      authors: ['-'],
      licenseUrl: 'https://vrm.dev/licenses/1.0/',
    },
  });
}
