import type { GLTFProperty } from './GLTFProperty.ts';

/**
 * Annotates a mesh primitive with a visibility role for view contexts such as first-person or third-person. Applies to this primitive only (no inheritance). Advisory: the runtime resolves visibility from the active view context according to the role's semantics. Use when a view-context-specific region is baked into a mesh that cannot be separated by node.
 */
export interface KHRMeshPrimitiveVisibilityHint extends GLTFProperty {
  /**
   * The view context in which this primitive is visible. Standard vocabulary values ('always', 'first_person', 'third_person') provide interoperability guarantees; custom, vendor-prefixed values are permitted for domain-specific view contexts.
   */
  role: string;

  /**
   * Human-readable label for this visibility annotation. Used for UI display in authoring tools and inspectors.
   */
  label?: string;
}
