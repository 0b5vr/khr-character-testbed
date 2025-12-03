import { GLTFProperty } from './GLTFProperty.ts';

export interface KHRVirtualTransformsVirtualTransform extends GLTFProperty {
  name: string;
  parent: number;
  translation?: [number, number, number];
  rotation?: [number, number, number, number];
  scale?: [number, number, number];
  respectParentPosition?: boolean;
  respectParentRotation?: boolean;
  respectParentScale?: boolean;
  tags?: string[];
}
