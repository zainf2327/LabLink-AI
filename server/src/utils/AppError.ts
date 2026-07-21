export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: number;

  constructor(message: string, statusCode: number, code?: number) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;

    // Restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype);

    Error.captureStackTrace(this, this.constructor);
  }
}
