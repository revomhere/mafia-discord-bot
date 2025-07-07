// every id is player number in game. example: 1, 2, 3, 4, 5, 6

export interface PlayerState {
  player: CompleteUser;
  alive: boolean;
}

export interface Vote {
  from: number;
  to: number;
}

export interface VotingRound {
  candidates: number[];
  votes: Vote[];
  eliminated?: number[];
}

export interface DayHistory {
  nominations: number[];
  votingRounds: VotingRound[];
}

export interface NightActions {
  mafiaKill?: number;
  maniacKill?: number;
  donCheck?: number;
  commissarCheck?: number;
  doctorHeal?: number;
}

export interface GameHistory {
  days: DayHistory[];
  nights: NightActions[];
}

export type RoleStep = {
  roleName: string;
  description: string;
};
