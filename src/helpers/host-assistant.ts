import {
  ActionRowBuilder,
  TextBasedChannel,
  ComponentType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  MessageFlags
} from 'discord.js';
import { t } from '@/i18n';
import { CompleteUser } from '@/types';

export const askToStartAssistant = async (
  interaction: ChatInputCommandInteraction,
  hostId: string
): Promise<boolean> => {
  const message = await interaction.followUp({
    content: t('general.host-assistant.start-question'),
    flags: MessageFlags.Ephemeral,
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
          content: t('commands.start.choose.buttons-not-for-you'),
          ephemeral: true
        });
      }

      collector.stop(i.customId);

      await i.deleteReply().catch(() => {});

      resolve(i.customId === 'start-assistant');
    });

    collector.on('end', async (_, reason) => {
      if (reason !== 'start-assistant' && reason !== 'cancel-assistant') {
        await message.delete().catch(() => {});
        resolve(false);
      }
    });
  });
};

export const startAssistant = async (
  players: CompleteUser[],
  interaction: ChatInputCommandInteraction,
  hostId: string
) => {
  const isAssistentNeeded = await askToStartAssistant(interaction, hostId);

  if (!isAssistentNeeded) return;

  console.log('start assistant');
};
