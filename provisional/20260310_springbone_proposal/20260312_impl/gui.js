import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

export const guiParams = {
  movementMode: 'sin',
};

const gui = new GUI();
gui.add(guiParams, 'movementMode', ['sin', 'step', 'mouse']);
