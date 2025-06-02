import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';

export const handleError = async (interaction: ChatInputCommandInteraction, error: string) => {
  console.error(`${new Date()}: Error - ${error}`);

  await interaction.reply({
    content: error,
    flags: MessageFlags.Ephemeral
  });
};
