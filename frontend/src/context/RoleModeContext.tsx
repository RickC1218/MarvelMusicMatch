import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import type { CharacterRole } from '../types/character'

interface RoleModeContextValue {
  role: CharacterRole
  setRole: (role: CharacterRole) => void
}

const RoleModeContext = createContext<RoleModeContextValue | undefined>(
  undefined
)

const isRole = (value: string | null): value is CharacterRole =>
  value === 'hero' || value === 'villain'

export const RoleModeProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<CharacterRole>('hero')
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const param = searchParams.get('role')
    if (isRole(param)) setRole(param)
  }, [searchParams])

  useEffect(() => {
    document.documentElement.classList.toggle(
      'role-villain',
      role === 'villain'
    )
  }, [role])

  const value = useMemo(() => ({ role, setRole }), [role])

  return (
    <RoleModeContext.Provider value={value}>
      {children}
    </RoleModeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useRoleMode = () => {
  const context = useContext(RoleModeContext)
  if (!context) {
    throw new Error('useRoleMode debe usarse dentro de RoleModeProvider')
  }
  return context
}
