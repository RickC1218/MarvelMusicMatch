import { Button } from '../../../components/Button';
import { CharacterCard } from '../../../components/CharacterCard';
import { Scroller } from '../../../components/Scroller';
import { Container, SectionHeading } from '../../../components/Section';
import { EmptyState, ErrorState, LoadingCharacterScroller } from '../../../components/StateFeedback';
import { useRoleMode } from '../../../context/RoleModeContext';
import { useCharacters } from '../../../hooks/useCharacters';
import { ROLE_CTAS } from '../../../lib/roleCtas';

const FeaturedCharacters = () => {
  const { role } = useRoleMode();
  const cta = ROLE_CTAS[role];
  const { data, loading, error, reload } = useCharacters({ role, page: 1, pageSize: 8 });

  return (
    <section>
      <Container className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <SectionHeading>¿Qué escuchan ellos?</SectionHeading>
          <Button
            label={cta.label}
            variant="primary"
            icon={cta.icon}
            to={cta.to}
            className="hidden text-tags md:inline-flex"
          />
        </div>

        {loading && <LoadingCharacterScroller count={4} />}

        {!loading && error && <ErrorState message={error} onRetry={reload} />}

        {!loading && !error && data && data.items.length === 0 && (
          <EmptyState
            title={role === 'villain' ? 'No hay villanos disponibles' : 'No hay héroes disponibles'}
            description="Configura la Marvel API en el backend o inténtalo más tarde."
          />
        )}

        {!loading && !error && data && data.items.length > 0 && (
          <Scroller>
            {data.items.map((character) => (
              <div key={character.slug} className="w-[252px] shrink-0 snap-start">
                <CharacterCard character={character} />
              </div>
            ))}
          </Scroller>
        )}
      </Container>
    </section>
  );
};

export default FeaturedCharacters;
