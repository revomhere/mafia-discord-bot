import '@/setup';

import { REST } from '@discordjs/rest';
import { Routes } from 'discord.js';
import { getCommands } from '@/helpers';
import config from '@/config';

const { appId, guildId } = config;

const rest = new REST({ version: '10' }).setToken(process.env.PRIVATE_TOKEN || '');
const commands = await getCommands('@/commands');

await rest.put(Routes.applicationCommands(appId), { body: [] });

await rest.put(Routes.applicationGuildCommands(appId, guildId), {
  body: commands.map(command => command.data.toJSON())
});

console.log(`Successfully registered ${commands.length} application commands to ${guildId}`);
