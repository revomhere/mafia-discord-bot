import { t } from '@/i18n';
import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';

type Options = {
  isPublic?: boolean;
  channelId?: string;
};

export const handleError = async (interaction: ChatInputCommandInteraction, error: string, options?: Options) => {
  console.error(`${new Date()}: Error - ${error}`);

  const embed = new EmbedBuilder()
    .setTitle(t('errors.default'))
    .setDescription(error)
    .setColor(0xff4c4c) // Red color
    .setTimestamp();

  return await interaction.reply({
    embeds: [embed],
    flags: options?.isPublic ? undefined : MessageFlags.Ephemeral
  });
};
