import type { GLTFProperty } from './GLTFProperty.ts';
import { KHRVirtualTransformsVirtualTransform } from './KHRVirtualTransformsVirtualTransform.ts';

export interface KHRVirtualTransforms extends GLTFProperty {
  virtualTransforms: KHRVirtualTransformsVirtualTransform[];
}
