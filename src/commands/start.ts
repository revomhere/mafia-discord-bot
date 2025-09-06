import {
  generatePrivateLogMessage,
  generatePublicLogMessage,
  getMafiaRolesArray,
  changeNickname,
  runAssistant,
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
  MessageFlags,
  ButtonInteraction,
  InteractionCollector,
  Collection
} from 'discord.js';
import { shuffle } from 'lodash-es';
import config from '@/config';
import { t } from '@/i18n';

const { minPlayers, maxPlayers } = config;
const isMocked = process.env.NODE_ENV === 'development';

export default {
  data: new SlashCommandBuilder().setDescription(t('commands.start.description')),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.inGuild()) return handleError(interaction, t('errors.not-in-guild'));

    if (isMocked) {
      const guild = interaction.guild;
      if (!guild) return;

      const mockedUserIds = [
        '664895051423285279',
        '372383774937186315',
        '573808316682076170',
        '519070576330014720',
        // '378499998267998213',
        // '402466367321800704',
        // '380728593485135874',
        // '400612111161753601',
        '573809642203774976'
        // '437152386755198977',
        // '1376169425782182021',
      ];

      const users = await Promise.all(
        mockedUserIds.map(async id => {
          const member = await guild.members.fetch(id);
          return member?.user;
        })
      );

      await startPreparingFlow(interaction, users);

      return;
    }

    const member = interaction.member as GuildMember;
    const channel = member?.voice?.channel;

    if (!channel || channel.type !== ChannelType.GuildVoice)
      return handleError(interaction, t('errors.no-channel-or-not-voice'));

    const allUsers = channel.members
      .map(m => m.user)
      .filter(user => !(user.id === interaction.user.id || user.bot));
    if (!allUsers.length) return handleError(interaction, t('errors.cant-get-users'));

    await startPreparingFlow(interaction, allUsers);
  }
};

function createPreparingButtons(allUsers: User[], excluded: Set<string>) {
  const userButtons = allUsers.map(user => {
    const isExcluded = excluded.has(user.id);
    return new ButtonBuilder()
      .setCustomId(`exclude_${user.id}`)
      .setLabel(user.username)
      .setStyle(isExcluded ? ButtonStyle.Danger : ButtonStyle.Secondary);
  });

  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < userButtons.length; i += config.countOfPlayersInRow) {
    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        userButtons.slice(i, i + config.countOfPlayersInRow)
      )
    );
  }

  const cancelButton = new ButtonBuilder()
    .setCustomId('cancel_game')
    .setLabel(t('commands.start.choose.cancel-btn'))
    .setStyle(ButtonStyle.Danger);

  const startButton = new ButtonBuilder()
    .setCustomId('start_game')
    .setLabel(t('commands.start.choose.start-btn'))
    .setStyle(ButtonStyle.Success)
    .setDisabled(
      allUsers.length - excluded.size < minPlayers || allUsers.length - excluded.size > maxPlayers
    );

  rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(cancelButton, startButton));
  return rows;
}

function showInitialPreparingUI(
  interaction: ChatInputCommandInteraction,
  allUsers: User[],
  excluded: Set<string>
) {
  return interaction.editReply({
    content: t('commands.start.choose.description', {
      button: t('commands.start.choose.start-btn')
    }),
    components: createPreparingButtons(allUsers, excluded)
  });
}

function createPreparingCollector(message: any, userId: string) {
  return message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 5 * 60 * 1000,
    filter: (i: ButtonInteraction) => i.user.id === userId
  });
}

async function handlePreparingInteraction(
  i: any,
  {
    interaction,
    allUsers,
    excluded,
    collector
  }: {
    interaction: ChatInputCommandInteraction;
    allUsers: User[];
    excluded: Set<string>;
    collector: InteractionCollector<ButtonInteraction>;
  }
) {
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
    components: createPreparingButtons(allUsers, excluded)
  });
}

async function startPreparingFlow(interaction: ChatInputCommandInteraction, allUsers: User[]) {
  const excluded = new Set<string>();

  const message = await showInitialPreparingUI(interaction, allUsers, excluded);
  const collector = createPreparingCollector(message, interaction.user.id);

  collector.on('collect', async (i: ButtonInteraction) => {
    await handlePreparingInteraction(i, {
      interaction,
      allUsers,
      excluded,
      collector
    });
  });

  collector.on('end', async (_: Collection<string, ButtonInteraction>, reason: string) => {
    if (reason === 'started' || reason === 'cancelled') return;

    await interaction.editReply({
      content: t('commands.start.choose.time-is-gone'),
      components: []
    });
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

      await runAssistant(playersWithRoles, interaction, interaction.user.id);
    } catch (e) {
      console.error('Error sending game start message:', e);
    }

    return;
  }

  await interaction.editReply({
    embeds: [response]
  });

  await runAssistant(playersWithRoles, interaction, interaction.user.id);
}
