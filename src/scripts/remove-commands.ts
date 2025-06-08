import '@/setup';

import { config as loadEnv } from 'dotenv';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord.js';
import { getCommands } from '@/helpers';
import config from '@/config';

const { appId } = config;

const rest = new REST({ version: '10' }).setToken(process.env.PRIVATE_TOKEN || '');

const prodEnv = loadEnv({ path: '.env' });
const devEnv = loadEnv({ path: '.env.dev' });

await rest.put(Routes.applicationCommands(appId), { body: [] });
console.log('Removed commands globally');

const prodGuild = prodEnv.parsed?.GUILD_ID || '';
const devGuild = devEnv.parsed?.GUILD_ID || '';

if (prodGuild) {
  await rest.put(Routes.applicationGuildCommands(appId, prodGuild), { body: [] });
  console.log(`Removed commands in ${prodGuild}`);
}

if (devGuild) {
  await rest.put(Routes.applicationGuildCommands(appId, devGuild), { body: [] });
  console.log(`Removed commands in ${devGuild}`);
}
