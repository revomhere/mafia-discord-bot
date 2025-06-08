import { t } from '@/i18n';
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder
} from 'discord.js';

export default {
  data: new SlashCommandBuilder().setDescription(t('commands.rules.description')),

  execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder().setTitle(t('general.mafia_rules.title'));

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
};
