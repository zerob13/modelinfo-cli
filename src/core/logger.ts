export function logInfo(message: string): void {
  process.stderr.write(`${message}\n`);
}

export function logWarn(message: string): void {
  process.stderr.write(`warning: ${message}\n`);
}

export function logError(message: string): void {
  process.stderr.write(`error: ${message}\n`);
}
