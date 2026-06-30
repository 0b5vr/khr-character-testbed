import type { KHRCharacterMeshVisibilityItem } from './KHRCharacterMeshVisibilityItem.ts';

export class KHRCharacterMeshVisibility {
  public readonly items: readonly KHRCharacterMeshVisibilityItem[];

  public constructor(items: readonly KHRCharacterMeshVisibilityItem[]) {
    this.items = items;
  }

  public setView(view: 'firstPerson' | 'thirdPerson'): void {
    for (const item of this.items) {
      item.object.visible = item.visibility === 'always' || item.visibility === view;
    }
  }
}
