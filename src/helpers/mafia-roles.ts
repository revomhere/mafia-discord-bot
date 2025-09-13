import { MafiaRole, VampireMafiaRole } from '@/enums';
import { shuffle } from 'lodash-es';

export const getMafiaRolesArray = (countOfPlayers: number): MafiaRole[] => {
  const roles: MafiaRole[] = [];

  let mafiaCount = Math.round(countOfPlayers / 4);

  if (countOfPlayers >= 9) {
    roles.push(MafiaRole.DON);
    mafiaCount -= 1;
  }

  roles.push(...Array(mafiaCount).fill(MafiaRole.MAFIA));

  roles.push(MafiaRole.COMMISSAR);

  if (countOfPlayers >= 5) roles.push(MafiaRole.DOCTOR);
  if (countOfPlayers >= 12) roles.push(MafiaRole.MANIAC);

  roles.push(...Array(countOfPlayers - roles.length).fill(MafiaRole.CITIZEN));

  return shuffle(shuffle(roles));
};

export const getVampireRolesArray = (countOfPlayers: number): VampireMafiaRole[] => {
  const specialRoles: VampireMafiaRole[] = [
    VampireMafiaRole.DRACULA,
    VampireMafiaRole.VAN_HELSING,
    VampireMafiaRole.TOM_SAWYER,
    VampireMafiaRole.PHOENIX,
    VampireMafiaRole.GOLEM,
    VampireMafiaRole.GHOST,
    VampireMafiaRole.INVISIBLE,
    VampireMafiaRole.WITCH
  ];

  const roles: VampireMafiaRole[] = specialRoles.slice(
    0,
    Math.min(countOfPlayers, specialRoles.length)
  );

  if (roles.length < countOfPlayers) {
    roles.push(...Array(countOfPlayers - roles.length).fill(VampireMafiaRole.CITIZEN));
  }

  return shuffle(shuffle(roles));
};
