import { convertVRMToKHRCharacter } from '../converter/index.ts';

interface ConvertRequest {
  type: 'convert';
  input: ArrayBuffer;
  autoVisibility: boolean;
}

interface LogResponse {
  type: 'log';
  message: string;
}

interface SuccessResponse {
  type: 'success';
  glb: Uint8Array;
}

interface ErrorResponse {
  type: 'error';
  message: string;
}

export type ConverterWorkerResponse = LogResponse | SuccessResponse | ErrorResponse;

self.addEventListener('message', (event: MessageEvent<ConvertRequest>) => {
  const { data } = event;
  if (data.type !== 'convert') return;

  try {
    const { glb } = convertVRMToKHRCharacter(data.input, {
      autoVisibility: data.autoVisibility,
      verboseHandler: (...message) => {
        self.postMessage({
          type: 'log',
          message: message.join(' '),
        } satisfies LogResponse);
      },
    });

    self.postMessage(
      {
        type: 'success',
        glb,
      } satisfies SuccessResponse,
      [glb.buffer as ArrayBuffer],
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    self.postMessage({
      type: 'error',
      message,
    } satisfies ErrorResponse);
  }
});
