import { ChatInputCommandInteraction, User } from 'discord.js';
import config from '@/config';

const getLogChannel = async (interaction: ChatInputCommandInteraction) => {
  const guild = await interaction.client.guilds.fetch(config.logGuildId);

  if (!guild) {
    console.error(`${new Date()}: Log guild not found: ${config.logGuildId}`);
    return null;
  }

  const channel = guild.channels.cache.get(config.logChannelId);

  if (!channel || !channel.isTextBased()) {
    console.error(`${new Date()}: Log channel not found or not text-based: ${config.logChannelId}`);
    return null;
  }

  return channel;
};

export const channelLog = async (interaction: ChatInputCommandInteraction, message: string) => {
  const channel = await getLogChannel(interaction);

  if (!channel) return;

  try {
    await channel.send({
      content: message
    });
  } catch (error) {
    console.error(`${new Date()}: Failed to send log message:`, error);
  }
};
