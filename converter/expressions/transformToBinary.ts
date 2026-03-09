/**
 * Converts a 2-keyframe flattened output buffer `[A..., B...]` into `[A..., B..., B...]`.
 * Intended to be used for converting morph target animation data when `isBinary` is true in the VRM side.
 *
 * @param data The input data buffer, expected to be in the format of `[A..., B...]` where A and B are keyframe values
 * @param isBinary A boolean flag indicating whether the output should be in binary format. If false, the input data is returned as-is
 * @returns A new Float32Array containing the transformed keyframe values
 */
export function transformToBinary(data: Float32Array, isBinary: boolean): Float32Array {
  if (!isBinary) {
    return data;
  }

  const binaryData = new Float32Array(data.length / 2 * 3);
  binaryData.set(data, 0);
  binaryData.set(data.subarray(data.length / 2), data.length);
  return binaryData;
}
