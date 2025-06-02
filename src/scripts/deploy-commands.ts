import '@/setup';

import { REST } from '@discordjs/rest';
import { Routes } from 'discord.js';
import { getCommands } from '@/helpers';

const rest = new REST({ version: '10' }).setToken(process.env.PRIVATE_TOKEN || '');
const commands = await getCommands('@/commands');

const appId = process.env.APP_ID || '';
const guildId = process.env.GUILD_ID || '';

await rest.put(Routes.applicationCommands(appId), { body: [] });

await rest.put(Routes.applicationGuildCommands(appId, guildId), {
  body: commands.map(command => command.data.toJSON())
});

console.log(`Successfully registered ${commands.length} application commands.`);
