import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CharacterCard } from '../../components/CharacterCard';
import { Pagination } from '../../components/Pagination';
import { SearchBar } from '../../components/SearchBar';
import { Container, SectionHeading } from '../../components/Section';
import { EmptyState, ErrorState, LoadingCards } from '../../components/StateFeedback';
import { useCharacters } from '../../hooks/useCharacters';
import type { CharacterRole } from '../../types/character';

const PAGE_SIZE = 12;

const isRole = (value: string | null): value is CharacterRole =>
  value === 'hero' || value === 'villain';

const CharactersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const roleParam = searchParams.get('role');
  const role = isRole(roleParam) ? roleParam : undefined;
  const query = searchParams.get('q')?.trim() ?? '';
  const page = Math.max(Number(searchParams.get('page')) || 1, 1);

  const { data, loading, error, reload } = useCharacters({
    role,
    query,
    page,
    pageSize: PAGE_SIZE,
  });

  const updateParams = useCallback(
    (changes: Record<string, string | undefined>) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value);
            else next.delete(key);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleSearch = (value: string) =>
    updateParams({ q: value || undefined, page: undefined });

  const heading = query
    ? `Resultados para "${query}"`
    : role === 'hero'
      ? 'Héroes'
      : role === 'villain'
        ? 'Villanos'
        : '¿Qué escuchan ellos?';

  return (
    <Container className="flex flex-col gap-6 py-6">
      <SearchBar key={query} defaultValue={query} onSubmit={handleSearch} />
      <SectionHeading>{heading}</SectionHeading>

      {loading && <LoadingCards count={8} />}

      {!loading && error && <ErrorState message={error} onRetry={reload} />}

      {!loading && !error && data && data.items.length === 0 && (
        <EmptyState
          title="Sin resultados"
          description={
            query
              ? 'Prueba con otro nombre de personaje.'
              : 'No hay personajes para este filtro.'
          }
        />
      )}

      {!loading && !error && data && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {data.items.map((character) => (
              <CharacterCard key={character.slug} character={character} />
            ))}
          </div>

          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onChange={(nextPage) => updateParams({ page: String(nextPage) })}
          />
        </>
      )}
    </Container>
  );
};

export default CharactersPage;
