import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, EmbedBuilder } from 'discord.js';
import { handleError, getMafiaRolesArray, getNicknameNumber } from '@/helpers';
import { roleEmojis, roleColors, roleDescriptions, roleNames } from '@/enums';
import { CompleteUser } from '@/types';
import { shuffle } from 'lodash-es';
import config from '@/config';
import { t } from '@/i18n';

const COUNT_OF_EXCLUDED_USERS = 10;
const MIN_PLAYERS = 4;

// returns user if failed to send DM
const dmRole = async (interaction: ChatInputCommandInteraction, user: CompleteUser) => {
  try {
    const embed = new EmbedBuilder()
      .setTitle(
        t('commands.shuffle.dm.title', {
          emoji: roleEmojis[user.role],
          role: roleNames[user.role]
        })
      )
      .setDescription(roleDescriptions[user.role])
      .setColor(roleColors[user.role])
      .setFooter({
        text: t('commands.shuffle.dm.footer', {
          time: new Date().toLocaleTimeString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }),
          user: `<@${interaction.user.id}>`
        })
      });

    await user.player.send({
      embeds: [embed]
    });
  } catch (e) {
    console.error(`Failed to send DM to ${user.player.username}: `, e);

    return user.player;
  }
};

// returns user if failed to change nickname
const changeNickname = async (interaction: ChatInputCommandInteraction, user: CompleteUser, number: number) => {
  try {
    const newNickname = getNicknameNumber(number + 1);
    const member = interaction.guild?.members.cache.get(user.player.id);

    if (!member) {
      console.error(`Member not found for user ${user.player.username}`);
      return user.player;
    }

    await member.setNickname(newNickname, t('commands.shuffle.change-nickname'));
  } catch (e) {
    console.error(`Failed to change username for ${user.player.username}: `, e);

    return user.player;
  }
};

export default {
  data: new SlashCommandBuilder()
    .setDescription(t('commands.shuffle.description'))
    .addExcludededUsers(COUNT_OF_EXCLUDED_USERS),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has('Administrator'))
      return handleError(interaction, t('errors.no-admin-role'));

    const channel = interaction.guild?.channels?.cache?.get(config.channelId);

    if (!channel || channel.type !== ChannelType.GuildVoice)
      return handleError(interaction, t('errors.no-channel-or-not-voice'));

    const allUsers = channel.members.map(member => member.user);
    if (!allUsers) return handleError(interaction, t('errors.cant-get-users'));

    const excludedUsersIds = Array.from({ length: COUNT_OF_EXCLUDED_USERS }, (_, i) =>
      interaction.options.getUser(`user-to-exclude-${i + 1}`)
    )
      .filter(Boolean)
      .map(user => user?.id);
    excludedUsersIds.push(interaction.user.id);

    const players = shuffle(allUsers.filter(user => !excludedUsersIds.includes(user.id)));
    if (!players.length) return handleError(interaction, t('errors.no-players'));
    if (players.length < MIN_PLAYERS)
      return handleError(interaction, t('errors.not-enough-players', { min: MIN_PLAYERS }));

    const roles = getMafiaRolesArray(players.length);

    const playersWithRoles: CompleteUser[] = shuffle(
      players.map((player, idx) => ({
        player,
        role: roles[idx]
      }))
    );

    const dms = await Promise.all(playersWithRoles.map(user => dmRole(interaction, user)));
    const failedDms = dms.filter(Boolean);

    const nicknameChanges = await Promise.all(
      playersWithRoles.map((user, idx) => changeNickname(interaction, user, idx))
    );
    const failedNicknameChanges = nicknameChanges.filter(Boolean);

    const description =
      t('commands.shuffle.result.description') +
      failedDms.map(user => '\n' + t('commands.shuffle.result.failed-dm', { user: `<@${user?.id}>` })) +
      failedNicknameChanges.map(
        user =>
          '\n' +
          t('commands.shuffle.result.failed-nickname', {
            user: `<@${user?.id}>`,
            nickname: getNicknameNumber(playersWithRoles.findIndex(u => u.player.id === user?.id) + 1)
          })
      ) +
      '\n\n' +
      playersWithRoles.map((user, idx) => `<@${user.player.id}>: ${getNicknameNumber(idx + 1)}`).join('\n');

    const response = new EmbedBuilder()
      .setTitle(t('commands.shuffle.result.title'))
      .setColor(0x00ff00)
      .setDescription(description);

    await interaction.reply({
      embeds: [response]
    });
  }
};
