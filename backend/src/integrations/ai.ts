import { env, isGeminiConfigured, isOpenAiConfigured } from '../config/env';
import { AppError } from '../errors/AppError';
import { generateCharacterProfileWithGemini } from './gemini';
import { generateCharacterProfileWithOpenAi } from './openai';
import type { CharacterProfile, ProfileInput } from './characterProfile';

export type { CharacterProfile, ProfileInput } from './characterProfile';

/**
 * Selector de proveedor de IA.
 *
 * - AI_PROVIDER=openai  → solo OpenAI (structured outputs + web_search).
 * - AI_PROVIDER=gemini  → solo Gemini (responseSchema + Google Search).
 * - AI_PROVIDER=auto    → intenta OpenAI y, si falla (p. ej. sin créditos),
 *                         cae a Gemini. Si ambos fallan, se propaga el error.
 */

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const generateCharacterProfile = async (
  input: ProfileInput,
): Promise<CharacterProfile> => {
  if (env.aiProvider === 'openai') return generateCharacterProfileWithOpenAi(input);
  if (env.aiProvider === 'gemini') return generateCharacterProfileWithGemini(input);

  const openAiReady = isOpenAiConfigured();
  const geminiReady = isGeminiConfigured();

  if (!openAiReady && !geminiReady) {
    throw AppError.config(
      'No hay ningún proveedor de IA configurado. Define OPENAI_API_KEY y/o GEMINI_API_KEY.',
    );
  }

  const errors: string[] = [];

  if (openAiReady) {
    try {
      return await generateCharacterProfileWithOpenAi(input);
    } catch (error) {
      errors.push(`OpenAI: ${messageOf(error)}`);
      if (geminiReady) {
        console.warn(`⚠️  OpenAI falló (${messageOf(error)}). Probando con Gemini...`);
      }
    }
  }

  if (geminiReady) {
    try {
      return await generateCharacterProfileWithGemini(input);
    } catch (error) {
      errors.push(`Gemini: ${messageOf(error)}`);
    }
  }

  throw AppError.unavailable(`Ningún proveedor de IA pudo describir al personaje. ${errors.join(' · ')}`);
};
