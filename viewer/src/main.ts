import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Inspector } from 'three/addons/inspector/Inspector.js';
import './style.css';
import sampleGltf from './assets/khr-character-example.glb?url';
import { VRMAnimation } from '@pixiv/three-vrm-animation';
import { loadGLTF } from './loadGLTF';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { KHRCharacterExpressionManager } from './khr-character/expressions/KHRCharacterExpressionManager';
import { VRMUtils } from '@pixiv/three-vrm';
import type { VRMCCharacterExpressionLookat } from './khr-character/lookat/VRMCCharacterExpressionLookat';
import { createKHRCharacterHumanoidAnimationTracks } from './createKHRCharacterHumanoidAnimationTracks';
import { createKHRCharacterVRMHumanoidRestPose } from './createKHRCharacterVRMHumanoidRestPose';
import type { KHRCharacterVRMHumanoidRestPose } from './KHRCharacterVRMHumanoidRestPose';
import smartphoneVrma from './assets/smartphone.vrma?url';
import { handleDragAndDrop } from './utils/handleDragAndDrop';
import type { KHRNodeCameraHint } from './khr-character/camera-hint/KHRNodeCameraHint';
import { KHRNodeCameraHintHelper } from './khr-character/camera-hint/KHRNodeCameraHintHelper';
import type { KHRCharacterNodeVisibility } from './khr-character/node-visibility/KHRCharacterNodeVisibility';
import type { KHRCharacterMeshVisibility } from './khr-character/mesh-visibility/KHRCharacterMeshVisibility';
import { checkMaxTextureArrayLayers } from './utils/checkMaxTextureArrayLayers';

// == basic Three.js stuff =========================================================================
const canvas = document.getElementById('canvas') as HTMLCanvasElement;

const maxTextureArrayLayers = await checkMaxTextureArrayLayers();
console.log(maxTextureArrayLayers);

const renderer = new WebGPURenderer({
  canvas,
  antialias: true,
  requiredLimits: {
    maxTextureArrayLayers,
  },
});
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

// == gui for skeletons ============================================================================
const paramsSkeleton: Record<string, any> = {
  'vrmAnimation': 'none',
};
const guiSkeletons = inspector.createParameters('Skeleton');

guiSkeletons.add(paramsSkeleton, 'vrmAnimation', [ 'none', 'smartphone' ]).onChange((value) => {
  if (value === 'none') {
    currentVRMAnimation = null;
    playVRMAnimation();
  } else if (value === 'smartphone') {
    handleLoadGLTF(smartphoneVrma);
  }
});

// == gui for visibility ===========================================================================
const paramsVisibility = {
  view: 'thirdPerson' as 'firstPerson' | 'thirdPerson',
};
const guiVisibility = inspector.createParameters('Visibility');
guiVisibility.add(paramsVisibility, 'view', ['firstPerson', 'thirdPerson']).onChange(() => {
  updateVisibility();
});

// == gui for expressions ==========================================================================
const paramsExpressions: Record<string, number> = {};
const guiExpressions = inspector.createParameters('Expressions');

const paramsLookat = {
  lookAtMode: 'none' as 'none' | 'camera',
};
const guiLookat = inspector.createParameters('Look-at');
guiLookat.add(paramsLookat, 'lookAtMode', [ 'none', 'camera' ]).onChange((value) => {
  if (value !== 'none' && currentLookat == null) {
    console.warn('VRMC_character_expression_lookat extension is not available in this model.');
  }

  if (value === 'none' && currentLookat != null && currentExpressionManager != null) {
    // reset
    currentLookat.target = null;
    currentLookat.applyFromYawPitchToExpressionManager(currentExpressionManager, 0.0, 0.0);
  }
});

function setupExpressionsGUI() {
  // clear existing GUI
  // Since Inspector doesn't support removing parameters, we'll improvise it
  for (const param of [...(guiExpressions.paramList as any).children]) {
    (guiExpressions.paramList as any).remove(param);
  }

  // add expression parameters to the GUI
  for (const expression of currentExpressionManager?.expressions ?? []) {
    paramsExpressions[expression.expressionName] = expression.weight;
    guiExpressions.add(paramsExpressions, expression.expressionName, 0, 1).onChange((value) => {
      currentExpressionManager?.setValue(expression.expressionName, value);
    });
  }
}

// == gui for camera hint ==========================================================================
const paramsCameraHint = {
  showCameraHint: false,
};
const guiCameraHint = inspector.createParameters('Camera Hint');

guiCameraHint.add(paramsCameraHint, 'showCameraHint');

