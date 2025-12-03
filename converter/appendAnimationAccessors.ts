import type { GLTF } from 'npm:@gltf-transform/core@4.2.1';

function appendBufferView(
  data: Uint8Array,
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
): number {
  const byteOffset = binChunkBox[0].byteLength;
  const byteLength = data.byteLength;

  const newBinChunk = new Uint8Array(byteOffset + byteLength);
  newBinChunk.set(binChunkBox[0], 0);
  newBinChunk.set(data, byteOffset);
  binChunkBox[0] = newBinChunk;

  gltf.bufferViews ||= [];
  gltf.bufferViews.push({
    buffer: 0,
    byteOffset,
    byteLength,
  });

  return gltf.bufferViews!.length - 1;
}

function appendInputAccessor(
  data: Float32Array,
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
): number {
  const dataBytes = new Uint8Array(data.buffer);
  appendBufferView(dataBytes, gltf, binChunkBox);
  const bufferViewIndex = gltf.bufferViews!.length - 1;

  gltf.accessors ||= [];
  gltf.accessors.push({
    bufferView: bufferViewIndex,
    componentType: 5126, // GL_FLOAT
    count: data.length,
    type: 'SCALAR',
    min: [data[0]],
    max: [data[data.length - 1]],
  });

  return gltf.accessors!.length - 1;
}

function appendOutputAccessor(
  data: Float32Array,
  type: 'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4',
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
): number {
  const dataBytes = new Uint8Array(data.buffer);
  appendBufferView(dataBytes, gltf, binChunkBox);
  const bufferViewIndex = gltf.bufferViews!.length - 1;

  const elementSize = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
  }[type];

  gltf.accessors ||= [];
  gltf.accessors.push({
    bufferView: bufferViewIndex,
    componentType: 5126, // GL_FLOAT
    count: data.length / elementSize,
    type,
  });

  return gltf.accessors!.length - 1;
}

export function appendAnimationAccessors(
  input: Float32Array,
  output: Float32Array,
  outputType: 'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4',
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
): [inputIndex: number, outputIndex: number] {
  const inputIndex = appendInputAccessor(input, gltf, binChunkBox);
  const outputIndex = appendOutputAccessor(output, outputType, gltf, binChunkBox);
  return [inputIndex, outputIndex];
}
