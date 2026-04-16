import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Inspector } from 'three/addons/inspector/Inspector.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';
import sampleGltf from './assets/twist-sample-with-khr.glb?url';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

const renderer = new WebGPURenderer({ canvas, antialias: true });
renderer.setClearColor(0x000000, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.inspector = new Inspector();

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
const gltf = await loader.loadAsync(sampleGltf);
scene.add(gltf.scene);

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
