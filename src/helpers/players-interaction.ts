import { roleEmojis, roleNames, roleDescriptions, roleColors } from '@/enums';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getNicknameNumber } from './';
import { CompleteUser } from '@/types';
import { t } from '@/i18n';

// returns user if failed to send DM
export const dmRole = async (interaction: ChatInputCommandInteraction, user: CompleteUser) => {
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
export const changeNickname = async (interaction: ChatInputCommandInteraction, user: CompleteUser, number: number) => {
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
