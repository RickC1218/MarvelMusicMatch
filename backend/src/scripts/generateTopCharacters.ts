import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { parse } from 'csv-parse/sync';
import { env } from '../config/env';
import {
  CURATED_CHARACTERS,
  findCuratedByDisplayName,
  findCuratedByMarvelId,
  findCuratedByName,
} from '../data/characterMeta';
import MarvelCharacter from '../models/MarvelCharacterSchema';
import type { CharacterRole } from '../types/character';

/**
 * Genera el Top N de personajes de Marvel desde el dataset local y lo carga en
 * MongoDB, porque la API pública de Marvel fue dada de baja.
 *
 * Dataset: https://www.kaggle.com/datasets/iamabhaytiwari/marvelcharacters
 * Popularity Score (según el README del dataset):
 *   "calculated from the character's number of appearances across comics,
 *    series, stories and events in the source dataset".
 *
 * Uso:
 *   npm run seed:characters               # genera el JSON y carga MongoDB
 *   npm run seed:characters -- --skip-seed  # solo genera el JSON
 */

interface MarvelCsvRow {
  id: string;
  name: string;
  description: string;
  modified: string;
  thumbnail: string;
  resourceURI: string;
  comics: string;
  series: string;
  stories: string;
  events: string;
  urls: string;
}

interface Popularity {
  comics: number;
  series: number;
  stories: number;
  events: number;
}

interface CharacterUrl {
  type: string;
  url: string;
}

interface CharacterOutput {
  marvelId: number;
  slug: string;
  name: string;
  description: string;
  modified: string | null;
  thumbnail: { path: string; extension: string } | null;
  thumbnailUrl: string | null;
  role: CharacterRole | null;
  /** Coincidencia exacta con un personaje curado (id o nombre). */
  curatedExact: boolean;
  popularityScore: number;
  popularity: Popularity;
  urls: CharacterUrl[];
}

const CSV_PATH = path.resolve(process.cwd(), 'data/marvel_characters.csv');
const OUTPUT_PATH = path.resolve(process.cwd(), 'data/top-100-marvel-characters.json');
const TOP_LIMIT = 100;

/**
 * Equipos, organizaciones y razas: no son personajes individuales, así que se
 * excluyen del ranking aunque tengan muchas apariciones. Es una lista explícita
 * y revisable a propósito (no se puede inferir el tipo desde el dataset).
 */
const NOT_A_CHARACTER = new Set<string>([
  // Equipos de superhéroes / supervillanos
  'x-men', 'x-men (ultimate)', 'uncanny x-men', 'new x-men', 'astonishing x-men',
  'x-force', 'x-factor', 'new mutants', 'excalibur', 'exiles',
  'avengers', 'new avengers', 'dark avengers', 'mighty avengers',
  'west coast avengers', 'secret avengers', 'young avengers', 'ultimates',
  'new warriors', 'champions', 'fantastic four', 'frightful four',
  'guardians of the galaxy', 'new guardians of the galaxy', 'defenders',
  'thunderbolts', 'alpha flight', 'power pack', 'runaways', 'midnight sons',
  'annihilators', 'web warriors', 'a-force', 'pet avengers', 'big hero 6',
  'starjammers', 'brotherhood of evil mutants', 'brotherhood of mutants',
  'sinister six', 'masters of evil', 'serpent society', 'lethal legion',
  'wrecking crew', 'revengers', 'new recruits',
  // Organizaciones, razas y entidades colectivas
  's.h.i.e.l.d.', 's.h.i.e.l.d. (ultimate)', 'hydra', 'a.i.m.', 'the hand',
  'hand', 'maggia', 'skrulls', 'kree', "shi'ar", 'eternals', 'nova corps',
  'hellfire club', 'morlocks', 'sentinels', 'inhumans', 'new warriors',
]);

const normalizeName = (value: string): string => value.trim().toLowerCase();

