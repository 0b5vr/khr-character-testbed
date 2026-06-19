interface LogVerbose {
  (...message: string[]): void;
  handler?: (...message: string[]) => void;
}

export const logVerbose: LogVerbose = function (...message: string[]): void {
  logVerbose.handler?.(...message);
};
