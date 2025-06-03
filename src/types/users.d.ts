import { MafiaRole } from '@/enums';
import { User } from 'discord.js';

export type CompleteUser = {
  player: User;
  role: MafiaRole;
};
