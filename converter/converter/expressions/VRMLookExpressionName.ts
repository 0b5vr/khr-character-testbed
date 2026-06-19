export const VRMLookExpressionName = [
  'lookUp',
  'lookDown',
  'lookLeft',
  'lookRight',
] as const;

export type VRMLookExpressionName = (typeof VRMLookExpressionName)[number];

export const vrmLookExpressionNameSet: ReadonlySet<string> = new Set(
  VRMLookExpressionName,
);
