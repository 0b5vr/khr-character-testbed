export async function checkMaxTextureArrayLayers(): Promise<number> {
  const adapter = await navigator.gpu?.requestAdapter();
  if (!adapter) {
    console.warn('WebGPU adapter is not available');
    return 0;
  }

  const maxTextureArrayLayers = adapter.limits.maxTextureArrayLayers;
  return maxTextureArrayLayers;
}
