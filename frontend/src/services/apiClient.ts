import { isMockEnabled, resolveMockRequest } from '../mocks/mockApi'

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

interface ApiErrorPayload {
  error?: { code?: string; message?: string }
}

export const apiRequest = async <T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> => {
  const { method = 'GET', body, signal } = options

  if (isMockEnabled) {
    const mock = await resolveMockRequest(method, path, body)
    if (mock.matched) {
      if ('error' in mock) {
        throw new ApiError(
          mock.error.message,
          mock.error.status,
          mock.error.code
        )
      }
      return mock.data as T
    }
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers:
        body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw error
    throw new ApiError(
      'No se pudo conectar con el servidor.',
      0,
      'NETWORK_ERROR'
    )
  }

  const text = await response.text()
  let payload: unknown

  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = undefined
    }
  }

  if (!response.ok) {
    const details = (payload as ApiErrorPayload | undefined)?.error
    throw new ApiError(
      details?.message ?? `La petición falló (HTTP ${response.status})`,
      response.status,
      details?.code ?? 'UNKNOWN'
    )
  }

  return payload as T
}
