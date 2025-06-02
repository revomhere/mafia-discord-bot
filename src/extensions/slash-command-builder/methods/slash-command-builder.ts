import { SlashCommandBuilder } from 'discord.js';

export function addUsers(
  this: SlashCommandBuilder,
  countOfExcludedUsers: number
): SlashCommandBuilder {
  for (let i = 0; i < countOfExcludedUsers; i++) {
    this.addUserOption(option =>
      option
        .setName(`user${i + 1}`)
        .setDescription(`Гравець, якого не потрібно перемішувати`)
        .setRequired(false)
    );
  }

  return this;
}
