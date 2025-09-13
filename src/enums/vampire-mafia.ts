import { t } from '@/i18n';
import { RoleMetadata } from '@/types';

export enum VampireMafiaRole {
  DRACULA = 'vampire-mafia_dracula',
  VAN_HELSING = 'vampire-mafia_van-helsing',
  TOM_SAWYER = 'vampire-mafia_tom-sawyer',
  PHOENIX = 'vampire-mafia_phoenix',
  GOLEM = 'vampire-mafia_golem',
  GHOST = 'vampire-mafia_ghost',
  INVISIBLE = 'vampire-mafia_invisible',
  WITCH = 'vampire-mafia_witch',
  CITIZEN = 'vampire-mafia_citizen'
}

export const vampireMafiaMetadata: Record<VampireMafiaRole, RoleMetadata> = {
  [VampireMafiaRole.DRACULA]: {
    emoji: '🧛‍♂️',
    name: t('general.vampire.roles.dracula'),
    description: t('general.vampire.roles.dracula-description'),
    color: 0x4b0082 // #4B0082
  },
  [VampireMafiaRole.VAN_HELSING]: {
    emoji: '🗡️',
    name: t('general.vampire.roles.vanHelsing'),
    description: t('general.vampire.roles.vanHelsing-description'),
    color: 0x8b0000 // #8B0000
  },
  [VampireMafiaRole.TOM_SAWYER]: {
    emoji: '👦',
    name: t('general.vampire.roles.tomSawyer'),
    description: t('general.vampire.roles.tomSawyer-description'),
    color: 0x00bfff // #00BFFF
  },
  [VampireMafiaRole.PHOENIX]: {
    emoji: '🔥',
    name: t('general.vampire.roles.phoenix'),
    description: t('general.vampire.roles.phoenix-description'),
    color: 0xff4500 // #FF4500
  },
  [VampireMafiaRole.GOLEM]: {
    emoji: '🗿',
    name: t('general.vampire.roles.golem'),
    description: t('general.vampire.roles.golem-description'),
    color: 0x808080 // #808080
  },
  [VampireMafiaRole.GHOST]: {
    emoji: '👻',
    name: t('general.vampire.roles.ghost'),
    description: t('general.vampire.roles.ghost-description'),
    color: 0xcccccc // #CCCCCC
  },
  [VampireMafiaRole.INVISIBLE]: {
    emoji: '🫥',
    name: t('general.vampire.roles.invisible'),
    description: t('general.vampire.roles.invisible-description'),
    color: 0x99ccff // #99CCFF
  },
  [VampireMafiaRole.WITCH]: {
    emoji: '🧙‍♀️',
    name: t('general.vampire.roles.witch'),
    description: t('general.vampire.roles.witch-description'),
    color: 0x228b22 // #228B22
  },
  [VampireMafiaRole.CITIZEN]: {
    emoji: '👤',
    name: t('general.vampire.roles.citizen'),
    description: t('general.vampire.roles.citizen-description'),
    color: 0xcc3333 // #CC3333
  }
};
