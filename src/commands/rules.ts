import { t } from '@/i18n';
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder
} from 'discord.js';
import { MafiaRole, roleEmojis, roleNames } from '@/enums';

export default {
  data: new SlashCommandBuilder().setDescription(t('commands.rules.description')),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder().setTitle(t('general.mafia_rules.title')).setColor(0x9b59b6); // #9b59b6

    // 🎲 Ролі
    const rolesTitle = t('general.mafia_rules.roles.title');

    const rolesDescription = Object.values(MafiaRole)
      .filter(v => typeof v === 'number') // залишаємо лише enum-числа
      .map(roleId => {
        const roleName = roleNames[roleId];
        const emoji = roleEmojis[roleId] || '❓';
        const roleKey = MafiaRole[roleId].toLowerCase(); // отримуємо рядковий ключ типу "mafia"
        return t(`general.mafia_rules.roles.${roleKey}`, { emoji });
      })
      .join('\n');

    embed.addFields({ name: rolesTitle, value: rolesDescription });

    // 📹 Камери
    const camerasTitle = t('general.mafia_rules.cameras.title');
    const camerasRules = t('general.mafia_rules.cameras.rules', {
      returnObjects: true
    }) as string[];

    embed.addFields({
      name: camerasTitle,
      value: camerasRules.map(rule => `• ${rule}`).join('\n')
    });

    // 🕊 Нульове коло
    const zeroTitle = t('general.mafia_rules.zero_round.title');
    const zeroRules = t('general.mafia_rules.zero_round.rules', {
      returnObjects: true
    }) as string[];

    embed.addFields({
      name: zeroTitle,
      value: zeroRules.map(rule => `• ${rule}`).join('\n')
    });

    // 🔄 Хід гри
    const flowTitle = t('general.mafia_rules.game_flow.title');

    const night = t('general.mafia_rules.game_flow.night', {
      returnObjects: true
    }) as string[];

    const day = t('general.mafia_rules.game_flow.day', {
      returnObjects: true
    }) as string[];

    embed.addFields({
      name: flowTitle,
      value:
        `🌙 **Ніч:** \n${night.map(rule => `• ${rule}`).join('\n')}\n` +
        `🌞 **День:**\n${day.map(rule => `• ${rule}`).join('\n')}`
    });

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
};
