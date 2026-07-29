import type { GLTFProperty } from './GLTFProperty.ts';

export interface KHRMeshPrimitiveVisibilityHint extends GLTFProperty {
  role: string;
  label?: string;
}
