import {
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ComponentType,
  ButtonBuilder,
  ButtonStyle,
  Message
} from 'discord.js';
import { t } from '@/i18n';
import {
  CompleteUser,
  DayHistory,
  GameHistory,
  NightActions,
  PlayerState,
  RoleStep
} from '@/types';
import { MafiaRole } from '@/enums';

const askToStartAssistant = async (hostId: string, message: Message): Promise<boolean> => {
  await message.edit({
    content: t('general.host-assistant.start-question'),
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('cancel-assistant')
          .setLabel(t('general.host-assistant.cancel-btn'))
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('start-assistant')
          .setLabel(t('general.host-assistant.start-btn'))
          .setStyle(ButtonStyle.Success)
      )
    ]
  });

  return new Promise(resolve => {
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 2 * 60 * 1000
    });

    collector.on('collect', async i => {
      if (i.user.id !== hostId) {
        return i.reply({
          content: t('general.host-assistant.buttons-not-for-you'),
          ephemeral: true
        });
      }

      collector.stop(i.customId);

      await i.deferUpdate();

      resolve(i.customId === 'start-assistant');
    });

    collector.on('end', async (_, reason) => {
      if (reason !== 'start-assistant' && reason !== 'cancel-assistant') {
        await message
          .edit({ content: t('general.host-assistant.timeout'), components: [] })
          .catch(() => {});
        resolve(false);
      }
    });
  });
};

const stopGame = async (message: Message) => {
  await message.edit({
    content: 'Гра закінчена.',
    components: []
  });
};

const startZeroNight = async (
  hostId: string,
  players: CompleteUser[],
  message: Message
): Promise<void> => {
  const steps: RoleStep[] = [];

  const findPlayerNumber = (role: MafiaRole): number | null => {
    const idx = players.findIndex(p => p.role === role);
    return idx >= 0 ? idx + 1 : null;
  };

  const isMafia = players.some(p => p.role === MafiaRole.MAFIA);
  const isDon = players.some(p => p.role === MafiaRole.DON);
  const isManiac = players.some(p => p.role === MafiaRole.MANIAC);
  const isComissar = players.some(p => p.role === MafiaRole.COMMISSAR);
  const isDoctor = players.some(p => p.role === MafiaRole.DOCTOR);

  if (isMafia) {
    steps.push({
      roleName: t('general.host-assistant.mafia-group-title'),
      description: t('general.host-assistant.mafia-group-desc')
    });
  }

  if (isManiac) {
    steps.push({
      roleName: t('general.host-assistant.maniac-title'),
      description: t('general.host-assistant.maniac-desc')
    });
  }

  if (isComissar) {
    steps.push({
      roleName: t('general.host-assistant.commissar-title'),
      description: t('general.host-assistant.commissar-desc')
    });
  }

  if (isDoctor) {
    steps.push({
      roleName: t('general.host-assistant.doctor-title'),
      description: t('general.host-assistant.doctor-desc')
    });
  }

  if (steps.length === 0) {
    await message.edit({
      content: t('general.host-assistant.no-roles'),
      components: []
    });
    return;
  }

  let currentStepIndex = 0;

  const createComponents = () => [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('stop_game')
        .setLabel(t('general.host-assistant.btn-stop'))
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('back')
        .setLabel(t('general.host-assistant.btn-back'))
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentStepIndex === 0),
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel(t('general.host-assistant.btn-next'))
        .setStyle(ButtonStyle.Success)
        .setDisabled(false)
    )
  ];

  await message.edit({
    content: steps[currentStepIndex].description,
    components: createComponents()
  });

  return new Promise<void>(resolve => {
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 5 * 60 * 1000
    });

    collector.on('collect', async i => {
      if (i.user.id !== hostId) {
        await i.reply({
          content: t('general.host-assistant.buttons-not-for-you'),
          ephemeral: true
        });
        return;
      }

      switch (i.customId) {
        case 'stop_game':
          collector.stop('stopped');
          await i.update({ content: t('general.host-assistant.game-stopped'), components: [] });
          await stopGame(message);
          resolve();
          break;

        case 'back':
          if (currentStepIndex > 0) currentStepIndex--;
          await i.update({
            content: steps[currentStepIndex].description,
            components: createComponents()
          });
          break;

        case 'next':
          if (currentStepIndex < steps.length - 1) {
            currentStepIndex++;
            await i.update({
              content: steps[currentStepIndex].description,
              components: createComponents()
            });
          } else {
            collector.stop('finished');
            await i.update({ content: t('general.host-assistant.finished'), components: [] });
            resolve();
          }
          break;
      }
    });

    collector.on('end', async (_, reason) => {
      if (reason !== 'finished' && reason !== 'stopped') {
        await message.edit({
          content: t('general.host-assistant.timeout'),
          components: []
        });
        resolve();
      }
    });
  });
};

export const startAssistant = async (
  players: CompleteUser[],
  interaction: ChatInputCommandInteraction,
  hostId: string
) => {
  const message = await interaction.followUp({ content: '⏳', fetchReply: true });

  const isAssistantNeeded = await askToStartAssistant(hostId, message);
  if (!isAssistantNeeded) return;

  const playerState: PlayerState[] = players.map(player => ({
    player,
    alive: true
  }));

  const gameHistory: GameHistory = {
    days: [],
    nights: []
  };

  await startZeroNight(hostId, players, message);
};
