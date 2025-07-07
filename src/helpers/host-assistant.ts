import { ButtonBuilder, ButtonStyle, ActionRowBuilder, Message, ComponentType } from 'discord.js';
import { t } from '@/i18n';

export const createHostAssistantReply = () => {
  return {
    content: t('general.host-assistant.start-question'),
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('cancel-assistant')
          .setLabel(t('general.host-assistant.cancel-btn'))
          .setStyle(ButtonStyle.Danger)
          .setDisabled(false),

        new ButtonBuilder()
          .setCustomId('start-assistant')
          .setLabel(t('general.host-assistant.start-btn'))
          .setStyle(ButtonStyle.Success)
          .setDisabled(false)
      )
    ]
  };
};

export const addHostController = (message: Message<boolean>, userId: string) => {
  const hostCollector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 2 * 60 * 1000 // 2 min
  });

  hostCollector.on('collect', async buttonInteraction => {
    if (buttonInteraction.user.id !== userId) {
      return buttonInteraction.reply({
        content: t('commands.start.choose.buttons-not-for-you'),
        ephemeral: true
      });
    }

    if (buttonInteraction.customId === 'cancel-assistant') {
      hostCollector.stop('cancelled');

      await buttonInteraction.update({
        content: t('general.host-assistant.cancelled'),
        components: []
      });

      return;
    }

    if (buttonInteraction.customId === 'start-assistant') {
      hostCollector.stop('started');

      await buttonInteraction.update({
        content: t('general.host-assistant.starting'),
        components: []
      });

      await startAssistant(message);
    }
  });
};

export const startAssistant = (_message: Message<boolean>) => {
  console.log('Start assistant...');
};
