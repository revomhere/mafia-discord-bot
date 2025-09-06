import { MafiaRole } from '@/enums';
import { GameHistory, PlayerState } from '@/types';
import { Message } from 'discord.js';

export const stopGame = async (
  message: Message,
  gameHistory?: GameHistory,
  gameState?: PlayerState[],
  hostId?: string
) => {
  await message.edit({
    content: 'Гра закінчена.',
    components: []
  });
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
    mafiaCount <= totalPlayersAlive / 2 // Mafia wins
  );
};
