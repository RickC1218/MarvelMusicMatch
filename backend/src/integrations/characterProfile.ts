import { VIBE_IDS, findVibe } from '../data/vibes';
import { AppError } from '../errors/AppError';

/**
 * Piezas compartidas por TODOS los proveedores de IA (OpenAI, Gemini).
 *
 * La IA solo clasifica al personaje dentro de la taxonomía cerrada de vibras y
 * redacta el texto; nunca nombra canciones (eso lo resuelve Spotify).
 * Mantener el prompt y el contrato aquí garantiza que ambos proveedores
 * devuelvan exactamente lo mismo.
 */

export type ProfileSource = 'description' | 'knowledge' | 'web' | 'reused';

export interface CharacterProfile {
  /** Solo ids válidos de la taxonomía; puede venir vacío si el modelo falla. */
  vibes: string[];
  /** Personalidad del personaje (1-2 frases). */
  personality: string;
  /** Poderes y habilidades concretos. */
  powers: string;
  /** Resumen narrativo breve del personaje. */
  summary: string;
  /** De dónde salió la información. */
  source: ProfileSource;
}

export interface ProfileInput {
  name: string;
  description: string;
  comicsAvailable: number;
  role: 'hero' | 'villain' | null;
  vibeHint: readonly string[];
}

/** Una descripción oficial muy corta o vacía no alcanza para nada útil. */
export const isWeakDescription = (description: string): boolean =>
  description.trim().length < 80;

export const asText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

export const buildSystemPrompt = (): string =>
  [
    'Eres un experto en el universo Marvel y en música.',
    'Tu tarea es describir a un personaje de Marvel en ESPAÑOL NEUTRO.',
    '',
    'CAMPOS (todos obligatorios, todos en español):',
    '- "personality": PERSONALIDAD. Su carácter, motivaciones y forma de actuar. 1-2 frases.',
    '- "powers": PODERES. Sus poderes, habilidades y capacidades concretas. 1-2 frases.',
    '- "summary": RESUMEN. Su origen e historia, 2-4 frases.',
    '- "vibes": de 1 a 3 vibras del catálogo proporcionado.',
    '',
    'REGLAS ESTRICTAS:',
    '- Responde SIEMPRE en español. Está prohibido responder en inglés.',
    '- NUNCA repitas ni copies textualmente la descripción oficial: redacta con tus palabras.',
    '- "personality", "powers" y "summary" deben ser TRES textos DISTINTOS entre sí.',
    '  Está prohibido usar el mismo texto en varios campos.',
    '- No menciones canciones, artistas ni álbumes concretos.',
    '- Usa únicamente las vibras del catálogo proporcionado.',
    '- No inventes datos: si no conoces un dato, descríbelo de forma general pero coherente.',
  ].join('\n');

export const buildUserPrompt = (input: ProfileInput, extraContext = ''): string => {
  const catalog = VIBE_IDS.map((id) => `- ${id}: ${findVibe(id)?.label ?? id}`).join('\n');

  return [
    `Personaje: ${input.name}`,
    `Rol: ${input.role ?? 'desconocido'}`,
    `Apariciones en cómics: ${input.comicsAvailable}`,
    `Descripción oficial (referencia, NO la copies): ${input.description || '(sin descripción oficial)'}`,
    input.vibeHint.length > 0
      ? `Vibras sugeridas por nuestro catálogo curado: ${input.vibeHint.join(', ')}`
      : 'No hay vibras curadas para este personaje.',
    extraContext ? `\nInformación adicional obtenida de internet:\n${extraContext}` : '',
    '',
    'Catálogo de vibras disponibles:',
    catalog,
    '',
    'Devuelve el JSON con: vibes (1-3 del catálogo), personality (personalidad),',
    'powers (poderes) y summary (resumen). Los tres textos en español y distintos entre sí.',
  ]
    .filter(Boolean)
    .join('\n');
};

/** JSON Schema de OpenAI (structured outputs, admite `additionalProperties`). */
export const buildOpenAiSchema = () => ({
  type: 'object',
  additionalProperties: false,
  required: ['vibes', 'personality', 'powers', 'summary'],
  properties: {
    vibes: {
      type: 'array',
      minItems: 1,
      maxItems: 3,
      items: { type: 'string', enum: [...VIBE_IDS] },
      description: 'Vibras musicales que mejor representan al personaje.',
    },
    personality: {
      type: 'string',
      description:
        'Personalidad del personaje: carácter, motivaciones y forma de actuar. 1 o 2 frases en español.',
    },
    powers: {
      type: 'string',
      description:
        'Poderes, habilidades y capacidades concretas. 1 o 2 frases en español.',
    },
    summary: {
      type: 'string',
      description: 'Resumen narrativo (origen e historia) en 2 o 4 frases, en español.',
    },
  },
});

/** responseSchema de Gemini: subconjunto OpenAPI, tipos en MAYÚSCULAS y sin min/max. */
export const buildGeminiSchema = () => ({
  type: 'OBJECT',
  properties: {
    vibes: {
      type: 'ARRAY',
      items: { type: 'STRING', enum: [...VIBE_IDS] },
      description: 'Vibras musicales que mejor representan al personaje.',
    },
    personality: {
      type: 'STRING',
      description:
        'Personalidad del personaje: carácter, motivaciones y forma de actuar. 1 o 2 frases en español.',
    },
    powers: {
      type: 'STRING',
      description: 'Poderes, habilidades y capacidades concretas. 1 o 2 frases en español.',
    },
    summary: {
      type: 'STRING',
      description: 'Resumen narrativo (origen e historia) en 2 o 4 frases, en español.',
    },
  },
  required: ['vibes', 'personality', 'powers', 'summary'],
  propertyOrdering: ['vibes', 'personality', 'powers', 'summary'],
});

export const parseProfile = (
  content: string | null | undefined,
  source: ProfileSource,
): CharacterProfile => {
  if (!content) throw AppError.upstream('IA: respuesta vacía');

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw AppError.upstream('IA: la respuesta no es JSON válido');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw AppError.upstream('IA: estructura de respuesta inesperada');
  }

  const record = parsed as Record<string, unknown>;
  const vibes = Array.isArray(record.vibes)
    ? record.vibes
        .filter((value): value is string => typeof value === 'string')
        .filter((value) => VIBE_IDS.includes(value as (typeof VIBE_IDS)[number]))
        .slice(0, 3)
    : [];

  const personality = asText(record.personality);
  const powers = asText(record.powers);
  const summary = asText(record.summary);

  // Debe traer personalidad y al menos poderes o resumen para ser útil.
  if (!personality || (!powers && !summary)) {
    throw AppError.upstream('IA: faltan la personalidad, los poderes o el resumen');
  }

  return { vibes, personality, powers, summary, source };
};
