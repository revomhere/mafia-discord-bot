import { t } from '@/i18n';

export enum MafiaRole {
  MAFIA,
  DON,
  CITIZEN,
  COMMISSAR,
  DOCTOR,
  MANIAC
}

export const roleEmojis: Record<MafiaRole, string> = {
  [MafiaRole.MAFIA]: '🥷🏻',
  [MafiaRole.DON]: '👑',
  [MafiaRole.CITIZEN]: '👤',
  [MafiaRole.COMMISSAR]: '👮‍♂️',
  [MafiaRole.DOCTOR]: '👨‍⚕️',
  [MafiaRole.MANIAC]: '🧟‍♂️'
};

export const roleNames: Record<MafiaRole, string> = {
  [MafiaRole.MAFIA]: t('general.roles.mafia'),
  [MafiaRole.DON]: t('general.roles.don'),
  [MafiaRole.CITIZEN]: t('general.roles.citizen'),
  [MafiaRole.COMMISSAR]: t('general.roles.commissar'),
  [MafiaRole.DOCTOR]: t('general.roles.doctor'),
  [MafiaRole.MANIAC]: t('general.roles.maniac')
};

export const roleDescriptions: Record<MafiaRole, string> = {
  [MafiaRole.MAFIA]: t('general.roles.mafia-description'),
  [MafiaRole.DON]: t('general.roles.don-description'),
  [MafiaRole.CITIZEN]: t('general.roles.citizen-description'),
  [MafiaRole.COMMISSAR]: t('general.roles.commissar-description'),
  [MafiaRole.DOCTOR]: t('general.roles.doctor-description'),
  [MafiaRole.MANIAC]: t('general.roles.maniac-description')
};

export const roleColors: Record<MafiaRole, number> = {
  [MafiaRole.MAFIA]: 0x1a1a1a, // #1A1A1A
  [MafiaRole.DON]: 0xc5a200, // #C5A200
  [MafiaRole.CITIZEN]: 0xcc3333, // #CC3333
  [MafiaRole.COMMISSAR]: 0x3366cc, // #3366CC
  [MafiaRole.DOCTOR]: 0x2aa198, // #2AA198
  [MafiaRole.MANIAC]: 0x6a0dad // #6A0DAD
};
