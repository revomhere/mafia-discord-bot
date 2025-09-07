import { DayActions, PlayerState, Vote, VotingRound } from '@/types';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  Message,
  MessageFlags
} from 'discord.js';
import config from '@/config';
import { t } from '@/i18n';
import { stopGame } from '.';

export const startDay = async (
  hostId: string,
  gameState: PlayerState[],
  message: Message,
  firstSpeaker: number,
  isZeroDay?: boolean
): Promise<DayActions> => {
  const order = [...gameState.slice(firstSpeaker), ...gameState.slice(0, firstSpeaker)];
  const nominatedList: Vote[] = [];

  // Each player speech
  for (let idx = 0; idx < order.length; idx++) {
    const nominated = await turnPlayer(
      hostId,
      idx,
      message,
      'general.host-assistant.speaking',
      config.speakingTime,
      gameState,
      nominatedList.map(item => item.to),
      !isZeroDay
    );
    if (typeof nominated === 'number') nominatedList.push({ from: idx, to: nominated });
  }

  // TODO: here code is duplicated as in the end of function
  // TODO: this shows also when game is actually over. have to figure out a way around
  if (isZeroDay) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel(t('general.host-assistant.btn-next'))
        .setStyle(ButtonStyle.Success)
    );

    await message.edit({
      content: '🌙 Місто засинає.',
      components: [row]
    });

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

    return {};
  }

  // Justification speechs
  for (const nomination of nominatedList) {
    await turnPlayer(
      hostId,
      nomination.to,
      message,
      'general.host-assistant.justification',
      config.additionalSpeakingTime,
      gameState
    );
  }

  /* TODO: finish voting section probably
  // At the beginning, everyone voted for noone (-1)
  // If someone is voted for noone, their vote will be counted for last nominated player
  const votingRounds: VotingRound[] = [];

  const voting: Record<number, number> = {};
  const playersAlive = gameState.filter(p => !!p);

  playersAlive.forEach((p, idx) => {
    voting[idx] = -1;
  });

  // Voting
  for (const idx of Object.values(nominatedList)) {
  }*/

  const killed = await selectKilledPlayer(
    hostId,
    message,
    gameState,
    nominatedList.map(i => i.to)
  );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('next')
      .setLabel(t('general.host-assistant.btn-next'))
      .setStyle(ButtonStyle.Success)
  );

  await message.edit({
    content: '🌙 Місто засинає.',
    components: [row]
  });

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

  return {
    nominations: nominatedList,
    voting: {
      eliminated: killed ? [killed] : []
    }
  };
};

const turnPlayer = async (
  hostId: string,
  playerIdx: number,
  message: Message,
  translationKey: string,
  timeLimitSec: number,
  gameState: PlayerState[],
  alreadyOnVote?: number[],
  isVoting?: boolean
): Promise<number | undefined> => {
  const player = gameState[playerIdx];
  if (!player) return;

  let nominated: number | undefined;
  let remaining = timeLimitSec;
  let timer: NodeJS.Timeout | null = null;
  let isPaused = false;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const updateMessage = async () => {
    await message.edit({
      content: t(translationKey, {
        player: player.player.username,
        number: playerIdx + 1,
        time: formatTime(remaining)
      }),
      components: getSpeakingUi({
        isVoting,
        gameState,
        alreadyOnVote,
        speaker: playerIdx,
        nominated,
        isPaused
      })
    });
  };

  return new Promise<number | undefined>(resolve => {
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: config.waitingTime * 1000
    });

    timer = setInterval(async () => {
      if (remaining > 0) {
        remaining -= 2;
        updateMessage();
      } else {
        clearInterval(timer!);
        timer = null;
        remaining = 0;
        updateMessage();
      }
    }, 2000);

    collector.on('collect', async interaction => {
      if (interaction.user.id !== hostId) {
        await interaction.reply({
          content: t('general.host-assistant.buttons-not-for-you'),
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      switch (interaction.customId) {
        case 'stop_game':
          collector.stop('stopped');
          stopGame(message);
          break;
        case 'pause':
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
          isPaused = true;

          await updateMessage();

          break;
        case 'resume':
          if (!timer && remaining > 0) {
            timer = setInterval(async () => {
              if (remaining > 0) {
                remaining--;
                await updateMessage();
              } else {
                clearInterval(timer!);
                timer = null;
                await updateMessage();
              }
            }, 1000);

            isPaused = false;
          }
          break;
        case 'next':
          collector.stop('next');
          resolve(nominated);
          break;
        default:
          if (interaction.customId.startsWith('nominate_')) {
            const idx = Number(interaction.customId.split('_')[1]);
            nominated = nominated === idx ? undefined : idx;

            await updateMessage();
          }
          break;
      }

      await interaction.deferUpdate();
    });

    collector.on('end', async (_collected, reason) => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      if (reason !== 'next' && reason !== 'stopped') {
        resolve(nominated);
      }
    });

    updateMessage();
  });
};

