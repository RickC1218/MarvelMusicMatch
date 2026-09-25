export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'INVALID_ID'
  | 'INVALID_JSON'
  | 'PAYLOAD_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'CONFIG_ERROR'
  | 'UPSTREAM_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

/**
 * Error de aplicación con un estado HTTP y un código estables.
 * El middleware de errores lo serializa; nunca exponemos stack ni mensajes
 * internos al cliente en producción.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: AppErrorCode;
  readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code: AppErrorCode = 'INTERNAL_ERROR',
    details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(message, 400, 'VALIDATION_ERROR', details);
  }

  static notFound(message: string): AppError {
    return new AppError(message, 404, 'NOT_FOUND');
  }

  static config(message: string): AppError {
    return new AppError(message, 500, 'CONFIG_ERROR');
  }

  static upstream(message: string, details?: unknown): AppError {
    return new AppError(message, 502, 'UPSTREAM_ERROR', details);
  }

  static unavailable(message: string): AppError {
    return new AppError(message, 503, 'SERVICE_UNAVAILABLE');
  }
}
