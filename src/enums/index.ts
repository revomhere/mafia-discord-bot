import { Role, RoleMetadata } from '@/types';
import { mafiaMetadata } from './mafia';
import { vampireMafiaMetadata } from './vampire-mafia';

export * from './mafia';
export * from './vampire-mafia';

export const generalRolesMetadata: Record<Role, RoleMetadata> = {
  ...mafiaMetadata,
  ...vampireMafiaMetadata
};
