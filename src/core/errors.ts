export class ModelinfoError extends Error {
  public readonly code: string;

  public constructor(message: string, code = "MODELINFO_ERROR", options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ModelinfoError";
    this.code = code;
  }
}

export function isErrorWithMessage(value: unknown): value is Error {
  return value instanceof Error;
}

export function toErrorMessage(value: unknown): string {
  if (isErrorWithMessage(value)) {
    return value.message;
  }

  return String(value);
}
