import { SlashCommandBuilder, Interaction } from 'discord.js';

export type Command = {
  data: SlashCommandBuilder;
  execute: (interaction: Interaction) => Promise<void> | void;
};
