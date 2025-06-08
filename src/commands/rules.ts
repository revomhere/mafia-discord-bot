import { t } from '@/i18n';
import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder().setDescription(t('commands.rules.description'))
};