const getSpeakingUi = (opts: {
  isVoting?: boolean;
  gameState?: PlayerState[];
  alreadyOnVote?: number[];
  speaker: number;
  nominated?: number;
  isPaused?: boolean;
}) => {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];

  rows.push(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('stop_game')
        .setLabel(t('general.host-assistant.btn-stop'))
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(opts.isPaused ? 'resume' : 'pause')
        .setLabel(
          opts.isPaused
            ? t('general.host-assistant.btn-resume')
            : t('general.host-assistant.btn-pause')
        )
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel(t('general.host-assistant.btn-next'))
        .setStyle(ButtonStyle.Success)
        .setDisabled(false)
    )
  );

  if (!opts.isVoting || !opts.gameState || !opts.alreadyOnVote) return rows;

  const playersAlive = opts.gameState?.filter(p => !!p);

  for (let i = 0; i < playersAlive.length; i += config.countOfPlayersInRow) {
    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        playersAlive.slice(i, i + config.countOfPlayersInRow).map((p, idx) => {
          const isOnVote = opts.alreadyOnVote?.includes(idx);
          const playerIdx = opts.gameState?.findIndex(pl => pl?.player?.id === p?.player?.id) || 0;
          return new ButtonBuilder()
            .setCustomId(`nominate_${playerIdx}`)
            .setLabel(`[${playerIdx + 1}] ${p.player.username}`)
            .setStyle(
              playerIdx === opts.nominated
                ? ButtonStyle.Danger
                : isOnVote
                ? ButtonStyle.Secondary
                : ButtonStyle.Primary
            )
            .setDisabled(playerIdx === opts.speaker || isOnVote);
        })
      )
    );
  }

  return rows;
};

const selectKilledPlayer = async (
  hostId: string,
  message: Message,
  gameState: PlayerState[],
  candidates: number[]
): Promise<number | null> => {
  let killed: number | undefined;

  const updateMessage = async () => {
    // TODO: find a way around
    const playersToVoteState = gameState.map((p, idx) => (candidates.includes(idx) ? p : null));

    await message.edit({
      content: `Оберіть кого з гравців буде вбито в цьому раунді. Якщо нікого не вбито — натискайте "Далі". Голосування відбувається в порядку: ${candidates
        .map(c => `${c + 1}`)
        .join(', ')}`,
      components: getSpeakingUi({
        isVoting: true,
        gameState: playersToVoteState,
        alreadyOnVote: [],
        speaker: -1,
        nominated: killed
      })
    });
  };

  return new Promise<number | null>(resolve => {
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: config.waitingTime * 1000
    });

    collector.on('collect', async interaction => {
      if (interaction.user.id !== hostId) {
        await interaction.reply({
          content: t('general.host-assistant.buttons-not-for-you'),
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      await interaction.deferUpdate();

      switch (interaction.customId) {
        case 'next':
          collector.stop('done');
          resolve(killed ?? null);
          break;
        case 'stop_game':
          collector.stop('stopped');
          resolve(null);
          break;
        default:
          if (interaction.customId.startsWith('nominate_')) {
            const idx = Number(interaction.customId.split('_')[1]);
            killed = killed === idx ? undefined : idx;
            await updateMessage();
          }
          break;
      }
    });

    collector.on('end', (_collected, reason) => {
      if (reason !== 'done' && reason !== 'stopped') {
        resolve(killed ?? null);
      }
    });

    updateMessage();
  });
};
