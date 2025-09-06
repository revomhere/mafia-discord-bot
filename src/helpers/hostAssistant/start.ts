import { t } from '@/i18n';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Message } from 'discord.js';

export const askToStartAssistant = async (hostId: string, message: Message): Promise<boolean> => {
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
