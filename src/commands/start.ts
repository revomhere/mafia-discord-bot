import { handleError, getMafiaRolesArray, getNicknameNumber, channelLog, dmRole, changeNickname } from '@/helpers';
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  User
} from 'discord.js';
import { roleEmojis, roleNames } from '@/enums';
import { CompleteUser } from '@/types';
import { shuffle } from 'lodash-es';
import config from '@/config';
import { t } from '@/i18n';

const { minPlayers } = config.start;

export default {
  data: new SlashCommandBuilder().setDescription(t('commands.start.description')),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.memberPermissions?.has('Administrator'))
      return handleError(interaction, t('errors.no-admin-role'));

    const channel = interaction.guild?.channels.cache.get(config.channelId);
    if (!channel || channel.type !== ChannelType.GuildVoice)
      return handleError(interaction, t('errors.no-channel-or-not-voice'));

    const allUsers = channel.members.map(m => m.user).filter(user => !(user.id === interaction.user.id));
    if (!allUsers.length) return handleError(interaction, t('errors.cant-get-users'));

    await startExclusionFlow(interaction, allUsers);
  }
};

async function startExclusionFlow(interaction: ChatInputCommandInteraction, allUsers: User[]) {
  const excluded = new Set<string>();

  const createButtons = () => {
    const userButtons = allUsers.map(user => {
      const isExcluded = excluded.has(user.id);
      return new ButtonBuilder()
        .setCustomId(`exclude_${user.id}`)
        .setLabel(user.username)
        .setStyle(isExcluded ? ButtonStyle.Danger : ButtonStyle.Secondary)
        .setDisabled(false);
    });

    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let i = 0; i < userButtons.length; i += 5) {
      rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(userButtons.slice(i, i + 5)));
    }

    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel_game')
      .setLabel(t('commands.start.choose.cancel-btn'))
      .setStyle(ButtonStyle.Danger)
      .setDisabled(false);

    const startButton = new ButtonBuilder()
      .setCustomId('start_game')
      .setLabel(t('commands.start.choose.start-btn'))
      .setStyle(ButtonStyle.Success)
      .setDisabled(allUsers.length - excluded.size < minPlayers);

    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(cancelButton, startButton));

    return rows;
  };

  const message = await interaction.editReply({
    content: t('commands.start.choose.description', {
      button: t('commands.start.choose.start-btn')
    }),
    components: createButtons()
  });

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 5 * 60 * 1000 // 5 min
  });

  collector.on('collect', async i => {
    if (i.user.id !== interaction.user.id) {
      return i.reply({ content: t('commands.start.choose.buttons-not-for-you'), ephemeral: true });
    }

    if (i.customId === 'cancel_game') {
      collector.stop('cancelled');
      return i.update({ content: t('commands.start.choose.game-cancelled'), components: [] });
    }

    if (i.customId === 'start_game') {
      const playersCount = allUsers.length - excluded.size;
      if (playersCount < minPlayers) {
        return i.reply({
          content: t('errors.not-enough-players', { min: minPlayers }),
          ephemeral: true
        });
      }

      collector.stop('started');
      await i.update({ content: t('commands.start.choose.game-starting'), components: [] });

      await runShuffleLogic(interaction, allUsers, Array.from(excluded));
      return;
    }

    const userId = i.customId.replace('exclude_', '');
    if (excluded.has(userId)) excluded.delete(userId);
    else excluded.add(userId);

    await i.update({
      content: t('commands.start.choose.description', {
        button: t('commands.start.choose.start-btn')
      }),
      components: createButtons()
    });
  });

  collector.on('end', (_, reason) => {
    if (reason !== 'started' && reason !== 'cancelled') {
      interaction.editReply({
        content: t('commands.start.choose.time-is-gone'),
        components: []
      });
    }
  });
}

async function runShuffleLogic(interaction: ChatInputCommandInteraction, allUsers: User[], excludedUserIds: string[]) {
  const players = allUsers.filter(user => !excludedUserIds.includes(user.id));
  if (!players.length) return handleError(interaction, t('errors.no-players'));
  if (players.length < minPlayers) return handleError(interaction, t('errors.not-enough-players', { min: minPlayers }));

  const roles = getMafiaRolesArray(players.length);

  const playersWithRoles: CompleteUser[] = shuffle(
    players.map((player, idx) => ({
      player,
      role: roles[idx]
    }))
  );

  const [dms, nicknameChanges] = await Promise.all([
    Promise.all(playersWithRoles.map(user => dmRole(interaction, user))),
    Promise.all(playersWithRoles.map((user, idx) => changeNickname(interaction, user, idx)))
  ]);

  const failedDms = dms.filter(Boolean);
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

  const messageToAuthor = new EmbedBuilder()
    .setTitle(t('commands.start.author.title'))
    .setColor(0x2ecc71)
    .setDescription(logMessage);

  await Promise.all([
    channelLog(interaction, logMessage),
    interaction.user.send({
      embeds: [messageToAuthor]
    })
  ]);

  const replyMessage =
    t('commands.start.result.description') +
    failedDms.map(user => '\n' + t('commands.start.result.failed-dm', { user: user?.username })) +
    failedNicknameChanges.map(
      user =>
        '\n' +
        t('commands.start.result.failed-nickname', {
          user: `${user?.username}`,
          nickname: getNicknameNumber(playersWithRoles.findIndex(u => u.player.id === user?.id) + 1)
        })
    ) +
    '\n\n' +
    playersWithRoles.map((user, idx) => `${user.player.username}: ${getNicknameNumber(idx + 1)}`).join('\n');

  const response = new EmbedBuilder()
    .setTitle(t('commands.start.result.title'))
    .setColor(0x2ecc71)
    .setDescription(replyMessage);

  if (interaction.channel && 'send' in interaction.channel) {
    try {
      await interaction.channel.send({
        embeds: [response]
      });
      await interaction.deleteReply();
    } catch (e) {}

    return;
  }

  return await interaction.editReply({
    embeds: [response]
  });
}
