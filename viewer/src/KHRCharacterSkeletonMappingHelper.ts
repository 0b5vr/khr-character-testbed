import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import type { KHRCharacterSkeletonMapping } from './khr-character/skeleton/KHRCharacterSkeletonMapping';

export class KHRCharacterSkeletonMappingHelper {
  public readonly skeletonMapping: KHRCharacterSkeletonMapping;
  private readonly _helperSet: Set<THREE.Object3D> = new Set();

  public constructor(skeletonMapping: KHRCharacterSkeletonMapping) {
    this.skeletonMapping = skeletonMapping;
    this._setupObjects();
  }

  public setVisible(visible: boolean): void {
    for (const ob of this._helperSet) {
      ob.visible = visible;
    }
  }

  public dispose(): void {
    for (const ob of this._helperSet) {
      if (ob.parent) {
        ob.parent.remove(ob);
      }
    }
    this._helperSet.clear();
  }

  private _setupObjects(): void {
    const mappings = this.skeletonMapping.skeletalRigMappings;

    for (const [mappingName, mapping] of mappings) {
      for (const [jointName, node] of mapping) {
        const div = document.createElement('div');

        const label = document.createElement('div');
        label.innerText = `${mappingName}\n${jointName}`;
        label.className = 'skeleton-mapping-helper-label';
        div.appendChild(label);

        const point = document.createElement('div');
        point.className = 'skeleton-mapping-helper-point';
        div.appendChild(point);

        const ob = new CSS2DObject(div);
        ob.center.set(0.0, 0.5);
        node.add(ob);
        this._helperSet.add(ob);
      }
    }
  }
}