// == gltf =========================================================================================
let currentGLTF: GLTF | null = null;
let currentExpressionManager: KHRCharacterExpressionManager | null = null;
let currentLookat: VRMCCharacterExpressionLookat | null = null;
let currentVRMHumanoidRestPose: KHRCharacterVRMHumanoidRestPose | null = null;
let currentVRMAnimation: VRMAnimation | null = null;
let currentAnimationMixer: THREE.AnimationMixer | null = null;
let currentCameraHints: KHRNodeCameraHint[] | null = null;
let currentNodeVisibility: KHRCharacterNodeVisibility | null = null;
let currentMeshVisibility: KHRCharacterMeshVisibility | null = null;

function playVRMAnimation() {
  // stop existing animation
  if (currentAnimationMixer != null) {
    currentAnimationMixer.stopAllAction();
  }

  // play new animation, if both character and animation are available
  if (currentVRMAnimation != null) {
    if (currentVRMHumanoidRestPose == null || currentAnimationMixer == null) {
      console.warn('Unable to play VRM animation. Skeletal rig mapping "vrmHumanoid" is not available in this model.');
      return;
    }

    const humanoidTracks = createKHRCharacterHumanoidAnimationTracks(currentVRMAnimation, currentVRMHumanoidRestPose);
    const clip = new THREE.AnimationClip('Clip', currentVRMAnimation.duration, [...humanoidTracks.translation.values(), ...humanoidTracks.rotation.values()]);
    currentAnimationMixer.clipAction(clip).play();
  }
}

async function handleLoadGLTF(url: string) {
  const {
    gltf,
    skeletonMapping,
    expressionManager,
    lookat,
    cameraHints,
    nodeVisibility,
    meshVisibility,
    vrmAnimations,
  } = await loadGLTF(url);

  // when loaded GLTF is animation, skip setting character stuff
  if (vrmAnimations != null) {
    currentVRMAnimation = vrmAnimations[0];
  } else {
    // when loaded GLTF is character

    // dispose current resources
    if (currentGLTF != null) {
      scene.remove(currentGLTF.scene);
      VRMUtils.deepDispose(currentGLTF.scene);
    }

    // assign new resources
    currentGLTF = gltf;
    currentExpressionManager = expressionManager ?? null;
    currentLookat = lookat ?? null;
    currentVRMHumanoidRestPose = skeletonMapping != null
      ? createKHRCharacterVRMHumanoidRestPose(skeletonMapping)
      : null;
    currentAnimationMixer = currentVRMHumanoidRestPose != null
      ? new THREE.AnimationMixer(gltf.scene)
      : null;
    currentCameraHints = cameraHints ?? null;
    currentNodeVisibility = nodeVisibility ?? null;
    currentMeshVisibility = meshVisibility ?? null;

    // setup GUI
    setupExpressionsGUI();
    updateVisibility();

    // add the gltf root to the scene
    scene.add(gltf.scene);
  }

  playVRMAnimation();
}

// load sample GLTF at the beginning
await handleLoadGLTF(sampleGltf);

// == camera hint helper ===========================================================================
const cameraHintHelper = new KHRNodeCameraHintHelper();
cameraHintHelper.matrixAutoUpdate = false;
scene.add(cameraHintHelper);

function updateCameraHintHelper() {
  const hint = currentCameraHints?.find((h) => h.role === 'first_person');

  if (!paramsCameraHint.showCameraHint || hint == null) {
    cameraHintHelper.visible = false;
    return;
  }

  cameraHintHelper.visible = true;

  hint.node.updateWorldMatrix(true, false);
  cameraHintHelper.matrix.copy(hint.node.matrixWorld);
}

function updateVisibility() {
  currentNodeVisibility?.setView(paramsVisibility.view);
  currentMeshVisibility?.setView(paramsVisibility.view);
}

// == animation loop ===============================================================================
const timer = new THREE.Timer();
const lookatTarget = new THREE.Vector3();
renderer.setAnimationLoop(() => {
  timer.update();
  const delta = timer.getDelta();

  if (currentLookat != null && currentExpressionManager != null) {
    if (paramsLookat.lookAtMode === 'camera') {
      camera.getWorldPosition(lookatTarget);
      currentLookat.target = lookatTarget;
      currentLookat.applyFromTargetToExpressionManager(currentExpressionManager);
    }
  }

  updateCameraHintHelper();
  currentAnimationMixer?.update(delta);
  currentExpressionManager?.update(delta);
  renderer.render(scene, camera);
});

// == handle dnd ===================================================================================
handleDragAndDrop((url) => handleLoadGLTF(url));
