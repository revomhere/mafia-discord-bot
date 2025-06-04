import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  PermissionsBitField,
  User
} from 'discord.js';
import { generateDmMessage, getNicknameNumber } from './';
import { CompleteUser } from '@/types';
import { t } from '@/i18n';

// returns user if failed to send DM
export const dmRole = async (interaction: ChatInputCommandInteraction, user: CompleteUser) => {
  const embed = generateDmMessage(user.role, interaction.user.username);

  try {
    await user.player.send({
      embeds: [embed]
    });
  } catch (e) {
    console.error(`Failed to send DM to ${user.player.username}: `, e);

    return {
      user: user.player,
      embedMessage: embed
    };
  }
};

// returns user if failed to change nickname
export const changeNickname = async (interaction: ChatInputCommandInteraction, user: CompleteUser, number: number) => {
  const newNickname = getNicknameNumber(number + 1);
  const member = interaction.guild?.members.cache.get(user.player.id);

  if (!member) {
    console.error(`Member not found for user ${user.player.username}`);
    return user.player;
  }

  try {
    await member.setNickname(newNickname, t('commands.start.change-nickname'));
  } catch (e) {
    return user.player;
  }
};

export const handleDmError = async (
  interaction: ChatInputCommandInteraction,
  failedDms: {
    user: User;
    embedMessage: EmbedBuilder;
  }[]
) => {
  if (failedDms.length === 0) return;

  await Promise.all(
    failedDms.map(async dm => {
      if (!dm) return;

      const channel = await interaction.guild?.channels.create({
        name: `role-${dm.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: dm.user.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory]
          }
        ]
      });

      if (!channel) return;

      const confirmButton = new ButtonBuilder()
        .setCustomId(`confirm_got_role_${dm.user.id}`)
        .setLabel(t('commands.start.dm.got-role'))
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton);

      const message = await channel.send({
        content: `<@${dm.user.id}>`,
        embeds: [dm.embedMessage],
        components: [row],
        allowedMentions: { users: [dm.user.id], roles: [] }
      });

      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 3 * 60 * 1000, // 3 min
        filter: (i: ButtonInteraction) => i.user.id === dm.user.id
      });

      let acknowledged = false;

      collector.on('collect', async i => {
        acknowledged = true;
        await i.deferUpdate();
        await channel.delete().catch(() => {});
      });

      collector.on('end', async () => {
        if (!acknowledged) {
          setTimeout(() => {
            channel.delete().catch(() => {});
          }, 1000);
        }
      });
    })
  );
};
