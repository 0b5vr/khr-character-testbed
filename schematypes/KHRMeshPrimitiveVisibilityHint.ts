import type { GLTFProperty } from './GLTFProperty.ts';

/**
 * Associates one mesh primitive, in every instance of the mesh, with one or more visibility roles that say when it is meant to be visible; the application's logic decides when each role applies. The hint is not inherited and adds a restriction to the containing node's ancestor-inclusive visibility hints. The specification recommends rendering from these results; applying hints does not alter glTF-authored or animated data.
 */
export interface KHRMeshPrimitiveVisibilityHint extends GLTFProperty {
  /**
   * One or more distinct nonempty visibility roles naming when the author intends the content to be visible; order has no meaning. The application's logic determines which roles apply in each render view. Standard values: 'always' (every view), 'first_person', and 'third_person'; where the application has no logic for a standard role, it applies in every view, and an application that applies 'first_person' should apply 'third_person' wherever 'first_person' does not apply. Any other value is a custom role; a host ignores custom roles it does not recognize. The hint allows a view when at least one recognized role applies there; a hint whose roles include 'always', or that has no recognized role, imposes no restriction. The containing node's ancestor-inclusive hint visibility and KHR_node_visibility can still hide the primitive.
   */
  roles: string[];

  /**
   * Nonempty human-readable label, preferred over the roles when a host or tool presents the hint to a user. It has no effect on visibility.
   */
  label?: string;
}
