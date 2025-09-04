import { MafiaRole } from '@/enums';
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
