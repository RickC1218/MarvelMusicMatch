import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

export const Scroller = ({ children }: { children: ReactNode }) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(true)

  const update = useCallback(() => {
    const track = trackRef.current
    if (!track) return

    const { scrollLeft, clientWidth, scrollWidth } = track
    setAtStart(scrollLeft <= 1)
    setAtEnd(scrollLeft + clientWidth >= scrollWidth - 1)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    update()
    track.addEventListener('scroll', update, { passive: true })

    const observer = new ResizeObserver(update)
    observer.observe(track)

    return () => {
      track.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [update])

  const scroll = (direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({
      left: direction * track.clientWidth * 0.9,
      behavior: 'smooth',
    })
  }

  return (
    <div className='relative'>
      <div
        ref={trackRef}
        className='no-scrollbar flex snap-x gap-6 overflow-x-auto pb-2'
      >
        {children}
      </div>

      <button
        type='button'
        aria-label='Ver anteriores'
        onClick={() => scroll(-1)}
        className={`absolute -left-4 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-neutral shadow-md transition-opacity hover:opacity-90 lg:flex ${
          atStart ? 'invisible opacity-0' : 'opacity-100'
        }`}
      >
        <FontAwesomeIcon icon='arrow-left' className='h-3 w-3' />
      </button>

      <button
        type='button'
        aria-label='Ver más'
        onClick={() => scroll(1)}
        className={`absolute -right-4 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-neutral shadow-md transition-opacity hover:opacity-90 lg:flex ${
          atEnd ? 'invisible opacity-0' : 'opacity-100'
        }`}
      >
        <FontAwesomeIcon icon='arrow-right' className='h-3 w-3' />
      </button>
    </div>
  )
}
