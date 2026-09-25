import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { AppError, type AppErrorCode } from '../errors/AppError';

interface NormalizedError {
  statusCode: number;
  code: AppErrorCode;
  message: string;
  details?: unknown;
}

const fromValidationError = (error: mongoose.Error.ValidationError): NormalizedError => ({
  statusCode: 400,
  code: 'VALIDATION_ERROR',
  message: 'Datos inválidos',
  details: Object.values(error.errors).map((fieldError) => ({
    field: fieldError.path,
    message: fieldError.message,
  })),
});

/** Traduce errores de body-parser (JSON mal formado, cuerpo demasiado grande). */
const fromBodyParserError = (error: { type?: string }): NormalizedError | null => {
  if (error.type === 'entity.parse.failed') {
    return {
      statusCode: 400,
      code: 'INVALID_JSON',
      message: 'El cuerpo de la petición no es JSON válido',
    };
  }
  if (error.type === 'entity.too.large') {
    return {
      statusCode: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'El cuerpo de la petición es demasiado grande',
    };
  }
  return null;
};

const normalizeError = (error: unknown): NormalizedError => {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return fromValidationError(error);
  }

  if (error instanceof mongoose.Error.CastError) {
    return { statusCode: 400, code: 'INVALID_ID', message: 'Identificador inválido' };
  }

  if (error && typeof error === 'object') {
    const bodyParserError = fromBodyParserError(error as { type?: string });
    if (bodyParserError) return bodyParserError;
  }

  return {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    // En producción no exponemos detalles internos.
    message:
      env.isProduction || !(error instanceof Error)
        ? 'Error interno del servidor'
        : error.message,
  };
};

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    },
  });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const normalized = normalizeError(error);

  if (normalized.statusCode >= 500) {
    console.error('💥 Error:', error);
  }

  // Los detalles solo se exponen en errores 4xx; en 5xx podrían filtrar
  // información interna de los proveedores (se registran en consola).
  const exposeDetails = normalized.statusCode < 500 && normalized.details !== undefined;

  res.status(normalized.statusCode).json({
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(exposeDetails ? { details: normalized.details } : {}),
    },
  });
};
