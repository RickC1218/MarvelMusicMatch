import type { IconProp } from '@fortawesome/fontawesome-svg-core'
import type { CharacterRole } from '../types/character'

interface RoleCta {
  label: string
  icon: IconProp
  to: string
}

export const ROLE_CTAS: Record<CharacterRole, RoleCta> = {
  hero: {
    label: 'Explorar heroes',
    icon: 'shield-halved',
    to: '/characters?role=hero',
  },
  villain: {
    label: 'Explorar villanos',
    icon: 'skull',
    to: '/characters?role=villain',
  },
}
