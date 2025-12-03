import type { GLTF } from 'npm:@gltf-transform/core@4.2.1';

export function extractGLB(glb: Uint8Array): [GLTF.IGLTF, Uint8Array] {
  const view = new DataView(glb.buffer);
  let head = 0;

  // sanity check
  const magic = new TextDecoder().decode(glb.slice(head, head + 4));
  if (magic !== 'glTF') {
    throw new Error('Not a GLB file');
  }
  head += 4;

  const version = view.getUint32(head, true);
  if (version !== 2) {
    throw new Error('Invalid GLB version, expected 2');
  }
  head += 4;

  // skip length check
  head += 4;

  // JSON chunk
  const jsonChunkLength = view.getUint32(head, true);
  head += 4;

  const jsonChunkType = new TextDecoder().decode(glb.slice(head, head + 4));
  if (jsonChunkType !== 'JSON') {
    throw new Error('Expected JSON chunk');
  }
  head += 4;

  const jsonChunkData = glb.slice(head, head + jsonChunkLength);
  const jsonText = new TextDecoder().decode(jsonChunkData);
  const gltf = JSON.parse(jsonText) as GLTF.IGLTF;
  head += jsonChunkLength;

  // BIN chunk
  const binChunkLength = view.getUint32(head, true);
  head += 4;

  const binChunkType = new TextDecoder().decode(glb.slice(head, head + 4));
  if (binChunkType !== 'BIN\x00') {
    throw new Error('Expected BIN chunk');
  }
  head += 4;

  const binChunk = glb.slice(head, head + binChunkLength) as Uint8Array;

  return [gltf, binChunk];
}
