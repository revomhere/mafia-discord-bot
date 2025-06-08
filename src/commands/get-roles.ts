import { MafiaRole, roleNames, roleEmojis } from '@/enums';
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder
} from 'discord.js';
import { getMafiaRolesArray } from '@/helpers';
import { t } from '@/i18n';
import config from '@/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const fileName = path.parse(__filename).name;

const { minPlayers, maxPlayers } = config;

const countRoles = (roles: MafiaRole[]) => {
  const counts: Partial<Record<MafiaRole, number>> = {};
  for (const role of roles) {
    counts[role] = (counts[role] || 0) + 1;
  }
  return counts;
};

export default {
  data: new SlashCommandBuilder()
    .setDescription(
      t('commands.get-roles.description', {
        interpolation: { escapeValue: false },
        command: `/${fileName}`
      })
    )
    .addNumberOption(option =>
      option
        .setName('players')
        .setDescription(
          t('commands.get-roles.players-description', {
            min: minPlayers,
            max: maxPlayers
          })
        )
        .setMinValue(minPlayers)
        .setMaxValue(maxPlayers)
        .setRequired(true)
    ),

  execute(interaction: ChatInputCommandInteraction) {
    const players = interaction.options.getNumber('players', true);

    const roles = getMafiaRolesArray(players);
    const counts = countRoles(roles);

    const output = Object.entries(counts)
      .map(([roleKey, count]) => {
        const role = Number(roleKey) as MafiaRole;
        return `${roleEmojis[role]} ${count} ${roleNames[role]}`;
      })
      .join('\n');

    const response = new EmbedBuilder()
      .setTitle(
        t('commands.get-roles.response.title', {
          players
        })
      )
      .setDescription(
        t('commands.get-roles.response.description', {
          roles: output
        })
      )
      .setColor('#0099ff'); // #0099ff

    return interaction.reply({
      embeds: [response],
      flags: MessageFlags.Ephemeral
    });
  }
};
