import type { GLTF } from 'npm:@gltf-transform/core@4.2.1';

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

function padText(text: string): string {
  return text + ' '.repeat((4 - (text.length % 4)) % 4);
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

  const jsonText = padText(JSON.stringify(gltf));
  const jsonData = new TextEncoder().encode(jsonText);
  const jsonChunk = constructGLBChunk(jsonData, 'JSON');

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
