import { env, isGeminiConfigured } from '../config/env';
import { AppError } from '../errors/AppError';
import {
  buildGeminiSchema,
  buildSystemPrompt,
  buildUserPrompt,
  isWeakDescription,
  parseProfile,
  type CharacterProfile,
  type ProfileInput,
} from './characterProfile';
import { fetchJson } from './http';

/**
 * Proveedor Google Gemini (respaldo de OpenAI).
 *
 * Usa la Generative Language API v1beta con `responseMimeType: application/json`
 * + `responseSchema`, que fuerza la misma forma de respuesta que OpenAI.
 *
 * Los modelos de Gemini se saturan con frecuencia (HTTP 503), así que además del
 * reintento se recorre una lista de modelos alternativos. Los modelos `pro` y
 * `gemini-2.5-*` quedan fuera: los primeros agotan la cuota del plan gratuito y
 * los segundos ya no están disponibles para cuentas nuevas.
 */

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS = 45_000;
const RETRY_DELAY_MS = 1_500;

/** Alternativas si el modelo configurado está saturado o ya no existe. */
const FALLBACK_MODELS = ['gemini-3.1-flash-lite', 'gemini-flash-lite-latest'];

interface GeminiPart {
  text?: string;
}

interface GeminiResponse {
  candidates?: {
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Modelo configurado primero, luego los de respaldo (sin repetir). */
const modelCandidates = (): string[] => [...new Set([env.gemini.model, ...FALLBACK_MODELS])];

const generateContent = async (model: string, body: unknown): Promise<GeminiResponse> => {
  const { data } = await fetchJson<GeminiResponse>(
    `${BASE_URL}/${model}:generateContent?key=${env.gemini.apiKey}`,
    {
      provider: 'Gemini',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      json: body,
      timeoutMs: TIMEOUT_MS,
    },
  );

  return data;
};

const statusOf = (error: unknown): number | undefined =>
  error instanceof AppError
    ? (error.details as { status?: number } | undefined)?.status
    : undefined;

/** 503 = saturación momentánea (se reintenta). */
const isTransient = (error: unknown): boolean => statusOf(error) === 503;

/**
 * 404 = el modelo ya no existe; 429 = cuota agotada. Las cuotas de Gemini son
 * POR MODELO, así que en ambos casos conviene pasar al modelo de respaldo.
 */
const isModelUnavailable = (error: unknown): boolean => {
  const status = statusOf(error);
  return status === 404 || status === 429;
};

/**
 * Recorre la lista de modelos: reintenta una vez si está saturado y, si el
 * modelo no existe o agotó su cuota, pasa al siguiente.
 */
const generateContentWithFallback = async (body: unknown): Promise<GeminiResponse> => {
  let lastError: unknown;

  for (const model of modelCandidates()) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await generateContent(model, body);
      } catch (error) {
        lastError = error;

        if (isTransient(error) && attempt === 0) {
          console.warn(`⏳ Gemini ${model} saturado (503); reintentando...`);
          await delay(RETRY_DELAY_MS);
          continue;
        }

        if (isTransient(error) || isModelUnavailable(error)) {
          console.warn(
            `⚠️  Gemini ${model} no disponible (HTTP ${statusOf(error)}); probando otro modelo...`,
          );
          break;
        }

        throw error;
      }
    }
  }

  throw lastError;
};

const extractText = (data: GeminiResponse): string => {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((part) => part.text ?? '')
    .join('')
    .trim();
};

/** Busca en internet quién es el personaje usando el grounding de Google Search. */
const searchWebContext = async (name: string): Promise<string> => {
  try {
    const data = await generateContentWithFallback({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: [
                `Investiga al personaje de Marvel "${name}".`,
                'Responde en español con 3 líneas como máximo, en este formato:',
                'Personalidad: ...',
                'Poderes: ...',
                'Resumen: ... (origen e historia, breve)',
              ].join('\n'),
            },
          ],
        },
      ],
      tools: [{ google_search: {} }],
    });

    return extractText(data);
  } catch (error) {
    console.warn(
      `⚠️  Búsqueda web de Gemini no disponible para ${name}: ${
        error instanceof Error ? error.message : error
      }`,
    );
    return '';
  }
};

const buildBody = (input: ProfileInput, extraContext: string) => ({
  systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
  contents: [{ role: 'user', parts: [{ text: buildUserPrompt(input, extraContext) }] }],
  generationConfig: {
    temperature: 0.7,
    responseMimeType: 'application/json',
    responseSchema: buildGeminiSchema(),
  },
});

export const generateCharacterProfileWithGemini = async (
  input: ProfileInput,
): Promise<CharacterProfile> => {
  if (!isGeminiConfigured()) {
    throw AppError.config('Gemini no está configurado. Define GEMINI_API_KEY.');
  }

  const first = await generateContentWithFallback(buildBody(input, ''));
  try {
    return parseProfile(extractText(first), 'description');
  } catch {
    // Respuesta inservible: reintentamos, con búsqueda web si falta info.
  }

  const weak = isWeakDescription(input.description);
  if (weak) {
    console.warn(`🔎 (Gemini) Descripción pobre para ${input.name}; buscando en internet...`);
  }

  const webContext = weak ? await searchWebContext(input.name) : '';
  const retry = await generateContentWithFallback(buildBody(input, webContext));

  return parseProfile(extractText(retry), webContext ? 'web' : 'knowledge');
};
