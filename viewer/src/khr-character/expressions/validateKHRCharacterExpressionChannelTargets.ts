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

export interface ExpressionChannelValidation {
  channels: Set<number>;
  /** Legacy clip playback cannot safely filter individual rejected channels. */
  hasInvalidChannels: boolean;
}

/** Validate JSON-only invariants, warning and omitting invalid channels or expressions. */
export function validateKHRCharacterExpressionChannelTargets(
  entry: KHRCharacterExpressionExpression, json: GLTF.IGLTF,
): ExpressionChannelValidation | null {
  const animation = entry && Number.isInteger(entry.animation) && entry.animation >= 0 ? json.animations?.[entry.animation] : undefined;
  if (!animation || !Array.isArray(animation.channels)) {
    console.warn(`Missing or invalid expression animation ${entry?.animation}. Skipping this expression.`);
    return null;
  }
  let hasInvalidChannels = false;
  const warn = (message: string) => {
    console.warn(`${message}. Skipping the affected channel or declaration.`);
    hasInvalidChannels = true;
  };
  const targets: (string | undefined)[] = [];
  const invalid = new Set<number>();
  for (const [i, channel] of animation.channels.entries()) {
    let path: string;
    try {
      if (!channel?.target) throw new Error('Missing animation channel target');
      path = getExpressionTarget(channel.target);
    } catch (error) {
      warn(String(error));
      invalid.add(i);
      continue;
    }
    if (targets.some((p) => p != null && (p === path || p.startsWith(path + '/') || path.startsWith(p + '/')))) {
      console.warn(`Duplicate or overlapping animation target ${path}. Skipping this expression.`);
      return null;
    }
    targets[i] = path;
    const nodeMatch = /^\/nodes\/(\d+)\/(translation|rotation|scale|weights)(?:\/(\d+))?$/.exec(path);
    let problem: string | undefined;
    if (nodeMatch) {
      const node = json.nodes?.[Number(nodeMatch[1])];
      if (!node) problem = `Missing node for ${path}`;
      else if (nodeMatch[2] !== 'weights' && node.matrix) problem = `TRS animation targets a matrix node: ${path}`;
      else if (nodeMatch[2] === 'weights') {
        const mesh = json.meshes?.[node.mesh!];
        const count = mesh?.primitives?.[0]?.targets?.length ?? 0;
        if (!count || (nodeMatch[3] != null && Number(nodeMatch[3]) >= count)) problem = `Invalid morph target ${path}`;
      }
    } else if (resolve(json, path) === undefined && !/\/extensions\/KHR_texture_transform\/(offset|scale|rotation)$/.test(path)) {
      // Unsupported extensions may define virtual/default mutable properties. Do not reject them here.
      if (!channel.target.extensions) problem = `Unresolved animation target ${path}`;
    }
    if (problem) {
      warn(problem);
      invalid.add(i);
    }
  }
  const listed = new Set<number>();
  const owned = new Set<number>();
  for (const domain of domains) {
    const def = entry.extensions?.[domain];
    if (def == null) continue;
    if (!json.extensionsUsed?.includes(domain) || !Array.isArray(def.channels) || def.channels.length === 0) {
      warn(`Undeclared or invalid expression extension ${domain}`);
      continue;
    }
    for (const i of def.channels) {
      if (!Number.isInteger(i) || i < 0 || i >= animation.channels.length) {
        warn(`Invalid expression channel ${i}`);
        continue;
      }
      if (owned.has(i)) {
        warn(`Multiply owned expression channel ${i}`);
        listed.delete(i);
        invalid.add(i);
      }
      owned.add(i);
      if (invalid.has(i)) continue;
      const path = targets[i]!;
      const valid = domain.endsWith('_joint') ? /^\/nodes\/\d+\/(translation|rotation|scale)$/.test(path)
        : domain.endsWith('_morphtarget') ? /^\/nodes\/\d+\/weights(?:\/\d+)?$/.test(path)
        : /^\/materials\/\d+\/.+\/extensions\/KHR_texture_transform\/(offset|scale|rotation)$/.test(path);
      if (!valid) {
        warn(`Invalid ${domain} target ${path}`);
        continue;
      }
      if (domain.endsWith('_texture_transform')) {
        const transform = resolve(json, path.slice(0, path.lastIndexOf('/')));
        if (!transform || typeof transform !== 'object') {
          warn(`Missing authored texture transform ${path}`);
          continue;
        }
      }
      listed.add(i);
    }
  }
  return { channels: listed, hasInvalidChannels };
}
