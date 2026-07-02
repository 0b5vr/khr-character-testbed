import type { GLTF } from '@gltf-transform/core';

function constructGLBChunk(data: Uint8Array, type: string): Uint8Array {
  const chunkLength = data.byteLength;
  const chunkTypeBytes = new TextEncoder().encode(type);
  const chunk = new Uint8Array(8 + chunkLength);
  const view = new DataView(chunk.buffer);

  view.setUint32(0, chunkLength, true);
  chunk.set(chunkTypeBytes, 4);
  chunk.set(data, 8);

  return chunk;
}

function padJSONChunk(jsonData: Uint8Array): Uint8Array {
  const paddedLength = jsonData.byteLength +
    ((4 - (jsonData.byteLength % 4)) % 4);
  const paddedJsonData = new Uint8Array(paddedLength);
  paddedJsonData.fill(0x20);
  paddedJsonData.set(jsonData);
  return paddedJsonData;
}

function padBinary(bin: Uint8Array): Uint8Array {
  const paddedLength = bin.byteLength + ((4 - (bin.byteLength % 4)) % 4);
  const paddedBin = new Uint8Array(paddedLength);
  paddedBin.set(bin);
  return paddedBin;
}

export function constructGLB(gltf: GLTF.IGLTF, bin: Uint8Array): Uint8Array {
  const binChunk = constructGLBChunk(padBinary(bin), 'BIN\x00');

  // fix buffer length
  gltf.buffers = [{ byteLength: binChunk.byteLength - 8 }];

  const jsonData = new TextEncoder().encode(JSON.stringify(gltf));
  const jsonChunk = constructGLBChunk(padJSONChunk(jsonData), 'JSON');

  const totalLength = 12 + jsonChunk.byteLength + binChunk.byteLength;
  const glb = new Uint8Array(totalLength);
  const view = new DataView(glb.buffer);

  // GLB header
  view.setUint32(0, 0x46546C67, true); // 'glTF'
  view.setUint32(4, 2, true); // version
  view.setUint32(8, totalLength, true); // length

  // Chunks
  glb.set(jsonChunk, 12);
  glb.set(binChunk, 12 + jsonChunk.byteLength);

  return glb;
}
