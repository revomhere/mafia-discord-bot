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
  [MafiaRole.MAFIA]: 0x000000, // #000000
  [MafiaRole.DON]: 0xffd700, // #FFD700
  [MafiaRole.CITIZEN]: 0xff0000, // #FF0000
  [MafiaRole.COMMISSAR]: 0x0000ff, // #0000FF
  [MafiaRole.DOCTOR]: 0x00ffff, // #00FFFF
  [MafiaRole.MANIAC]: 0x800080 // #800080
};
