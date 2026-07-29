import type { GLTFProperty } from './GLTFProperty.ts';

export interface KHRNodeCameraHint extends GLTFProperty {
  role: string;
  camera?: number;
  targetNode?: number;
  label?: string;
}
