import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Inspector } from 'three/addons/inspector/Inspector.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';
import sampleGltf from './assets/twist-sample-with-khr.glb?url';
import { GLTFAnimationPointerExtension } from '@needle-tools/three-animation-pointer';

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

const loader = new GLTFLoader();
loader.register((parser) => new GLTFAnimationPointerExtension(parser));
const gltf = await loader.loadAsync(sampleGltf);
scene.add(gltf.scene);

// temp: test animation
const mixer = new THREE.AnimationMixer(gltf.scene);
const action = mixer.clipAction(gltf.animations[0]);
action.timeScale = 0;
action.play();

const timer = new THREE.Timer();

const params = {
  'time': 0.0,
}
const gui = inspector.createParameters('Parameters');

gui.add(params, 'time', 0, 1).onChange((value) => {
  action.time = value;
});

renderer.setAnimationLoop(() => {
  timer.update();
  const delta = timer.getDelta();

  mixer.update(delta);
  renderer.render(scene, camera);
});
