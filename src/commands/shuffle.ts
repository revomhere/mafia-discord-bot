import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, EmbedBuilder } from 'discord.js';
import { handleError, getMafiaRolesArray, getNicknameNumber, channelLog } from '@/helpers';
import { roleEmojis, roleColors, roleDescriptions, roleNames } from '@/enums';
import { CompleteUser } from '@/types';
import { shuffle } from 'lodash-es';
import config from '@/config';
import { t } from '@/i18n';

const { countOfExcludedPlayers, minPlayers } = config.shuffle;

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
          user: interaction.user.username
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
  const newNickname = getNicknameNumber(number + 1);
  const member = interaction.guild?.members.cache.get(user.player.id);

  if (!member) {
    console.error(`Member not found for user ${user.player.username}`);
    return user.player;
  }

  try {
    await member.setNickname(newNickname, t('commands.shuffle.change-nickname'));
  } catch (e) {
    return user.player;
  }
};

export default {
  data: new SlashCommandBuilder()
    .setDescription(t('commands.shuffle.description'))
    .addExcludededUsers(countOfExcludedPlayers),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    if (!interaction.memberPermissions?.has('Administrator'))
      return handleError(interaction, t('errors.no-admin-role'));

    const channel = interaction.guild?.channels?.cache?.get(config.channelId);

    if (!channel || channel.type !== ChannelType.GuildVoice)
      return handleError(interaction, t('errors.no-channel-or-not-voice'));

    const allUsers = channel.members.map(member => member.user);
    if (!allUsers) return handleError(interaction, t('errors.cant-get-users'));

    const excludedUsersIds = Array.from({ length: countOfExcludedPlayers }, (_, i) =>
      interaction.options.getUser(`user-to-exclude-${i + 1}`)
    )
      .filter(Boolean)
      .map(user => user?.id);
    excludedUsersIds.push(interaction.user.id);

    const players = allUsers.filter(user => !excludedUsersIds.includes(user.id));
    if (!players.length) return handleError(interaction, t('errors.no-players'));
    if (players.length < minPlayers)
      return handleError(interaction, t('errors.not-enough-players', { min: minPlayers }));

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

    const logMessage = playersWithRoles
      .map((user, idx) => {
        return (
          roleEmojis[user.role] +
          ' ' +
          roleNames[user.role] +
          ' ' +
          getNicknameNumber(idx + 1) +
          ' - ' +
          `${user.player.username}`
        );
      })
      .join('\n');

    await channelLog(interaction, logMessage);

    const messageToAuthor = new EmbedBuilder()
      .setTitle(t('commands.shuffle.author.title'))
      .setColor(0x2ecc71) // #2ECC71
      .setDescription(logMessage);

    await interaction.user.send({
      embeds: [messageToAuthor]
    });

    const replyMessage =
      t('commands.shuffle.result.description') +
      failedDms.map(user => '\n' + t('commands.shuffle.result.failed-dm', { user: user?.username })) +
      failedNicknameChanges.map(
        user =>
          '\n' +
          t('commands.shuffle.result.failed-nickname', {
            user: `${user?.username}`,
            nickname: getNicknameNumber(playersWithRoles.findIndex(u => u.player.id === user?.id) + 1)
          })
      ) +
      '\n\n' +
      playersWithRoles.map((user, idx) => `${user.player.username}: ${getNicknameNumber(idx + 1)}`).join('\n');

    const response = new EmbedBuilder()
      .setTitle(t('commands.shuffle.result.title'))
      .setColor(0x2ecc71) // #2ECC71
      .setDescription(replyMessage);

    return interaction.editReply({
      embeds: [response]
    });
  }
};
