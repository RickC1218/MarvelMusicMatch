import { AppError } from '../errors/AppError';

interface FetchJsonOptions {
  provider: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  /** Cuerpo JSON (se serializa y define Content-Type). */
  json?: unknown;
  /** Cuerpo application/x-www-form-urlencoded. */
  form?: Record<string, string>;
  timeoutMs?: number;
}

export interface JsonResponse<T> {
  status: number;
  data: T;
}

const extractProviderMessage = (payload: Record<string, unknown>): string | undefined => {
  const { error } = payload;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const message = (error as Record<string, unknown>).message;
    if (typeof message === 'string') return message;
  }
  return typeof payload.message === 'string' ? payload.message : undefined;
};

/**
 * Cliente HTTP mínimo basado en el fetch nativo de Node 18+.
 * Evita añadir axios y normaliza errores de red/timeout como AppError.
 */
export async function fetchJson<T>(
  url: string,
  options: FetchJsonOptions,
): Promise<JsonResponse<T>> {
  const { provider, method = 'GET', headers = {}, json, form, timeoutMs = 10_000 } = options;

  const requestHeaders: Record<string, string> = { Accept: 'application/json', ...headers };
  let body: string | undefined;

  if (json !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  } else if (form !== undefined) {
    requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
    body = new URLSearchParams(form).toString();
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const reason =
      error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'error de red';
    throw AppError.upstream(`${provider}: ${reason}`, { url });
  }

  const raw = await response.text();
  let parsed: unknown;

  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      if (response.ok) {
        throw AppError.upstream(`${provider}: la respuesta no es JSON válido`, { url });
      }
    }
  }

  if (!response.ok) {
    const providerMessage =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? extractProviderMessage(parsed as Record<string, unknown>)
        : undefined;

    throw AppError.upstream(
      `${provider}: la petición falló (HTTP ${response.status})${providerMessage ? `: ${providerMessage}` : ''}`,
      { url, status: response.status, body: parsed },
    );
  }

  return { status: response.status, data: parsed as T };
}
