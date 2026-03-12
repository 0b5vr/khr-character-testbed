import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

export const guiParams = {
  movementMode: 'sin',
  frameSkip: 1,
  springJointParams: {
    restoration: 0.1,
    inertia: 0.5,
    stiffness: 0.0,
  },
};

const gui = new GUI();

gui.add(guiParams, 'movementMode', ['sin', 'step', 'mouse']);

gui.add(guiParams, 'frameSkip', 1, 10, 1);

const springJointFolder = gui.addFolder('Spring Joint Parameters');
springJointFolder.add(guiParams.springJointParams, 'restoration', 0.0, 1.0);
springJointFolder.add(guiParams.springJointParams, 'inertia', 0.0, 1.0);
springJointFolder.add(guiParams.springJointParams, 'stiffness', 0.0, 1.0);
