import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';

export const handleError = async (interaction: ChatInputCommandInteraction, error: string) => {
  console.error(`${new Date()}: Error - ${error}`);

  const embed = new EmbedBuilder()
    .setTitle('❌ Помилка')
    .setDescription(error)
    .setColor(0xff4c4c) // Red color
    .setTimestamp();

  return await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral
  });
};
