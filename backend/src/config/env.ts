import dotenv from 'dotenv';

dotenv.config();

const read = (name: string): string => (process.env[name] ?? '').trim();

/** Devuelve el primer valor no vacío. Permite aceptar nombres nuevos y heredados. */
const firstDefined = (...names: string[]): string => {
  for (const name of names) {
    const value = read(name);
    if (value) return value;
  }
  return '';
};

const nodeEnv = read('NODE_ENV') || 'development';
const port = Number.parseInt(read('PORT'), 10) || 5000;

export type AiProvider = 'auto' | 'openai' | 'gemini';

const parseProvider = (value: string): AiProvider =>
  value === 'openai' || value === 'gemini' ? value : 'auto';

const defaultCorsOrigins = ['http://localhost:5173', 'http://localhost:4173'];

const corsOrigins = firstDefined('CORS_ORIGINS', 'CLIENT_ORIGIN')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

/**
 * Construye la URI de MongoDB.
 *
 * Se recomienda definir MONGO_URI (una sola variable). Como alternativa se
 * mantiene el formato heredado `@<database>.<cluster>.mongodb.net` para no
 * romper configuraciones existentes.
 *
 * Nota: se prefieren MONGO_USER/MONGO_PASSWORD sobre USER/PASSWORD porque en
 * Linux/macOS las variables USER y PASSWORD ya existen en el sistema y dotenv
 * no las sobrescribe, lo que provocaría credenciales equivocadas.
 */
const buildMongoUri = (): string => {
  const explicit = read('MONGO_URI');
  if (explicit) return explicit;

  const user = firstDefined('MONGO_USER', 'USER');
  const password = firstDefined('MONGO_PASSWORD', 'PASSWORD');
  const database = firstDefined('MONGO_DATABASE', 'DATABASE');
  const cluster = firstDefined('MONGO_CLUSTER', 'CLUSTER');
  if (!user || !password || !database || !cluster) return '';

  const credentials = `${encodeURIComponent(user)}:${encodeURIComponent(password)}`;
  return `mongodb+srv://${credentials}@${database}.${cluster}.mongodb.net/?retryWrites=true&w=majority&appName=${database}`;
};

export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port,
  corsOrigins: corsOrigins.length > 0 ? corsOrigins : defaultCorsOrigins,
  mongoUri: buildMongoUri(),
  marvel: {
    publicKey: firstDefined('MARVEL_PUBLIC_KEY'),
    privateKey: firstDefined('MARVEL_PRIVATE_KEY'),
    baseUrl: read('MARVEL_BASE_URL') || 'https://gateway.marvel.com/v1/public',
  },
  spotify: {
    clientId: firstDefined('SPOTIFY_CLIENT_ID'),
    clientSecret: firstDefined('SPOTIFY_CLIENT_SECRET'),
    // Mercado usado en las búsquedas (ISO 3166-1 alpha-2).
    market: read('SPOTIFY_MARKET') || 'US',
  },
  openai: {
    apiKey: firstDefined('OPENAI_API_KEY'),
    model: read('OPENAI_MODEL') || 'gpt-4o-mini',
  },
  gemini: {
    apiKey: firstDefined('GEMINI_API_KEY', 'GOOGLE_API_KEY'),
    model: read('GEMINI_MODEL') || 'gemini-3.8-flash',
  },
  /** 'auto' prueba OpenAI y, si falla, usa Gemini como respaldo. */
  aiProvider: parseProvider(read('AI_PROVIDER')),
} as const;

export const isMarvelConfigured = (): boolean =>
  Boolean(env.marvel.publicKey && env.marvel.privateKey);

export const isSpotifyConfigured = (): boolean =>
  Boolean(env.spotify.clientId && env.spotify.clientSecret);

export const isOpenAiConfigured = (): boolean => Boolean(env.openai.apiKey);

export const isGeminiConfigured = (): boolean => Boolean(env.gemini.apiKey);

export const isAiConfigured = (): boolean => isOpenAiConfigured() || isGeminiConfigured();

/** Variables faltantes, para avisar en el arranque sin romper el servidor. */
export const collectConfigWarnings = (): string[] => {
  const warnings: string[] = [];

  if (!env.mongoUri) {
    warnings.push(
      'MongoDB no configurado. Define MONGO_URI o MONGO_USER/MONGO_PASSWORD/MONGO_DATABASE/MONGO_CLUSTER.',
    );
  }
  if (!isSpotifyConfigured()) {
    warnings.push('Spotify API no configurada. Define SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET.');
  }
  if (!isOpenAiConfigured() && !isGeminiConfigured()) {
    warnings.push(
      'IA no configurada. Define OPENAI_API_KEY y/o GEMINI_API_KEY (Google Gemini).',
    );
  }
  // La Marvel API fue dada de baja: los personajes vienen del dataset local
  // (npm run seed:characters), así que ya no se avisa por sus claves.

  return warnings;
};
