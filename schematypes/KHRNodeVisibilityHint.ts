import type { GLTFProperty } from './GLTFProperty.ts';

/**
 * Associates a node with one or more visibility roles that say when its content, and that of its descendants, is meant to be visible; the application's logic decides when each role applies. A hint allows a view when any of its recognized roles applies there; the node's own hint and all ancestor hints apply together, and a descendant hint cannot restore content an ancestor hides. The specification recommends rendering from these results; applying hints does not alter glTF-authored or animated node state.
 */
export interface KHRNodeVisibilityHint extends GLTFProperty {
  /**
   * One or more distinct nonempty visibility roles naming when the author intends the content to be visible; order has no meaning. The application's logic determines which roles apply in each render view. Standard values: 'always' (every view), 'first_person', and 'third_person'; where the application has no logic for a standard role, it applies in every view, and an application that applies 'first_person' should apply 'third_person' wherever 'first_person' does not apply. Any other value is a custom role; a host ignores custom roles it does not recognize. The hint allows a view when at least one recognized role applies there; a hint whose roles include 'always', or that has no recognized role, imposes no restriction. Ancestor node hints and KHR_node_visibility can further restrict visibility; 'always' cannot cancel an ancestor's restriction.
   */
  roles: string[];

  /**
   * Nonempty human-readable label, preferred over node.name and the roles when a host or tool presents the hint to a user. It has no effect on visibility.
   */
  label?: string;
}
