import { SlashCommandBuilder } from 'discord.js';
import { addExcludededUsers } from './methods';

declare module 'discord.js' {
  interface SlashCommandBuilder {
    addExcludededUsers(countOfExcludedUsers: number): this;
  }
}

SlashCommandBuilder.prototype.addExcludededUsers = addExcludededUsers;
