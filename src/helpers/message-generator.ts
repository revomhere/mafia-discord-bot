import { MafiaRole, roleColors, roleDescriptions, roleEmojis, roleNames } from '@/enums';
import { EmbedBuilder, User } from 'discord.js';
import { t } from '@/i18n';
import { CompleteUser } from '@/types';
import { getNicknameNumber } from './';

export const generateDmMessage = (role: MafiaRole, author: string) => {
  return new EmbedBuilder()
    .setTitle(
      t('commands.start.dm.title', {
        emoji: roleEmojis[role],
        role: roleNames[role]
      })
    )
    .setDescription(roleDescriptions[role])
    .setColor(roleColors[role])
    .setFooter({
      text: t('commands.start.dm.footer', {
        time: new Date().toLocaleTimeString('uk-UA', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        user: author
      })
    });
};

export const generatePrivateLogMessage = (playersWithRoles: CompleteUser[]) => {
  const message = playersWithRoles
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

  const embed = new EmbedBuilder()
    .setTitle(t('commands.start.author.title'))
    .setColor(0x2ecc71)
    .setDescription(message);

  return { message, embed };
};

export const generatePublicLogMessage = (
  playersWithRoles: CompleteUser[],
  failedDms: {
    user: User;
    embedMessage: EmbedBuilder;
  }[],
  failedNicknameChanges: User[]
) => {
  const message =
    t('commands.start.result.description') +
    failedDms.map(user => '\n' + t('commands.start.result.failed-dm', { user: user?.user?.username })) +
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

  const embed = new EmbedBuilder()
    .setTitle(t('commands.start.result.title'))
    .setColor(0x2ecc71)
    .setDescription(message);

  return embed;
};
