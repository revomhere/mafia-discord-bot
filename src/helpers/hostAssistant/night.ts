import { MafiaRole, roleNames, roleEmojis } from '@/enums';
import { t } from '@/i18n';
import { PlayerState, NightActions } from '@/types';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  Message,
  MessageFlags
} from 'discord.js';

interface NightOptions {
  isDon?: boolean;
  isManiac?: boolean;
  isDoctor?: boolean;
}

export const startNight = async (
  hostId: string,
  gameState: PlayerState[],
  message: Message,
  options: NightOptions,
  prevDoctorSave?: number
): Promise<NightActions> => {
  const result: NightActions = {} as NightActions;
  const allIdx = gameState.map((_, idx) => idx);

  const selectTarget = async (
    prompt: string,
    enabledFilter: (idx: number) => boolean,
    skipAllowed = false
  ): Promise<number> => {
    return new Promise(resolve => {
      const filtered = allIdx.filter(enabledFilter);

      if (filtered.length === 0) {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('next')
            .setLabel(t('general.host-assistant.btn-next'))
            .setStyle(ButtonStyle.Success)
        );
        message.edit({ content: `${prompt} — ніхто не доступний`, components: [row] });
        resolve(-1);
        return;
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        ...allIdx.map(idx =>
          new ButtonBuilder()
            .setCustomId(`choose_${idx}`)
            .setLabel(`${idx + 1}. ${gameState[idx]?.player.username ?? '—'}`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(!enabledFilter(idx))
        ),
        ...(skipAllowed
          ? [
              new ButtonBuilder()
                .setCustomId('skip')
                .setLabel(t('general.host-assistant.btn-skip'))
                .setStyle(ButtonStyle.Secondary)
            ]
          : [])
      );

      message.edit({ content: prompt, components: [row] });

      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        max: 1
      });

      collector.on('collect', async i => {
        if (i.user.id !== hostId) {
          await i.reply({
            content: t('general.host-assistant.buttons-not-for-you'),
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        await i.deferUpdate();

        if (i.customId === 'skip') {
          collector.stop();
          resolve(-1);
        } else if (i.customId.startsWith('choose_')) {
          const idx = Number(i.customId.split('_')[1]);
          collector.stop();
          resolve(idx);
        }
      });
    });
  };

  const showResultAndWait = async (content: string) => {
    return new Promise<void>(resolve => {
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel(t('general.host-assistant.btn-next'))
          .setStyle(ButtonStyle.Success)
      );

      message.edit({ content, components: [row] });

      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        max: 1
      });

      collector.on('collect', async i => {
        if (i.user.id !== hostId) {
          await i.reply({
            content: t('general.host-assistant.buttons-not-for-you'),
            flags: MessageFlags.Ephemeral
          });
          return;
        }
        await i.deferUpdate();
        collector.stop();
        resolve();
      });
    });
  };

  result.mafiaKill = await selectTarget(
    t('general.host-assistant.night-mafia'),
    idx => !!gameState[idx]
  );

  if (options.isDon) {
    const donAlive = gameState.some(p => p?.role === MafiaRole.DON);
    if (donAlive) {
      const donIdx = await selectTarget(
        t('general.host-assistant.night-don'),
        idx => !!gameState[idx] && ![MafiaRole.MAFIA, MafiaRole.DON].includes(gameState[idx]?.role!)
      );
      if (donIdx >= 0) {
        result.donCheck = donIdx;
        const role =
          gameState[donIdx]?.role === MafiaRole.COMMISSAR ? MafiaRole.COMMISSAR : MafiaRole.CITIZEN;
        await showResultAndWait(
          `${gameState[donIdx]?.player.username ?? '—'} — ${roleEmojis[role]} ${roleNames[role]}`
        );
      }
    } else {
      await showResultAndWait(`Дон помер — ніч пропущено`);
    }
  }

  if (options.isManiac) {
    result.maniacKill = await selectTarget(
      t('general.host-assistant.night-maniac'),
      idx => !!gameState[idx]
    );
  }

  const commissarAlive = gameState.some(p => p?.role === MafiaRole.COMMISSAR);
  if (commissarAlive) {
    const commissarIdx = await selectTarget(
      t('general.host-assistant.night-commissar'),
      idx => !!gameState[idx] && gameState[idx]?.role !== MafiaRole.COMMISSAR
    );
    if (commissarIdx >= 0) {
      result.commissarCheck = commissarIdx;
      const role = [MafiaRole.MAFIA, MafiaRole.DON].includes(gameState[commissarIdx]?.role!)
        ? MafiaRole.MAFIA
        : MafiaRole.CITIZEN;
      await showResultAndWait(
        `${gameState[commissarIdx]?.player.username ?? '—'} — ${roleEmojis[role]} ${
          roleNames[role]
        }`
      );
    }
  } else {
    await showResultAndWait(`Комісар помер — ніч пропущено`);
  }

  const doctorAlive = gameState.some(p => p?.role === MafiaRole.DOCTOR);
  if (options.isDoctor) {
    if (doctorAlive) {
      result.doctorHeal = await selectTarget(
        t('general.host-assistant.night-doctor'),
        idx => !!gameState[idx] && idx !== prevDoctorSave
      );
    } else {
      await showResultAndWait(`Лікар помер — ніч пропущено`);
    }
  }

  // В кінці startNight, перед return result
  const killed: number[] = [result.mafiaKill, result.maniacKill].filter(
    (idx): idx is number => typeof idx === 'number' && idx >= 0 && idx !== result.doctorHeal
  );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('next')
      .setLabel(t('general.host-assistant.btn-next'))
      .setStyle(ButtonStyle.Success)
  );

  await message.edit({
    content: `🌞 Місто прокидається. ${
      killed.length > 0
        ? `Вбиті були гравці: ${killed
            .map(idx => gameState[idx]?.player.username ?? '—')
            .join(', ')}`
        : 'На щастя без втрат'
    }`,
    components: [row]
  });

  // Очікуємо натискання кнопки "Далі"
  await new Promise<void>(resolve => {
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      max: 1
    });

    collector.on('collect', async i => {
      if (i.user.id !== hostId) {
        await i.reply({
          content: t('general.host-assistant.buttons-not-for-you'),
          flags: MessageFlags.Ephemeral
        });
        return;
      }
      await i.deferUpdate();
      collector.stop();
      resolve();
    });
  });

  return result;
};
