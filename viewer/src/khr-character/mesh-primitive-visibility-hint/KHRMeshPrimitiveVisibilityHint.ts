import type { KHRMeshPrimitiveVisibilityHintItem } from './KHRMeshPrimitiveVisibilityHintItem.ts';
import { isVisibilityHintRoleVisible } from '../visibility-hint/isVisibilityHintRoleVisible.ts';

export class KHRMeshPrimitiveVisibilityHint {
  public readonly items: readonly KHRMeshPrimitiveVisibilityHintItem[];

  public constructor(items: readonly KHRMeshPrimitiveVisibilityHintItem[]) {
    this.items = items;
  }

  public setView(view: string): void {
    for (const item of this.items) {
      item.object.visible = isVisibilityHintRoleVisible(item.role, view);
    }
  }
}
