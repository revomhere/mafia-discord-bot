import { MafiaRole, VampireMafiaRole } from '@/enums';
import { User } from 'discord.js';

export type Role = MafiaRole | VampireMafiaRole;

export type RoleMetadata = {
  emoji: string;
  name: string;
  description: string;
  color: number;
};

export type CompleteUser = {
  player: User;
  role: Role;
};
