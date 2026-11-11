import type { KHRMeshPrimitiveVisibilityHintItem } from './KHRMeshPrimitiveVisibilityHintItem.ts';
import { isVisibilityHintRoleVisible } from '../visibility-hint/isVisibilityHintRoleVisible.ts';

export class KHRMeshPrimitiveVisibilityHint {
  public readonly items: readonly KHRMeshPrimitiveVisibilityHintItem[];
  private _view: string | ReadonlySet<string> = 'third_person';

  public constructor(items: readonly KHRMeshPrimitiveVisibilityHintItem[]) {
    this.items = items;
  }

  /** Select context without mutating authored or animated state. */
  public setView(view: string | ReadonlySet<string>): void {
    this._view = view;
  }

  /** Synchronous render scope: temporary instance state is always restored, even on failure. */
  public withView<T>(view: string | ReadonlySet<string> = this._view, render: () => T): T {
    const state = new Map(this.items.map(item => [item.object, item.object.visible]));
    try {
      for (const item of this.items) {
        item.object.visible = item.object.visible && isVisibilityHintRoleVisible(item.roles, view);
      }
      return render();
    } finally {
      for (const [object, visible] of state) {
        object.visible = visible;
      }
    }
  }
}
