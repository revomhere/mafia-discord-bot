import { MafiaRole } from '@/enums';
import { t } from '@/i18n';
import { PlayerState } from '@/types';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  Message,
  MessageFlags
} from 'discord.js';
import { stopGame } from '.';
import config from '@/config';

export const startZeroNight = async (
  hostId: string,
  players: PlayerState[],
  message: Message
): Promise<boolean> => {
  const steps: string[] = [];
  let currentStepIndex = 0;

  const isDoctor = players.some(p => p?.role === MafiaRole.DOCTOR);
  const isDon = players.some(p => p?.role === MafiaRole.DON);
  const isManiac = players.some(p => p?.role === MafiaRole.MANIAC);

  steps.push(
    isDon
      ? t('general.host-assistant.mafia-with-don-group-desc')
      : t('general.host-assistant.mafia-group-desc')
  );

  if (isManiac) steps.push(t('general.host-assistant.maniac-desc'));
  steps.push(t('general.host-assistant.commissar-desc'));
  if (isDoctor) steps.push(t('general.host-assistant.doctor-desc'));
  steps.push(t('general.host-assistant.city-wake-up-desc'));

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
    content: steps[currentStepIndex],
    components: createComponents()
  });

  return new Promise<boolean>(resolve => {
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: config.waitingTime * 1000
    });

    collector.on('collect', async i => {
      if (i.user.id !== hostId) {
        await i.reply({
          content: t('general.host-assistant.buttons-not-for-you'),
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      switch (i.customId) {
        case 'stop_game':
          collector.stop('stopped');
          await i.update({ content: t('general.host-assistant.game-stopped'), components: [] });
          await stopGame(message);
          resolve(false);
          break;

        case 'back':
          if (currentStepIndex > 0) currentStepIndex--;
          await i.update({
            content: steps[currentStepIndex],
            components: createComponents()
          });
          break;

        case 'next':
          if (currentStepIndex < steps.length - 1) {
            currentStepIndex++;
            await i.update({
              content: steps[currentStepIndex],
              components: createComponents()
            });
          } else {
            collector.stop('finished');
            await i.update({ content: t('general.host-assistant.finished'), components: [] });
            resolve(true);
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
        resolve(false);
      }
    });
  });
};
