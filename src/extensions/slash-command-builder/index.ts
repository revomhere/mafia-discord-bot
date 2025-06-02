import { SlashCommandBuilder } from 'discord.js';
import { addUsers } from './methods';

declare module 'discord.js' {
  interface SlashCommandBuilder {
    addUsers(countOfExcludedUsers: number): this;
  }
}

SlashCommandBuilder.prototype.addUsers = addUsers;
