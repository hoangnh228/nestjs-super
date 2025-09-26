export const ROLES = {
  ADMIN: 'ADMIN',
  CLIENT: 'CLIENT',
  SELLER: 'SELLER',
} as const

export type RoleType = (typeof ROLES)[keyof typeof ROLES]
