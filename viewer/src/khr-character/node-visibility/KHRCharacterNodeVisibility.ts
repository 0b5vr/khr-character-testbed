import type { KHRCharacterNodeVisibilityItem } from './KHRCharacterNodeVisibilityItem.ts';

export class KHRCharacterNodeVisibility {
  public readonly items: readonly KHRCharacterNodeVisibilityItem[];

  public constructor(items: readonly KHRCharacterNodeVisibilityItem[]) {
    this.items = items;
  }

  public setView(view: 'firstPerson' | 'thirdPerson'): void {
    for (const item of this.items) {
      item.node.visible = item.visibility === 'always' || item.visibility === view;
    }
  }
}
