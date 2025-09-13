import '@/setup';

import { Client, Collection, Events, GatewayIntentBits, MessageFlags } from 'discord.js';
import { getCommands } from '@/helpers';
import { Command } from '@/types';
import config from '@/config';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
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

  if (command?.data.name === 'rules') {
    interaction.reply({
      content: 'Ця команда тимчасово заборонена'
    });

    return;
  }

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    command.execute(interaction);
    console.log(
      `${new Date()}: User ${interaction.user.username} (${interaction.user.id}) executed ${
        interaction.commandName
      } command`
    );
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);

    if (!interaction.replied && !interaction.deferred) {
      interaction.reply({
        content: 'There was an error while executing this command!',
        flags: MessageFlags.Ephemeral
      });
    }

    interaction.editReply({
      content: 'An error occurred while executing the command. Please try again later.'
    });

    return;
  }
});

client.login(config.privateToken);