const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Resuelve el curado e indica si fue coincidencia exacta de nombre/id. */
const findCuratedMatch = (marvelId: number, name: string) => {
  const character = findCuratedByMarvelId(marvelId) ?? findCuratedByDisplayName(name);
  if (!character) return null;

  const exactMatch = character.marvelId === marvelId || findCuratedByName(name) === character;
  return { character, exactMatch };
};

/**
 * El dataset guarda los objetos de Marvel en repr de Python
 * (`{'available': 12}` con comillas simples), NO en JSON: `JSON.parse` falla.
 * Por eso se extraen las claves con regex en vez de parsear el objeto entero.
 */
const readNumber = (raw: string | undefined, key: string): number => {
  if (!raw) return 0;
  const match = new RegExp(`['"]${key}['"]\\s*:\\s*(-?\\d+)`).exec(raw);
  if (!match) return 0;
  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) && value > 0 ? value : 0;
};

const readString = (raw: string | undefined, key: string): string | null => {
  if (!raw) return null;
  const match = new RegExp(`['"]${key}['"]\\s*:\\s*['"]([^'"]*)['"]`).exec(raw);
  return match?.[1] || null;
};

const parseThumbnail = (raw: string | undefined) => {
  const thumbPath = readString(raw, 'path');
  if (!thumbPath || thumbPath.includes('image_not_available')) return null;

  return {
    path: thumbPath,
    extension: readString(raw, 'extension') ?? 'jpg',
  };
};

/** URL de la imagen, igual que la usaba la Marvel API (`portrait_xlarge`). */
const thumbnailUrl = (thumbnail: { path: string; extension: string } | null): string | null =>
  thumbnail ? `${thumbnail.path}/portrait_xlarge.${thumbnail.extension}` : null;

/** Extrae [{'type': 'detail', 'url': '...'}] del repr de Python. */
const parseUrls = (raw: string | undefined): CharacterUrl[] => {
  if (!raw) return [];

  const urls: CharacterUrl[] = [];
  const regex = /['"]type['"]\s*:\s*['"]([^'"]+)['"]\s*,\s*['"]url['"]\s*:\s*['"]([^'"]+)['"]/g;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw)) !== null) {
    urls.push({ type: match[1], url: match[2] });
  }
  return urls;
};

const calculatePopularity = (row: MarvelCsvRow): Popularity => ({
  comics: readNumber(row.comics, 'available'),
  series: readNumber(row.series, 'available'),
  stories: readNumber(row.stories, 'available'),
  events: readNumber(row.events, 'available'),
});

const popularityScore = (popularity: Popularity): number =>
  popularity.comics + popularity.series + popularity.stories + popularity.events;

/**
 * Roles descubiertos para los personajes del top que no están curados.
 *
 * El dataset de Kaggle NO incluye héroe/villano, así que se investigaron uno a
 * uno (aliases incluidos: "Eddie Brock" hereda el rol de Venom, "Norman Osborn"
 * el de Green Goblin). Los civiles no combatientes se quedan en null.
 */
