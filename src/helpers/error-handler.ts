import { t } from '@/i18n';
import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';

export const handleError = async (interaction: ChatInputCommandInteraction, error: string) => {
  console.error(`${new Date()}::/${interaction.command?.name}:: Error - ${error}`);

  const embed = new EmbedBuilder()
    .setTitle(t('errors.default'))
    .setDescription(error)
    .setColor(0xff4c4c) // #ff4c4c
    .setTimestamp();

  if (interaction.deferred || interaction.replied) {
    return interaction.editReply({ embeds: [embed] });
  }

  return interaction.reply({ embeds: [embed] });
};
