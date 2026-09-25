import { PlaylistCard } from '../../../components/PlaylistCard';
import { Scroller } from '../../../components/Scroller';
import { Container, SectionHeading } from '../../../components/Section';
import { EmptyState, ErrorState, LoadingPlaylistCards } from '../../../components/StateFeedback';
import { useRoleMode } from '../../../context/RoleModeContext';
import { useAsyncData } from '../../../hooks/useAsyncData';
import { listPlaylists } from '../../../services/playlistService';

const PopularPlaylists = () => {
  const { role } = useRoleMode();
  const { data, loading, error, reload } = useAsyncData(
    (signal) => listPlaylists(1, 8, role, signal),
    [role],
  );

  return (
    <section>
      <Container className="flex flex-col gap-5">
        <SectionHeading>Playlist populares</SectionHeading>

        {loading && <LoadingPlaylistCards count={4} />}

        {!loading && error && <ErrorState message={error} onRetry={reload} />}

        {!loading && !error && data && data.items.length === 0 && (
          <EmptyState
            title={
              role === 'villain'
                ? 'Todavía no hay playlists de villanos'
                : 'Todavía no hay playlists de héroes'
            }
            description="Crea la tuya desde cualquier personaje y aparecerá aquí."
          />
        )}

        {!loading && !error && data && data.items.length > 0 && (
          <Scroller>
            {data.items.map((playlist) => (
              <div key={playlist._id} className="w-[240px] shrink-0 snap-start">
                <PlaylistCard playlist={playlist} />
              </div>
            ))}
          </Scroller>
        )}
      </Container>
    </section>
  );
};

export default PopularPlaylists;
