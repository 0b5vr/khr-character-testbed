import { isVisibilityHintRoleVisible } from '../visibility-hint/isVisibilityHintRoleVisible.ts';
import type { KHRNodeVisibilityHintItem } from './KHRNodeVisibilityHintItem.ts';

export class KHRNodeVisibilityHint {
  public readonly items: readonly KHRNodeVisibilityHintItem[];
  private _view: string | ReadonlySet<string> = 'third_person';

  public constructor(items: readonly KHRNodeVisibilityHintItem[]) { this.items = items; }

  /** Select context without mutating authored or animated state. */
  public setView(view: string | ReadonlySet<string>): void { this._view = view; }

  /** Synchronous render scope: temporary instance state is always restored, even on failure. */
  public withView<T>(view: string | ReadonlySet<string> = this._view, render: () => T): T {
    const state = new Map(this.items.map(item => [item.node, item.node.visible]));
    try {
      for (const item of this.items) {
        item.node.visible = item.node.visible && isVisibilityHintRoleVisible(item.roles, view);
      }
      return render();
    } finally {
      for (const [object, visible] of state) object.visible = visible;
    }
  }
}
