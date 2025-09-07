import { MafiaRole, roleEmojis, roleNames } from '@/enums';
import { GameHistory, PlayerState } from '@/types';
import { Message, EmbedBuilder } from 'discord.js';

export const stopGame = async (
  message: Message,
  gameHistory?: GameHistory,
  gameState?: PlayerState[],
  players?: PlayerState[],
  hostId?: string
) => {
  await message.edit({
    content: `Гра закінчена.${hostId ? ` Ведучий(-ча): <@${hostId}>` : ''}`,
    components: [],
    ...(gameHistory && gameState && players
      ? { embeds: [getGameResult(gameHistory, players, gameState)] }
      : {})
  });
};

export const getGameResult = (
  gameHistory: GameHistory,
  players: PlayerState[],
  gameState: PlayerState[]
) => {
  const lines: string[] = [];

  // --- Результат гри ---
  const totalPlayersAlive = gameState.filter(p => !!p).length;
  const mafiaCount = gameState.filter(
    p => p?.role === MafiaRole.MAFIA || p?.role === MafiaRole.DON
  ).length;
  const isManiac = gameState.some(p => p?.role === MafiaRole.MANIAC);

  let winner = 'Помилка';
  if (totalPlayersAlive <= 1) {
    winner = 'Помилка';
  } else if (isManiac && totalPlayersAlive <= 2) {
    winner = 'Маніяк 🩸';
  } else if (!isManiac && mafiaCount === 0) {
    winner = 'Місто 🏙️';
  } else if (mafiaCount >= totalPlayersAlive / 2) {
    winner = 'Мафія 🥷🏻';
  }

  lines.push(`🏆 **Переможець гри:** ${winner}`);
  lines.push('');

  // --- Ролі ---
  lines.push('🎭 **Ролі гравців**');
  players.forEach((p, idx) => {
    const emoji = roleEmojis[p?.role as MafiaRole] ?? '👤';
    const roleName = roleNames[p?.role as MafiaRole] ?? '—';
    lines.push(`[${idx + 1}]${emoji} ${p?.player?.username} — ${roleName}`);
  });
  lines.push(''); // порожній рядок

  const daysCount = gameHistory.days.length;

  for (let i = 0; i < daysCount; i++) {
    const day = gameHistory.days[i];
    const night = gameHistory.nights[i];

    // --- День ---
    lines.push(`🌞 **День ${i + 1}**`);

    // Номінації
    if (day.nominations && day.nominations.length > 0) {
      for (const vote of day.nominations) {
        const from = players[vote.from];
        const to = players[vote.to];
        lines.push(
          `📣 [${vote.from + 1}] ${from?.player.username ?? '—'} висунув: [${vote.to + 1}] ${
            to?.player.username ?? '—'
          }`
        );
      }
    } else {
      lines.push(`📣 Ніхто не висував`);
    }

    // Голосування
    if (day.voting) {
      if (day.voting.votes && day.voting.votes.length > 0) {
        for (const round of day.voting.votes) {
          for (const vote of round.votes) {
            const from = players[vote.from];
            const to = players[vote.to];
            lines.push(
              `🗳️ [${vote.from + 1}] ${from?.player.username ?? '—'} проголосував за [${
                vote.to + 1
              }] ${to?.player.username ?? '—'}`
            );
          }
        }
      }
      if (day.voting.eliminated && day.voting.eliminated.length > 0) {
        const eliminatedNames = day.voting.eliminated
          .map(idx => `[${idx + 1}] ${players[idx]?.player.username ?? '—'}`)
          .join(', ');
        lines.push(`💀 Вбиті гравці: ${eliminatedNames}`);
      } else {
        lines.push(`💀 Ніхто не був вбитий`);
      }
    } else {
      lines.push(`🗳️ Голосування не проводилося`);
    }

    lines.push(''); // порожній рядок

    // --- Ніч ---
    if (night) {
      lines.push(`🌙 **Ніч ${i + 1}**`);

      if (night.mafiaKill >= 0) {
        const target = players[night.mafiaKill];
        lines.push(`💀 Мафія вбила: [${night.mafiaKill + 1}] ${target?.player.username ?? '—'}`);
      } else {
        lines.push(`💀 Мафія не вбила`);
      }

      if (night.donCheck !== undefined && night.donCheck >= 0) {
        const target = players[night.donCheck];
        lines.push(`🕵️ Дон перевірив: [${night.donCheck + 1}] ${target?.player.username ?? '—'}`);
      }

      if (night.maniacKill !== undefined && night.maniacKill >= 0) {
        const target = players[night.maniacKill];
        lines.push(`🔪 Маніяк вбив: [${night.maniacKill + 1}] ${target?.player.username ?? '—'}`);
      }

      if (night.commissarCheck >= 0) {
        const target = players[night.commissarCheck];
        lines.push(
          `🕵️‍♂️ Комісар перевірив: [${night.commissarCheck + 1}] ${target?.player.username ?? '—'}`
        );
      }

      if (night.doctorHeal !== undefined && night.doctorHeal >= 0) {
        const target = players[night.doctorHeal];
        lines.push(
          `💉 Лікар врятував: [${night.doctorHeal + 1}] ${target?.player.username ?? '—'}`
        );
      }

      lines.push('');
    }
  }

  return {
    title: 'Результати гри',
    description: lines.join('\n')
  };
};

export const isGameFinished = (players: PlayerState[]) => {
  const totalPlayersAlive = players.filter(p => !!p).length;

  const mafiaCount = players.filter(
    p => p?.role === MafiaRole.MAFIA || p?.role === MafiaRole.DON
  ).length;

  const isManiac = players.some(p => p?.role === MafiaRole.MANIAC);

  return (
    totalPlayersAlive <= 1 || // Error (probably?)
    (isManiac && totalPlayersAlive <= 2) || // Maniac wins
    (!isManiac && mafiaCount === 0) || // City wins
    mafiaCount >= totalPlayersAlive / 2 // Mafia wins
  );
};
