import '@/setup';

import { REST } from '@discordjs/rest';
import { Routes } from 'discord.js';
import { getCommands } from '@/helpers';
import config from '@/config';

const { appId, guildId, nodeEnv } = config;

const rest = new REST({ version: '10' }).setToken(process.env.PRIVATE_TOKEN || '');
const commands = await getCommands('@/commands');

if (nodeEnv === 'development') {
  await rest.put(Routes.applicationGuildCommands(appId, guildId), {
    body: commands.map(command => command.data.toJSON())
  });

  console.log(`Successfully registered ${commands.length} application commands in ${guildId}`);
} else {
  // await rest.put(Routes.applicationCommands(appId), {
  // body: commands.map(command => command.data.toJSON())
  // });
  await rest.put(Routes.applicationGuildCommands(appId, guildId), {
    body: commands.map(command => command.data.toJSON())
  });

  console.log(`Successfully registered ${commands.length} application commands globally`);
}
