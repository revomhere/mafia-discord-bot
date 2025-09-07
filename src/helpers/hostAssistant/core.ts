import { CompleteUser, GameHistory, PlayerState } from '@/types';
import { ChatInputCommandInteraction } from 'discord.js';
import {
  askToStartAssistant,
  isGameFinished,
  startZeroNight,
  startNight,
  startDay,
  stopGame
} from '.';
import { MafiaRole } from '@/enums';

export const runAssistant = async (
  players: CompleteUser[],
  interaction: ChatInputCommandInteraction,
  hostId: string
) => {
  // TODO: remove when assistant is ready
  const isMocked = process.env.NODE_ENV === 'development';
  if (!isMocked) return;

  const message = await interaction.followUp({ content: '⏳', fetchReply: true });

  const isAssistantNeeded = await askToStartAssistant(hostId, message);
  if (!isAssistantNeeded) {
    await message.delete();
    return;
  }

  /* START OF ASSISTANT */

  let gameState: PlayerState[] = [...players];

  const gameHistory: GameHistory = {
    days: [],
    nights: []
  };

  let currentFirstSpeaker = -1;

  // const isContinue = await startZeroNight(hostId, gameState, message);
  // if (!isContinue) return;

  while (true) {
    currentFirstSpeaker = setCurrentSpeaker(currentFirstSpeaker, gameState);

    const dayResult = await startDay(
      hostId,
      gameState,
      message,
      currentFirstSpeaker,
      gameHistory.days.length === 0
    );
    gameHistory.days.push(dayResult);

    if (dayResult.voting?.eliminated?.length) {
      gameState = gameState.map((player, idx) =>
        dayResult.voting!.eliminated!.includes!(idx) ? null : player
      );
    }

    if (isGameFinished(gameState)) break;

    const nigthOpts = {
      isDoctor: players.some(p => p.role === MafiaRole.DOCTOR),
      isManiac: players.some(p => p.role === MafiaRole.MANIAC),
      isDon: players.some(p => p.role === MafiaRole.DON)
    };

    const lastHeal = gameHistory.nights?.[gameHistory.nights.length - 1]?.doctorHeal;

    const nightActions = await startNight(hostId, gameState, message, nigthOpts, lastHeal);
    gameHistory.nights.push(nightActions);

    const killed = [nightActions.mafiaKill, nightActions.maniacKill].filter(
      kill => typeof kill === 'number' && nightActions.doctorHeal !== kill
    );

    gameState = gameState.map((player, idx) => (killed.includes(idx) ? null : player));

    if (isGameFinished(gameState)) break;
  }

  stopGame(message, gameHistory, gameState, players, hostId);
};

const setCurrentSpeaker = (lastSpeaker: number, gameState: PlayerState[]): number => {
  if (gameState.length === 0) return -1;

  let nextIdx = lastSpeaker;

  for (let i = 0; i < gameState.length; i++) {
    nextIdx = (nextIdx + 1) % gameState.length;
    if (!!gameState[nextIdx]) {
      return nextIdx;
    }
  }

  return -1;
};
