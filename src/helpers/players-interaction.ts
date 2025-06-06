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
    console.error(`Failed to send DM to ${user.player.username}`);

    return {
      user: user.player,
      embedMessage: embed
    };
  }
};

// returns user if failed to change nickname
export const changeNickname = async (
  interaction: ChatInputCommandInteraction,
  user: CompleteUser,
  number: number
) => {
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
  }[],
  allUsers: User[]
) => {
  if (!interaction.guild || failedDms.length === 0) return;

  const guild = interaction.guild;

  const userWithAdminRoles = (
    await Promise.all(
      allUsers.map(async user => {
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return null;

        const adminRoles = member.roles.cache.filter(
          role =>
            role.permissions.has(PermissionsBitField.Flags.Administrator) &&
            role.id !== guild.id &&
            !role.managed
        );

        if (adminRoles.size === 0) return null;

        return {
          user,
          adminRoleIds: adminRoles.map(role => role.id)
        };
      })
    )
  ).filter(entry => entry !== null);

  await Promise.all(
    userWithAdminRoles.map(async ({ user, adminRoleIds }) => {
      const member = await guild.members.fetch(user.id).catch(() => null);
      if (!member) return;
      try {
        await member.roles.remove(adminRoleIds, t('commands.start.removed-admin-role'));
      } catch (err) {
        console.error(`Failed to remove admin roles from ${user.tag}`, err);
      }
    })
  );

  const activeChannelIds = new Set<string>();

  await Promise.all(
    failedDms.map(async dm => {
      const channel = await guild.channels
        .create({
          name: `role-${dm.user.username}`,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
              id: dm.user.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.ReadMessageHistory
              ]
            }
          ]
        })
        .catch(() => null);

      if (!channel) return;

      activeChannelIds.add(channel.id);

      const confirmButton = new ButtonBuilder()
        .setCustomId(`confirm_got_role_${dm.user.id}`)
        .setLabel(t('commands.start.dm.got-role'))
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton);

      const message = await channel.send({
        content: `<@${dm.user.id}>`,
        embeds: [dm.embedMessage],
        components: [row],
        allowedMentions: { users: [dm.user.id] }
      });

      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 3 * 60 * 1000, // 3 min
        filter: (i: ButtonInteraction) => i.user.id === dm.user.id
      });

      let acknowledged = false;

      const maybeRestoreRoles = async () => {
        activeChannelIds.delete(channel.id);
        if (activeChannelIds.size === 0) {
          await Promise.all(
            userWithAdminRoles.map(async ({ user, adminRoleIds }) => {
              const member = await guild.members.fetch(user.id).catch(() => null);
              if (!member) return;
              try {
                await member.roles.add(adminRoleIds, t('commands.start.restored-admin-role'));
              } catch (err) {
                console.error(`Failed to restore roles to ${user.tag}`, err);
              }
            })
          );
        }
      };

      collector.on('collect', async i => {
        acknowledged = true;
        await i.deferUpdate();
        await channel.delete().catch(() => {});
        await maybeRestoreRoles();
      });

      collector.on('end', async () => {
        if (!acknowledged) {
          setTimeout(async () => {
            await channel.delete().catch(() => {});
            await maybeRestoreRoles();
          }, 1000);
        }
      });
    })
  );
};
