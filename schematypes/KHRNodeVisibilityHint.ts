import type { GLTFProperty } from './GLTFProperty.ts';

/**
 * Annotates a node (and, by inheritance, its subtree) with a visibility role for view contexts such as first-person or third-person. Advisory: the runtime resolves visibility from the active view context according to the role's semantics and applies the result through KHR_node_visibility semantics.
 */
export interface KHRNodeVisibilityHint extends GLTFProperty {
  /**
   * One or more distinct nonempty visibility roles naming when the author intends the content to be visible; order has no meaning. The application's logic determines which roles apply in each render view. Standard values: 'always' (every view), 'first_person', and 'third_person'; where the application has no logic for a standard role, it applies in every view, and an application that applies 'first_person' should apply 'third_person' wherever 'first_person' does not apply. Any other value is a custom role; a host ignores custom roles it does not recognize. The hint allows a view when at least one recognized role applies there; a hint whose roles include 'always', or that has no recognized role, imposes no restriction. Ancestor node hints and KHR_node_visibility can further restrict visibility; 'always' cannot cancel an ancestor's restriction.
   */
  roles: string[];

  /**
   * Human-readable label for this visibility annotation. Used for UI display in authoring tools and inspectors.
   */
  label?: string;
}
