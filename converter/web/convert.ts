import ConverterWorker from './converterWorker.ts?worker';
import { type ConverterWorkerResponse } from './converterWorker.ts';

interface ConvertOptions {
  autoVisibility: boolean;
  onLog: (message: string) => void;
}

export function convert(input: ArrayBuffer, options: ConvertOptions): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const worker = new ConverterWorker();

    function cleanup(): void {
      worker.terminate();
    }

    worker.addEventListener('message', (event: MessageEvent<ConverterWorkerResponse>) => {
      const { data } = event;

      if (data.type === 'log') {
        options.onLog(data.message);
        return;
      }

      if (data.type === 'success') {
        cleanup();
        resolve(data.glb);
        return;
      }

      cleanup();
      reject(new Error(data.message));
    });

    worker.addEventListener('error', (event) => {
      cleanup();
      reject(event.error instanceof Error ? event.error : new Error(event.message));
    });

    worker.postMessage({
      type: 'convert',
      input,
      autoVisibility: options.autoVisibility,
    }, [input]);
  });
}
