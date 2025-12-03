export const KHRMeshAnnotationRenderviewRenderVisibility = {
  Always: 'always',
  FirstPersonOnly: 'firstPersonOnly',
  ThirdPersonOnly: 'thirdPersonOnly',
  Never: 'never',
} as const;

export type KHRMeshAnnotationRenderviewRenderVisibility =
  (typeof KHRMeshAnnotationRenderviewRenderVisibility)[keyof typeof KHRMeshAnnotationRenderviewRenderVisibility];
