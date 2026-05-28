import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Inspector } from 'three/addons/inspector/Inspector.js';
import './style.css';
import sampleGltf from './assets/khr-character-example.glb?url';
import { createVRMAnimationClip, VRMAnimation } from '@pixiv/three-vrm-animation';
import { loadGLTF } from './loadGLTF';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { KHRCharacterExpressionManager } from './khr-character/expressions/KHRCharacterExpressionManager';
import type { VRMCore } from '@pixiv/three-vrm-core';
import { VRMUtils } from '@pixiv/three-vrm';
import type { VRMCCharacterExpressionLookat } from './khr-character/lookat/VRMCCharacterExpressionLookat';
import smartphoneVrma from './assets/smartphone.vrma?url';
import { handleDragAndDrop } from './utils/handleDragAndDrop';

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

// == gltf =========================================================================================
let currentGLTF: GLTF | null = null;
let currentExpressionManager: KHRCharacterExpressionManager | null = null;
let currentLookat: VRMCCharacterExpressionLookat | null = null;
let currentVRM: VRMCore | null = null;
let currentVRMAnimation: VRMAnimation | null = null;
let currentAnimationMixer: THREE.AnimationMixer | null = null;

function playVRMAnimation() {
  if (currentVRM != null && currentAnimationMixer != null && currentVRMAnimation != null) {
    const animationClip = createVRMAnimationClip(currentVRMAnimation, currentVRM);
    currentAnimationMixer.clipAction(animationClip).play();
  }
}

async function handleLoadGLTF(url: string) {
  const { gltf, expressionManager, lookat, vrm, vrmAnimations } = await loadGLTF(url);

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
    currentVRM = vrm ?? null;
    if (currentVRM != null) {
      currentAnimationMixer = new THREE.AnimationMixer(currentVRM.scene);
    }

    // setup GUI
    setupExpressionsGUI();

    // add the gltf root to the scene
    scene.add(gltf.scene);
  }

  playVRMAnimation();
}

await handleLoadGLTF(sampleGltf);
await handleLoadGLTF(smartphoneVrma);

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

  currentAnimationMixer?.update(delta);
  currentVRM?.update(delta);
  currentExpressionManager?.update(delta);
  renderer.render(scene, camera);
});

// == handle dnd ===================================================================================
handleDragAndDrop((url) => handleLoadGLTF(url));
