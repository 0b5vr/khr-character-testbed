import type { GLTF } from '@gltf-transform/core';
import type { KHRCharacterExpressionExpression } from '../../../../schematypes/KHRCharacterExpression.ts';

const domains = ['KHR_character_expression_joint', 'KHR_character_expression_morphtarget', 'KHR_character_expression_texture_transform'] as const;

/** Resolve core and pointer forms to one concrete authored property identity. */
export function getExpressionTarget(target: GLTF.IAnimationChannelTarget): string {
  if ((target.path as string) === 'pointer') {
    const pointer = (target.extensions?.KHR_animation_pointer as { pointer?: string } | undefined)?.pointer;
    if (typeof pointer !== 'string' || target.node != null) throw new Error('Invalid animation pointer target');
    return pointer;
  }
  if (!Number.isInteger(target.node) || target.node! < 0) throw new Error('Expression channel requires a concrete target');
  return `/nodes/${target.node}/${target.path}`;
}

function resolve(json: unknown, path: string): any {
  return path.slice(1).split('/').reduce((o: any, p) => o?.[p.replace(/~1/g, '/').replace(/~0/g, '~')], json);
}

/** Validate JSON-only invariants and return the declared supported channel indices. */
export function validateKHRCharacterExpressionChannelTargets(
  entry: KHRCharacterExpressionExpression, json: GLTF.IGLTF,
): Set<number> {
  const animation = json.animations?.[entry.animation];
  if (!animation) throw new Error(`Missing expression animation ${entry.animation}`);
  const targets: string[] = [];
  for (const channel of animation.channels) {
    const path = getExpressionTarget(channel.target);
    if (targets.some((p) => p === path || p.startsWith(path + '/') || path.startsWith(p + '/'))) {
      throw new Error(`Duplicate or overlapping animation target ${path}`);
    }
    targets.push(path);
    const nodeMatch = /^\/nodes\/(\d+)\/(translation|rotation|scale|weights)(?:\/(\d+))?$/.exec(path);
    if (nodeMatch) {
      const node = json.nodes?.[Number(nodeMatch[1])];
      if (!node) throw new Error(`Missing node for ${path}`);
      if (nodeMatch[2] !== 'weights' && node.matrix) throw new Error(`TRS animation targets a matrix node: ${path}`);
      if (nodeMatch[2] === 'weights') {
        const mesh = json.meshes?.[node.mesh!];
        const count = mesh?.primitives[0]?.targets?.length ?? 0;
        if (!count || (nodeMatch[3] != null && Number(nodeMatch[3]) >= count)) throw new Error(`Invalid morph target ${path}`);
      }
    } else if (resolve(json, path) === undefined && !/\/extensions\/KHR_texture_transform\/(offset|scale|rotation)$/.test(path)) {
      // Unsupported extensions may define virtual/default mutable properties. Do not reject them here.
      if (!channel.target.extensions) throw new Error(`Unresolved animation target ${path}`);
    }
  }
  const listed = new Set<number>();
  for (const domain of domains) {
    const def = entry.extensions?.[domain];
    if (def == null) continue;
    if (!json.extensionsUsed?.includes(domain)) throw new Error(`Undeclared expression extension ${domain}`);
    if (!Array.isArray(def.channels) || def.channels.length === 0) throw new Error(`Empty channel list: ${domain}`);
    for (const i of def.channels) {
      if (!Number.isInteger(i) || i < 0 || i >= animation.channels.length || listed.has(i)) throw new Error(`Invalid or multiply owned expression channel ${i}`);
      listed.add(i);
      const path = targets[i];
      const valid = domain.endsWith('_joint') ? /^\/nodes\/\d+\/(translation|rotation|scale)$/.test(path)
        : domain.endsWith('_morphtarget') ? /^\/nodes\/\d+\/weights(?:\/\d+)?$/.test(path)
        : /^\/materials\/\d+\/.+\/extensions\/KHR_texture_transform\/(offset|scale|rotation)$/.test(path);
      if (!valid) throw new Error(`Invalid ${domain} target ${path}`);
      if (domain.endsWith('_texture_transform') && typeof resolve(json, path.slice(0, path.lastIndexOf('/'))) !== 'object') {
        throw new Error(`Missing authored texture transform ${path}`);
      }
    }
  }
  return listed;
}
