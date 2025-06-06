import { MafiaRole, roleNames, roleEmojis } from '@/enums';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getMafiaRolesArray } from '@/helpers';

export default {
  data: new SlashCommandBuilder().setDescription('Get the list of available roles in the game'),

  async execute(interaction: ChatInputCommandInteraction) {}
};

const countRoles = (roles: MafiaRole[]) => {
  const counts: Partial<Record<MafiaRole, number>> = {};
  for (const role of roles) {
    counts[role] = (counts[role] || 0) + 1;
  }
  return counts;
};

for (let players = 4; players <= 20; players++) {
  const roles = getMafiaRolesArray(players);
  const counts = countRoles(roles);

  const output = Object.entries(counts)
    .map(([roleKey, count]) => {
      const role = Number(roleKey) as MafiaRole;
      return `${count} ${roleNames[role]}`;
    })
    .join(', ');

  console.log(`${players} гравців: ${output}`);
}
