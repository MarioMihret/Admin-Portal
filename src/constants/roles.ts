export const ROLES = {
  SUPER_ADMIN: 'super-admin',
  ADMIN: 'admin',
  USER: 'user' 
} as const;

export type AppRole = typeof ROLES[keyof typeof ROLES]; 