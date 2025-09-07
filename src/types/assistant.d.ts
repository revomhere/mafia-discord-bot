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
}

export interface DayActions {
  nominations?: Vote[];
  voting?: {
    eliminated?: number[];
    votes?: VotingRound[];
  };
}

export interface NightActions {
  mafiaKill: number;
  commissarCheck: number;
  maniacKill?: number;
  donCheck?: number;
  doctorHeal?: number;
}

export interface GameHistory {
  days: DayActions[];
  nights: NightActions[];
}
