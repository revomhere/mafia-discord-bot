import { SlashCommandBuilder } from 'discord.js';
import { t } from '@/i18n';

export function addExcludededUsers(this: SlashCommandBuilder, countOfExcludedUsers: number): SlashCommandBuilder {
  for (let i = 0; i < countOfExcludedUsers; i++) {
    this.addUserOption(option =>
      option
        .setName(`user-to-exclude-${i + 1}`)
        .setDescription(t('extensions.slash-command-builder.description'))
        .setRequired(false)
    );
  }

  return this;
}
