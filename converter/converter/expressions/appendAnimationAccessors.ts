import type { GLTF } from '@gltf-transform/core';

function alignTo4(byteLength: number): number {
  return byteLength + ((4 - (byteLength % 4)) % 4);
}

/**
 * Appends raw bytes to the given BIN chunk and creates a matching bufferView.
 *
 * @param data Uint8Array representing the raw bytes to append to the BIN chunk
 * @param gltf The glTF JSON object to modify
 * @param binChunkBox The reference box to the binary chunk
 * @returns The newly created bufferView index
 */
function appendBufferView(
  data: Uint8Array,
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
): number {
  const byteOffset = alignTo4(binChunkBox[0].byteLength);
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

/**
 * Creates a time accessor for animation input values.
 *
 * The accessor min/max are derived from the first/last element in `data`.
 *
 * @param data Animation input buffer
 * @param gltf The glTF JSON object to modify
 * @param binChunkBox The reference box to the binary chunk
 * @returns The newly created input accessor index
 */
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

/**
 * Creates an accessor for animation output values.
 *
 * @param data Animation output buffer
 * @param type Accessor type of `output`
 * @param gltf The glTF JSON object to modify
 * @param binChunkBox The reference box to the binary chunk
 * @returns The newly created output accessor index
 */
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

/**
 * Appends both input/output accessors for one animation sampler payload.
 *
 * @param input Animation input buffer
 * @param output Animation output buffer
 * @param outputType Accessor type of `output`
 * @param gltf The glTF JSON object to modify
 * @param binChunkBox The reference box to the binary chunk
 * @returns Tuple of `[inputAccessorIndex, outputAccessorIndex]`
 */
export function appendAnimationAccessors(
  input: Float32Array,
  output: Float32Array,
  outputType: 'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4',
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
): [inputIndex: number, outputIndex: number] {
  const inputIndex = appendInputAccessor(input, gltf, binChunkBox);
  const outputIndex = appendOutputAccessor(
    output,
    outputType,
    gltf,
    binChunkBox,
  );
  return [inputIndex, outputIndex];
}
