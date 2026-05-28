import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Inspector } from 'three/addons/inspector/Inspector.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';
import sampleGltf from './assets/khr-character-example.glb?url';
import smartphoneVrma from './assets/smartphone.vrma?url';
import { GLTFAnimationPointerExtension } from '@needle-tools/three-animation-pointer';
import { KHRCharacterExpressionLoaderPlugin } from './khr-character/expressions/KHRCharacterExpressionLoaderPlugin';
import type { KHRCharacterExpressionManager } from './khr-character/expressions/KHRCharacterExpressionManager';
import { VRMCCharacterExpressionLookatLoaderPlugin } from './khr-character/lookat/VRMCCharacterExpressionLookatLoaderPlugin';
import type { VRMCCharacterExpressionLookat } from './khr-character/lookat/VRMCCharacterExpressionLookat';
import { KHRCharacterSkeletonLoaderPlugin } from './khr-character/skeleton/KHRCharacterSkeletonLoaderPlugin';
import { loadVRMAnimation } from './loadVRMAnimation';
import { vrmSkeletonMappingToVRMHumanoid } from './vrmSkeletonMappingToVRMHumanoid';
import { createVRMAnimationClip } from '@pixiv/three-vrm-animation';
import { VRMCore } from '@pixiv/three-vrm-core';

// == basic Three.js stuff =========================================================================
const canvas = document.getElementById('canvas') as HTMLCanvasElement;

const renderer = new WebGPURenderer({ canvas, antialias: true });
renderer.setClearColor(0x000000, 1);
renderer.setSize(window.innerWidth, window.innerHeight);

const inspector = new Inspector();
renderer.inspector = inspector;

const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 20);
camera.position.set(0, 1, 3);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.update();

const scene = new THREE.Scene();

const light = new THREE.DirectionalLight(0xffffff, Math.PI);
light.position.set(1, 2, 3);
scene.add(light);

// == gltf =========================================================================================
const loader = new GLTFLoader();
loader.register((parser) => new GLTFAnimationPointerExtension(parser));
loader.register((parser) => new KHRCharacterSkeletonLoaderPlugin(parser));
loader.register((parser) => new KHRCharacterExpressionLoaderPlugin(parser));
loader.register((parser) => new VRMCCharacterExpressionLookatLoaderPlugin(parser));

const gltf = await loader.loadAsync(sampleGltf);
scene.add(gltf.scene);

// KHR_character_expression
const expressionManager = gltf.userData.khrCharacterExpressionManager as KHRCharacterExpressionManager | undefined;

// VRMC_character_expression_lookat
const lookat = gltf.userData.vrmcCharacterExpressionLookat as VRMCCharacterExpressionLookat | undefined;

// KHR_character_skeleton_mapping -> VRMHumanoid
const khrCharacterSkeletonMapping = gltf.userData.khrCharacterSkeletonMapping;
const vrmHumanoid = vrmSkeletonMappingToVRMHumanoid(khrCharacterSkeletonMapping);

let vrmForAnimation: VRMCore | null = null;
if (vrmHumanoid != null) {
  gltf.scene.add(vrmHumanoid.normalizedHumanBonesRoot);
  vrmForAnimation = new VRMCore({
    scene: gltf.scene,
    humanoid: vrmHumanoid ?? undefined,
    meta: { // temporary meta, since VRMCore requires it
      metaVersion: '1',
      name: '-',
      authors: ['-'],
      licenseUrl: 'https://vrm.dev/licenses/1.0/',
    },
  });
}

// == vrma =========================================================================================
let animationMixer: THREE.AnimationMixer | null = null;
if (vrmForAnimation != null) {
  const vrmAnimation = await loadVRMAnimation(smartphoneVrma);

  const animationClip = createVRMAnimationClip(vrmAnimation, vrmForAnimation);
  animationMixer = new THREE.AnimationMixer(vrmForAnimation.scene);
  animationMixer.clipAction(animationClip).play();
}

// == gui for expressions ==========================================================================
const paramsExpressions: Record<string, number> = {};
const guiExpressions = inspector.createParameters('Expressions');

for (const expression of expressionManager?.expressions ?? []) {
  paramsExpressions[expression.expressionName] = expression.weight;
  guiExpressions.add(paramsExpressions, expression.expressionName, 0, 1).onChange((value) => {
    expressionManager?.setValue(expression.expressionName, value);
  });
}

const paramsLookat = {
  lookAtMode: 'none' as 'none' | 'camera',
};
const guiLookat = inspector.createParameters('Look-at');

guiLookat.add(paramsLookat, 'lookAtMode', [ 'none', 'camera' ]).onChange((value) => {
  if (value !== 'none' && lookat == null) {
    console.warn('VRMC_character_expression_lookat extension is not available in this model.');
  }

  if (value === 'none' && lookat != null && expressionManager != null) {
    // reset
    lookat.target = null;
    lookat.applyFromYawPitchToExpressionManager(expressionManager, 0.0, 0.0);
  }
});

// == animation loop ===============================================================================
const timer = new THREE.Timer();
const lookatTarget = new THREE.Vector3();
renderer.setAnimationLoop(() => {
  timer.update();
  const delta = timer.getDelta();

  if (lookat != null && expressionManager != null) {
    if (paramsLookat.lookAtMode === 'camera') {
      camera.getWorldPosition(lookatTarget);
      lookat.target = lookatTarget;
      lookat.applyFromTargetToExpressionManager(expressionManager);
    }
  }

  animationMixer?.update(delta);
  vrmForAnimation?.update(delta);
  expressionManager?.update(delta);
  renderer.render(scene, camera);
});
