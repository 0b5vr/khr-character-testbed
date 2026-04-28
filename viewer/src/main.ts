import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Inspector } from 'three/addons/inspector/Inspector.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';
import sampleGltf from './assets/twist-sample-with-khr.glb?url';
import { GLTFAnimationPointerExtension } from '@needle-tools/three-animation-pointer';
import { KHRCharacterExpressionLoaderPlugin } from './khr-character/expressions/KHRCharacterExpressionLoaderPlugin';
import type { KHRCharacterExpressionManager } from './khr-character/expressions/KHRCharacterExpressionManager';

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
loader.register((parser) => new KHRCharacterExpressionLoaderPlugin(parser));

const gltf = await loader.loadAsync(sampleGltf);
const expressionManager = gltf.userData.khrCharacterExpressionManager as KHRCharacterExpressionManager | undefined;
scene.add(gltf.scene);

// == gui for expressions ==========================================================================
const gui = inspector.createParameters('Expressions');
const params: Record<string, number> = {};

for (const expression of expressionManager?.expressions ?? []) {
  params[expression.expressionName] = expression.weight;
  gui.add(params, expression.expressionName, 0, 1).onChange((value) => {
    expressionManager?.setValue(expression.expressionName, value);
  });
}

// == animation loop ===============================================================================
const timer = new THREE.Timer();
renderer.setAnimationLoop(() => {
  timer.update();
  const delta = timer.getDelta();

  expressionManager?.update(delta);
  renderer.render(scene, camera);
});
