import type { GLTFProperty } from './GLTFProperty.ts';
import { KHRMeshAnnotationRenderviewRenderVisibility } from './KHRMeshAnnotationRenderviewRenderVisibility.ts';

export interface KHRMeshAnnotationRenderview extends GLTFProperty {
  renderVisibility?: KHRMeshAnnotationRenderviewRenderVisibility;
}
