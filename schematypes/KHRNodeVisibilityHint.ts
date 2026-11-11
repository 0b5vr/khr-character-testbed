import type { GLTFProperty } from './GLTFProperty.ts';

/**
 * Annotates a node (and, by inheritance, its subtree) with a visibility role for view contexts such as first-person or third-person. Advisory: the runtime resolves visibility from the active view context according to the role's semantics and applies the result through KHR_node_visibility semantics.
 */
export interface KHRNodeVisibilityHint extends GLTFProperty {
  /**
   * One or more distinct nonempty visibility roles. Standard vocabulary values ('always', 'first_person', 'third_person') provide interoperability guarantees; custom, vendor-prefixed values are permitted for domain-specific view contexts.
   */
  roles: string[];

  /**
   * Human-readable label for this visibility annotation. Used for UI display in authoring tools and inspectors.
   */
  label?: string;
}
