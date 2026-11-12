import type { GLTFProperty } from './GLTFProperty.ts';

/**
 * Annotates a mesh primitive with a visibility role for view contexts such as first-person or third-person. Applies to this primitive only (no inheritance). Advisory: the runtime resolves visibility from the active view context according to the role's semantics. Use when a view-context-specific region is baked into a mesh that cannot be separated by node.
 */
export interface KHRMeshPrimitiveVisibilityHint extends GLTFProperty {
  /**
   * One or more distinct nonempty visibility roles naming when the author intends the content to be visible; order has no meaning. The application's logic determines which roles apply in each render view. Standard values: 'always' (every view), 'first_person', and 'third_person'; where the application has no logic for a standard role, it applies in every view, and an application that applies 'first_person' should apply 'third_person' wherever 'first_person' does not apply. Any other value is a custom role; a host ignores custom roles it does not recognize. The hint allows a view when at least one recognized role applies there; a hint whose roles include 'always', or that has no recognized role, imposes no restriction. The containing node's ancestor-inclusive hint visibility and KHR_node_visibility can still hide the primitive.
   */
  roles: string[];

  /**
   * Human-readable label for this visibility annotation. Used for UI display in authoring tools and inspectors.
   */
  label?: string;
}
