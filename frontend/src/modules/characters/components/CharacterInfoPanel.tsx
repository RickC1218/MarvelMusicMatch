import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '../../../components/Button';
import type { CharacterDetail } from '../../../types/character';
import type { GeneratedPlaylist } from '../../../types/playlist';

interface CharacterInfoPanelProps {
  character: CharacterDetail;
  profile: GeneratedPlaylist['profile'] | null;
  /** Mientras la IA redacta el perfil se muestran esqueletos, no la descripción. */
  loading?: boolean;
}

const ParagraphSkeleton = () => (
  <div className="flex flex-col gap-2">
    <div className="h-4 w-28 animate-pulse rounded bg-neutral" />
    <div className="h-3 w-full animate-pulse rounded bg-neutral" />
    <div className="h-3 w-5/6 animate-pulse rounded bg-neutral" />
  </div>
);

const CharacterInfoPanel = ({ character, profile, loading = false }: CharacterInfoPanelProps) => {
  const comicsUrl =
    character.urls.find((url) => url.type === 'comiclink')?.url ??
    character.urls.find((url) => url.type === 'detail')?.url;

  const showSkeleton = loading && !profile;
  // La descripción oficial solo se usa como respaldo si no hay generación en curso.
  const personality =
    profile?.personality || character.description || 'Todavía no conocemos su personalidad.';

  return (
    <article className="grid gap-6 rounded-2xl border border-neutral bg-white p-6 md:grid-cols-[240px_1fr]">
      <div className="flex h-[240px] items-center justify-center overflow-hidden rounded-xl bg-background md:h-full">
        {character.thumbnail ? (
          <img
            src={character.thumbnail}
            alt={character.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <FontAwesomeIcon
            icon={character.role === 'villain' ? 'skull' : 'shield-halved'}
            className="h-16 w-16 text-muted"
          />
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-title2 text-primary">{character.name}</h3>

        {showSkeleton ? (
          <>
            <ParagraphSkeleton />
            <ParagraphSkeleton />
            <ParagraphSkeleton />
          </>
        ) : (
          <>
            <p className="text-secondary text-primary">
              <span className="font-semibold">Personalidad: </span>
              {personality}
            </p>

            {profile?.powers && (
              <p className="text-secondary text-primary">
                <span className="font-semibold">Poderes: </span>
                {profile.powers}
              </p>
            )}

            {profile?.summary && (
              <p className="text-secondary text-primary">
                <span className="font-semibold">Resumen: </span>
                {profile.summary}
              </p>
            )}
          </>
        )}

        {comicsUrl && (
          <Button
            label="Ver comics"
            variant="primary"
            icon="arrow-up-right-from-square"
            href={comicsUrl}
            className="self-start text-tags"
          />
        )}
      </div>
    </article>
  );
};

export default CharacterInfoPanel;
