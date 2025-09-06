// every id is player number in game. example: 1, 2, 3, 4, 5, 6

import { CompleteUser } from './users';

export type PlayerState = CompleteUser | null;

export interface Vote {
  from: number;
  to: number;
}

export interface VotingRound {
  candidates: number[];
  votes: Vote[];
  eliminated?: number[];
}

export interface DayActions {
  nominations?: number[];
  votingRounds?: VotingRound[];
}

export interface NightActions {
  mafiaKill?: number;
  maniacKill?: number;
  donCheck?: number;
  commissarCheck?: number;
  doctorHeal?: number;
}

export interface GameHistory {
  days: DayActions[];
  nights: NightActions[];
}
