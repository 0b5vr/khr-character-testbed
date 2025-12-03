interface LogVerbose {
  (...message: string[]): void;
  enabled: boolean;
}

export const logVerbose: LogVerbose = function (...message: string[]): void {
  if (!logVerbose.enabled) return;
  console.log(...message);
}
logVerbose.enabled = false;
