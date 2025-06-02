import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { handleError } from '@/helpers';
// import {
//   addUsers,
//   excludeMafiaMembers,
//   getShuffledRoles,
//   privateLog,
//   publicLog,
//   assignNumbers,
//   dmRoles
// } from '@/helpers';

const COUNT_OF_EXCLUDED_USERS = 20; // Number of users to exclude from shuffling

export default {
  data: new SlashCommandBuilder()
    .setDescription(
      'Перемішує гравців в Мафію. Для виключення гравців з перемішування використовуйте параметри команди.'
    )
    .addUsers(COUNT_OF_EXCLUDED_USERS),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has('Administrator'))
      return handleError(
        interaction,
        'Ви не маєте прав адміністратора для виконання цієї команди.'
      );

    const channel = interaction.channel;

    return handleError(
      interaction,
      'Ця команда тимчасово недоступна. Будь ласка, спробуйте пізніше.'
    );
  }
};
