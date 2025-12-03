import type { GLTFProperty } from './GLTFProperty.ts';

export interface KHRMeshAnnotation extends GLTFProperty {
  tags?: string[];
  customData?: Record<string, unknown>;
}
