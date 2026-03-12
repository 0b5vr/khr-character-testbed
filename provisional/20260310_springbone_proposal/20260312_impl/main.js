import * as THREE from 'three';
import { SpringBoneGroup } from './SpringBoneGroup.js';
import { guiParams } from './gui.js';
import { mouse } from './mouse.js';

// canvas
const canvas = document.getElementById('canvas');
const { width, height } = canvas.getBoundingClientRect();

// renderer
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(width, height, false);
renderer.setPixelRatio(window.devicePixelRatio);

// camera
const camera = new THREE.PerspectiveCamera(45.0, width / height, 0.01, 100.0);
camera.position.set(0.0, 0.0, 8.0);

// scene
const scene = new THREE.Scene();

// light
const directionalLight = new THREE.DirectionalLight(0xffffff);
directionalLight.intensity = Math.PI;
directionalLight.position.set(3.0, 4.0, 5.0);
scene.add(directionalLight);

// spring bone group
const springBoneGroup = new SpringBoneGroup();
scene.add(springBoneGroup);

// loop
const clock = new THREE.Clock();
clock.start();

let frameCount = 0;

renderer.setAnimationLoop(() => {
  if (frameCount % 1 === 0) {
    const deltaTime = clock.getDelta();
    const time = clock.elapsedTime;

    springBoneGroup.setParams(guiParams.springJointParams);
    if (guiParams.movementMode === 'sin') {
      springBoneGroup.position.x = 2.0 * Math.sin(Math.PI * time);
    } else if (guiParams.movementMode === 'step') {
      springBoneGroup.position.x = (time % 2.0) < 1.0 ? -1.0 : 1.0;
    } else if (guiParams.movementMode === 'mouse') {
      const mouseX = (mouse.x / window.innerWidth) * 2.0 - 1.0;
      springBoneGroup.position.x = mouseX * 2.0;
    }
    springBoneGroup.update(deltaTime);

    renderer.render(scene, camera);
  }

  frameCount ++;
});

// resize handler
window.addEventListener('resize', () => {
  const { width, height } = canvas.getBoundingClientRect();
  renderer.setSize(width, height, false);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});