const DISCOVERED_ROLES: Record<string, CharacterRole> = {
  // Héroes
  'adam-warlock': 'hero',
  archangel: 'hero',
  banshee: 'hero',
  beast: 'hero',
  bishop: 'hero',
  'black-bolt': 'hero',
  'black-cat': 'hero',
  cable: 'hero',
  cannonball: 'hero',
  'captain-britain': 'hero',
  colossus: 'hero',
  cyclops: 'hero',
  dazzler: 'hero',
  deadpool: 'hero',
  domino: 'hero',
  elektra: 'hero',
  'emma-frost': 'hero',
  falcon: 'hero',
  'franklin-richards': 'hero',
  gambit: 'hero',
  'ghost-rider-johnny-blaze': 'hero',
  'hank-pym': 'hero',
  havok: 'hero',
  hawkeye: 'hero',
  hercules: 'hero',
  'human-torch': 'hero',
  iceman: 'hero',
  'invisible-woman': 'hero',
  'iron-fist-danny-rand': 'hero',
  'jean-grey': 'hero',
  'jessica-jones': 'hero',
  jubilee: 'hero',
  'kitty-pryde': 'hero',
  'luke-cage': 'hero',
  medusa: 'hero',
  'misty-knight': 'hero',
  'moon-knight': 'hero',
  'mr-fantastic': 'hero',
  'ms-marvel-kamala-khan': 'hero',
  namor: 'hero',
  'nick-fury': 'hero',
  nightcrawler: 'hero',
  nova: 'hero',
  odin: 'hero',
  polaris: 'hero',
  'professor-x': 'hero',
  psylocke: 'hero',
  punisher: 'hero',
  quicksilver: 'hero',
  'rawhide-kid': 'hero',
  'rick-jones': 'hero',
  rogue: 'hero',
  'scarlet-witch': 'hero',
  'shang-chi': 'hero',
  'she-hulk-jennifer-walters': 'hero',
  sif: 'hero',
  'silver-surfer': 'hero',
  'spider-girl-may-parker': 'hero',
  'spider-woman-jessica-drew': 'hero',
  'sub-mariner': 'hero',
  sunspot: 'hero',
  thing: 'hero',
  'two-gun-kid': 'hero',
  vision: 'hero',
  warpath: 'hero',
  wasp: 'hero',
  'winter-soldier': 'hero',
  'wonder-man': 'hero',
  'x-23': 'hero',

  // Villanos
  'doctor-octopus': 'villain',
  'eddie-brock': 'villain',
  galactus: 'villain',
  juggernaut: 'villain',
  mystique: 'villain',
  'norman-osborn': 'villain',
  sabretooth: 'villain',

  // Civiles no combatientes: se quedan sin rol a propósito
  // 'j-jonah-jameson', 'mary-jane-watson', 'may-parker'
};

/** Rol: primero el curado, luego el investigado; null si no se conoce. */
const resolveRole = (curatedRole: CharacterRole | null, slug: string): CharacterRole | null =>
  curatedRole ?? DISCOVERED_ROLES[slug] ?? null;

