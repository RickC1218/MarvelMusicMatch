import { env, isOpenAiConfigured } from '../config/env';
import { AppError } from '../errors/AppError';
import {
  buildOpenAiSchema,
  buildSystemPrompt,
  buildUserPrompt,
  isWeakDescription,
  parseProfile,
  type CharacterProfile,
  type ProfileInput,
} from './characterProfile';
import { fetchJson } from './http';

/**
 * Proveedor OpenAI (structured outputs + búsqueda web con la Responses API).
 * Requiere un modelo que soporte "structured outputs" (p. ej. gpt-4o-mini).
 */

const CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const RESPONSES_URL = 'https://api.openai.com/v1/responses';
const TIMEOUT_MS = 30_000;
const WEB_TIMEOUT_MS = 45_000;

interface OpenAiChatResponse {
  choices?: { message?: { content?: string | null } }[];
}

interface OpenAiResponsesResponse {
  output_text?: string;
}

/** La cuenta sin saldo devuelve 429; lo traducimos a un mensaje claro. */
const isQuotaError = (error: unknown): boolean => {
  if (!(error instanceof AppError)) return false;

  const details = error.details as
    | { status?: number; body?: { error?: { code?: string; type?: string } } }
    | undefined;
  if (details?.status === 429) return true;

  const code = details?.body?.error?.code ?? details?.body?.error?.type ?? '';
  return code.includes('quota') || code.includes('credit');
};

export const OPENAI_QUOTA_MESSAGE =
  'OpenAI se quedó sin créditos. Agrega saldo en platform.openai.com/settings/organization/billing.';

const requestChat = async (userPrompt: string): Promise<string | null | undefined> => {
  try {
    const { data } = await fetchJson<OpenAiChatResponse>(CHAT_URL, {
      provider: 'OpenAI',
      method: 'POST',
      headers: { Authorization: `Bearer ${env.openai.apiKey}` },
      json: {
        model: env.openai.model,
        temperature: 0.7,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: userPrompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'character_profile', strict: true, schema: buildOpenAiSchema() },
        },
      },
      timeoutMs: TIMEOUT_MS,
    });

    return data.choices?.[0]?.message?.content;
  } catch (error) {
    if (isQuotaError(error)) throw AppError.unavailable(OPENAI_QUOTA_MESSAGE);
    throw error;
  }
};

/** Busca en internet quién es el personaje con la herramienta web_search. */
const searchWebContext = async (name: string): Promise<string> => {
  try {
    const { data } = await fetchJson<OpenAiResponsesResponse>(RESPONSES_URL, {
      provider: 'OpenAI (búsqueda web)',
      method: 'POST',
      headers: { Authorization: `Bearer ${env.openai.apiKey}` },
      json: {
        model: env.openai.model,
        tools: [{ type: 'web_search' }],
        input: [
          `Investiga al personaje de Marvel "${name}".`,
          'Respondé en español con 3 líneas como máximo, en este formato:',
          'Personalidad: ...',
          'Poderes: ...',
          'Resumen: ... (origen e historia, breve)',
        ].join('\n'),
      },
      timeoutMs: WEB_TIMEOUT_MS,
    });

    return typeof data.output_text === 'string' ? data.output_text.trim() : '';
  } catch (error) {
    // La búsqueda es un extra: si falla, seguimos con lo que ya tenemos.
    console.warn(
      `⚠️  Búsqueda web de OpenAI no disponible para ${name}: ${
        error instanceof Error ? error.message : error
      }`,
    );
    return '';
  }
};

export const generateCharacterProfileWithOpenAi = async (
  input: ProfileInput,
): Promise<CharacterProfile> => {
  if (!isOpenAiConfigured()) {
    throw AppError.config('OpenAI no está configurada. Define OPENAI_API_KEY.');
  }

  // 1º intento: con la descripción oficial.
  const first = await requestChat(buildUserPrompt(input));
  try {
    return parseProfile(first, 'description');
  } catch {
    // Respuesta inservible (p. ej. repitió la descripción): reintentamos.
  }

  // 2º intento: con más contexto. Si la descripción es pobre, buscamos en internet.
  const weak = isWeakDescription(input.description);
  if (weak) {
    console.warn(`🔎 Descripción pobre para ${input.name}; buscando información en internet...`);
  }

  const webContext = weak ? await searchWebContext(input.name) : '';
  const retry = await requestChat(buildUserPrompt(input, webContext));

  return parseProfile(retry, webContext ? 'web' : 'knowledge');
};
