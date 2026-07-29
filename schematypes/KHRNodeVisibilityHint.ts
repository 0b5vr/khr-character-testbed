import type { GLTFProperty } from './GLTFProperty.ts';

export interface KHRNodeVisibilityHint extends GLTFProperty {
  role: string;
  label?: string;
}
