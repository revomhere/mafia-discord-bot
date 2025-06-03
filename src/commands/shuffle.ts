import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType } from 'discord.js';
import { handleError } from '@/helpers';
import config from '@/config';
import { t } from '@/i18n';

const COUNT_OF_EXCLUDED_USERS = 20; // Number of users to exclude from shuffling

export default {
  data: new SlashCommandBuilder().setDescription(t('commands.shuffle.description')).addUsers(COUNT_OF_EXCLUDED_USERS),

  execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has('Administrator'))
      return handleError(interaction, t('errors.no-admin-role'));

    const channel = interaction.guild?.channels?.cache?.get(config.channelId);

    if (!channel || channel.type !== ChannelType.GuildVoice)
      return handleError(interaction, t('errors.no-channel-or-not-voice'));

    const allUsers = channel.members.map(member => member.user);
    if (!allUsers) return handleError(interaction, t('errors.cant-get-users'));
  }
};
