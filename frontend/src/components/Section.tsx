import type { ReactNode } from 'react'

export const Container = ({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) => (
  <div
    className={`mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 ${className}`}
  >
    {children}
  </div>
)

export const SectionHeading = ({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) => (
  <h2 className={`text-primary text-title2 lg:text-title1 ${className}`}>
    {children}
  </h2>
)