function main() {
  // npm se traga `--dry-run` (es flag suyo), así que se aceptan ambos nombres.
  const dryRun = process.argv.includes('--dry-run') || process.argv.includes('--skip-seed');

  console.log('📖 Leyendo el dataset de Marvel...');

  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`No se encontró el CSV en: ${CSV_PATH}`);
  }

  const records = parse(fs.readFileSync(CSV_PATH, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as MarvelCsvRow[];

  console.log(`✅ ${records.length} personajes leídos.`);

  const excludedTeams = new Set<string>();
  let withoutThumbnail = 0;
  let withoutAppearances = 0;

  const characters: CharacterOutput[] = records
    .map((row): CharacterOutput | null => {
      const marvelId = Number(row.id);
      const name = row.name?.trim() ?? '';

      if (!Number.isFinite(marvelId) || !name) return null;

      const popularity = calculatePopularity(row);
      const score = popularityScore(popularity);
      const normalized = normalizeName(name);
      const thumbnail = parseThumbnail(row.thumbnail);

      if (score <= 0 || NOT_A_CHARACTER.has(normalized)) {
        if (NOT_A_CHARACTER.has(normalized)) excludedTeams.add(name);
        if (score <= 0) withoutAppearances += 1;
        return null;
      }

      // Requiere imagen real: en Marvel un personaje sin foto usa el
      // placeholder "image_not_available" y en la app no tiene carta usable.
      if (!thumbnail) {
        withoutThumbnail += 1;
        return null;
      }

      const curated = findCuratedMatch(marvelId, name);
      const slug = slugify(name) || `character-${marvelId}`;

      return {
        marvelId,
        slug,
        name,
        description: (row.description ?? '').trim(),
        modified: row.modified || null,
        thumbnail,
        thumbnailUrl: thumbnailUrl(thumbnail),
        role: resolveRole(curated?.character.role ?? null, slug),
        curatedExact: Boolean(curated?.exactMatch),
        popularityScore: score,
        popularity,
        urls: parseUrls(row.urls),
      } satisfies CharacterOutput;
    })
    .filter((character): character is CharacterOutput => character !== null)
    // Orden determinístico: primero puntaje, luego nombre e id como desempate.
    .sort(
      (a, b) =>
        b.popularityScore - a.popularityScore ||
        a.name.localeCompare(b.name) ||
        a.marvelId - b.marvelId,
    )
    .slice(0, TOP_LIMIT);

  // El slug viene del nombre; si dos coinciden, se desempata con el id.
  const usedSlugs = new Set<string>();
  for (const character of characters) {
    let slug = character.slug;
    if (usedSlugs.has(slug)) slug = `${slug}-${character.marvelId}`;
    usedSlugs.add(slug);
    character.slug = slug;
  }

  if (characters.length < TOP_LIMIT) {
    console.warn(`⚠️  Solo quedaron ${characters.length} personajes válidos.`);
  }

  const teamsFound = [...excludedTeams].sort();
  console.log(`🚫 ${teamsFound.length} equipos/organizaciones excluidos.`);
  if (teamsFound.length) console.log(`   ${teamsFound.slice(0, 20).join(', ')}`);
  console.log(`🚫 ${withoutThumbnail} sin imagen real y ${withoutAppearances} sin apariciones descartados.`);

  console.log(`🏆 Top ${characters.length} personajes calculados.`);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(characters, null, 2), 'utf-8');
  console.log(`💾 Guardado en: ${OUTPUT_PATH}`);

  console.log('\n🏆 TOP 10:');
  characters.slice(0, 10).forEach((character, index) => {
    console.log(`${index + 1}. ${character.name} — ${character.popularityScore}`);
  });

  const curatedInTop = characters.filter((character) => character.curatedExact).length;
  const withRole = characters.filter((character) => character.role !== null).length;

  // Los curados que quedaron fuera del top (se resuelven igual que en el mapeo).
  const resolvedCurated = new Set<string>();
  for (const character of characters) {
    const match = findCuratedMatch(character.marvelId, character.name);
    if (match) resolvedCurated.add(match.character.name);
  }
  const missingCurated = CURATED_CHARACTERS.filter(
    (character) => !resolvedCurated.has(character.name),
  ).map((character) => character.name);

  console.log(`\n📌 Curados exactos en el top: ${curatedInTop} · Con rol asignado: ${withRole}`);
  if (missingCurated.length) {
    console.log(`   Curados que NO entraron al top: ${missingCurated.join(', ')}`);
  }
  console.log('   (el resto queda con role=null: el dataset no incluye héroe/villano)');

  if (dryRun) {
    console.log('\n🧪 Dry run: no se tocó MongoDB.');
    return;
  }

  return seed(characters);
}

async function seed(characters: CharacterOutput[]) {
  if (!env.mongoUri) {
    throw new Error('MongoDB no está configurado. Revisa MONGO_URI o MONGO_USER/PASSWORD/DATABASE/CLUSTER en .env');
  }

  console.log('\n🔌 Conectando a MongoDB...');
  await mongoose.connect(env.mongoUri);

  try {
    const previous = await MarvelCharacter.countDocuments();
    await MarvelCharacter.deleteMany({});

    if (characters.length > 0) {
      await MarvelCharacter.insertMany(
        characters.map((character) => ({
          id: String(character.marvelId),
          slug: character.slug,
          name: character.name,
          description: character.description,
          thumbnailUrl: character.thumbnailUrl ?? '',
          role: character.role,
          popularityScore: character.popularityScore,
          popularity: character.popularity,
          urls: character.urls,
        })),
        { ordered: false },
      );
    }

    const total = await MarvelCharacter.countDocuments();
    console.log(`✅ MongoDB: había ${previous} → ahora ${total} personajes.`);
    console.log('🎉 Listo.');
  } finally {
    await mongoose.disconnect();
  }
}

main()?.catch((error) => {
  console.error('\n❌ Error:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
