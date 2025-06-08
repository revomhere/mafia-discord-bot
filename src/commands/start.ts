import {
  generatePrivateLogMessage,
  generatePublicLogMessage,
  getMafiaRolesArray,
  changeNickname,
  handleDmError,
  handleError,
  channelLog,
  dmRole
} from '@/helpers';
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ComponentType,
  ChannelType,
  ButtonStyle,
  User,
  GuildMember,
  MessageFlags
} from 'discord.js';
import { shuffle } from 'lodash-es';
import config from '@/config';
import { t } from '@/i18n';

const { minPlayers, maxPlayers } = config;

export default {
  data: new SlashCommandBuilder().setDescription(t('commands.start.description')),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.inGuild()) return handleError(interaction, t('errors.not-in-guild'));

    const member = interaction.member as GuildMember;
    const channel = member?.voice?.channel;

    if (!channel || channel.type !== ChannelType.GuildVoice)
      return handleError(interaction, t('errors.no-channel-or-not-voice'));

    if (!interaction.memberPermissions?.has('Administrator') && channel?.id === config.channelId)
      return handleError(interaction, t('errors.no-admin-role'));

    const allUsers = channel.members
      .map(m => m.user)
      .filter(user => !(user.id === interaction.user.id || user.bot));
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
      .setDisabled(
        allUsers.length - excluded.size < minPlayers || allUsers.length - excluded.size > maxPlayers
      );

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
          flags: MessageFlags.Ephemeral
        });
      }

      if (playersCount > maxPlayers) {
        return i.reply({
          content: t('errors.too-many-players', { max: maxPlayers }),
          flags: MessageFlags.Ephemeral
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

async function runShuffleLogic(
  interaction: ChatInputCommandInteraction,
  allUsers: User[],
  excludedUserIds: string[]
) {
  const players = allUsers.filter(user => !excludedUserIds.includes(user.id));

  if (!players.length) return handleError(interaction, t('errors.no-players'));
  if (players.length < minPlayers)
    return handleError(interaction, t('errors.not-enough-players', { min: minPlayers }));

  if (players.length > maxPlayers)
    return handleError(interaction, t('errors.too-many-players', { max: maxPlayers }));

  const roles = getMafiaRolesArray(players.length);

  const playersWithRoles = shuffle(players.map((player, idx) => ({ player, role: roles[idx] })));

  const [dms, nicknameChanges] = await Promise.all([
    Promise.all(playersWithRoles.map(user => dmRole(interaction, user))),
    Promise.all(playersWithRoles.map((user, idx) => changeNickname(interaction, user, idx)))
  ]);

  const failedDms = dms.filter(user => user !== undefined);
  const failedNicknameChanges = nicknameChanges.filter(user => user !== undefined);

  const { message: logMessage, embed: messageToAuthor } =
    generatePrivateLogMessage(playersWithRoles);

  await Promise.all([
    handleDmError(interaction, failedDms, allUsers),
    channelLog(interaction, logMessage),
    interaction.user.send({
      embeds: [messageToAuthor]
    })
  ]);

  const response = generatePublicLogMessage(playersWithRoles, failedDms, failedNicknameChanges);

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
