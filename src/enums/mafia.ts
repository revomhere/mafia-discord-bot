import { t } from '@/i18n';
import { RoleMetadata } from '@/types';

export enum MafiaRole {
  MAFIA = 'mafia_mafia',
  DON = 'mafia_don',
  CITIZEN = 'mafia_citizen',
  COMMISSAR = 'mafia_commissar',
  DOCTOR = 'mafia_doctor',
  MANIAC = 'mafia_maniac'
}

export const mafiaMetadata: Record<MafiaRole, RoleMetadata> = {
  [MafiaRole.MAFIA]: {
    emoji: '🥷🏻',
    name: t('general.roles.mafia'),
    description: t('general.roles.mafia-description'),
    color: 0x1a1a1a // #1A1A1A
  },
  [MafiaRole.DON]: {
    emoji: '👑',
    name: t('general.roles.don'),
    description: t('general.roles.don-description'),
    color: 0xc5a200 // #C5A200
  },
  [MafiaRole.CITIZEN]: {
    emoji: '👤',
    name: t('general.roles.citizen'),
    description: t('general.roles.citizen-description'),
    color: 0xcc3333 // #CC3333
  },
  [MafiaRole.COMMISSAR]: {
    emoji: '👮‍♂️',
    name: t('general.roles.commissar'),
    description: t('general.roles.commissar-description'),
    color: 0x3366cc // #3366CC
  },
  [MafiaRole.DOCTOR]: {
    emoji: '👨‍⚕️',
    name: t('general.roles.doctor'),
    description: t('general.roles.doctor-description'),
    color: 0x2aa198 // #2AA198
  },
  [MafiaRole.MANIAC]: {
    emoji: '🧟‍♂️',
    name: t('general.roles.maniac'),
    description: t('general.roles.maniac-description'),
    color: 0x6a0dad // #6A0DAD
  }
};
