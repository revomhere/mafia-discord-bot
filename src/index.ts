import '@/setup';

import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import { getCommands } from '@/helpers';
import { Command } from '@/types';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
}) as Client & {
  commands?: Collection<string, Command>;
};

client.commands = new Collection();
const commandsArr = await getCommands('@/commands');

commandsArr.forEach(command => {
  if (command?.data?.name) {
    client.commands?.set(command.data.name, command);
    console.log(`Command ${command.data.name} loaded successfully.`);
  } else {
    console.warn(`Command is missing data or name: ${JSON.stringify(command)}`);
  }
});

client.once(Events.ClientReady, client => {
  client.user.setActivity('Мафію');

  console.log(`Logged in as ${client.user.tag}!`);
});

client.on(Events.InteractionCreate, interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands?.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    command.execute(interaction);
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);
    interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true
    });
  }
});

client.login(process.env.PRIVATE_TOKEN);
