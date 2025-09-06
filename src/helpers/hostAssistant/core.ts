import { CompleteUser, GameHistory, PlayerState } from '@/types';
import { ChatInputCommandInteraction } from 'discord.js';
import {
  askToStartAssistant,
  isGameFinished,
  startZeroNight,
  // startNight,
  startDay,
  stopGame
} from '.';

export const runAssistant = async (
  players: CompleteUser[],
  interaction: ChatInputCommandInteraction,
  hostId: string
) => {
  const message = await interaction.followUp({ content: '⏳', fetchReply: true });

  const isAssistantNeeded = await askToStartAssistant(hostId, message);
  if (!isAssistantNeeded) {
    await message.delete();
    return;
  }

  /* START OF ASSISTANT */

  const gameState: PlayerState[] = [...players];

  const gameHistory: GameHistory = {
    days: [],
    nights: []
  };

  let currentFirstSpeaker = 0;

  // await startZeroNight(hostId, gameState, message);

  while (true) {
    const dayResult = await startDay(
      hostId,
      gameState,
      message,
      currentFirstSpeaker,
      gameHistory.days.length === 0
    );
    gameHistory.days.push(dayResult);

    if (isGameFinished(players)) break;

    // await startNight(hostId, gameState, gameHistory, message);

    if (isGameFinished(players)) break;
  }

  stopGame(message, gameHistory, gameState, hostId);
};
