import { isVisibilityHintRoleVisible } from '../visibility-hint/isVisibilityHintRoleVisible.ts';
import type { KHRNodeVisibilityHintItem } from './KHRNodeVisibilityHintItem.ts';

export class KHRNodeVisibilityHint {
  public readonly items: readonly KHRNodeVisibilityHintItem[];

  public constructor(items: readonly KHRNodeVisibilityHintItem[]) {
    this.items = items;
  }

  public setView(view: string): void {
    for (const item of this.items) {
      item.node.visible = isVisibilityHintRoleVisible(item.role, view);
    }
  }
}
