import type { IconProp } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { ReactNode } from 'react'
import { Button } from './Button'
import { Scroller } from './Scroller'

interface FeedbackPanelProps {
  icon: IconProp
  title: string
  description?: string
  tone?: 'danger' | 'muted'
  children?: ReactNode
}

const FeedbackPanel = ({
  icon,
  title,
  description,
  tone = 'muted',
  children,
}: FeedbackPanelProps) => (
  <div
    role={tone === 'danger' ? 'alert' : 'status'}
    className='flex flex-col items-center gap-3 rounded-2xl border border-neutral bg-white px-6 py-10 text-center'
  >
    <FontAwesomeIcon
      icon={icon}
      className={`h-8 w-8 ${tone === 'danger' ? 'text-danger' : 'text-muted'}`}
    />
    <h3 className='text-body text-primary'>{title}</h3>
    {description && (
      <p className='max-w-md text-secondary text-muted'>{description}</p>
    )}
    {children}
  </div>
)

export const ErrorState = ({
  message,
  onRetry,
  title = 'No pudimos cargar la información',
}: {
  message: string
  onRetry?: () => void
  title?: string
}) => (
  <FeedbackPanel
    icon='circle-exclamation'
    title={title}
    description={message}
    tone='danger'
  >
    {onRetry && (
      <Button label='Reintentar' variant='outline' onClick={onRetry} />
    )}
  </FeedbackPanel>
)

export const EmptyState = ({
  title,
  description,
}: {
  title: string
  description?: string
}) => (
  <FeedbackPanel icon='compact-disc' title={title} description={description} />
)

const CharacterCardSkeleton = () => (
  <div className='flex h-[400px] w-full flex-col items-center justify-between gap-3 rounded-2xl border border-neutral bg-white p-2 pb-4'>
    <div className='h-[254px] w-full max-w-[236px] animate-pulse rounded-xl bg-neutral' />
    <div className='h-4 w-2/3 animate-pulse rounded bg-neutral' />
    <div className='h-3 w-1/2 animate-pulse rounded bg-neutral' />
  </div>
)

export const LoadingCards = ({ count = 4 }: { count?: number }) => (
  <div className='grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4'>
    {Array.from({ length: count }).map((_, index) => (
      <CharacterCardSkeleton key={index} />
    ))}
  </div>
)

export const LoadingCharacterScroller = ({ count = 4 }: { count?: number }) => (
  <Scroller>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className='w-[252px] shrink-0 snap-start'>
        <CharacterCardSkeleton />
      </div>
    ))}
  </Scroller>
)

export const LoadingPlaylistCards = ({ count = 4 }: { count?: number }) => (
  <Scroller>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className='w-[240px] shrink-0 snap-start'>
        <div className='relative h-[240px] w-full overflow-hidden rounded-2xl bg-primary'>
          <div className='absolute left-1/2 top-1/2 h-[198px] w-[178px] max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-xl bg-muted/40' />
          <div className='absolute inset-x-0 bottom-0 top-1/2 flex flex-col items-center justify-end gap-2 bg-primary px-4 pb-4'>
            <div className='h-4 w-1/2 animate-pulse rounded bg-muted/40' />
            <div className='h-11 w-full animate-pulse rounded-lg bg-muted/40' />
          </div>
        </div>
      </div>
    ))}
  </Scroller>
)
