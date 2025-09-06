import { DayActions, PlayerState } from '@/types';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Message } from 'discord.js';
import config from '@/config';
import { t } from '@/i18n';

export const startDay = async (
  hostId: string,
  gameState: PlayerState[],
  message: Message,
  firstSpeaker: number,
  isZeroDay?: boolean
): Promise<DayActions> => {
  const order = [...gameState.slice(firstSpeaker), ...gameState.slice(0, firstSpeaker)];

  for (let idx = 0; idx < order.length; idx++)
    await turnPlayer(hostId, idx, message, gameState, isZeroDay);

  return {};
};

export const turnPlayer = async (
  hostId: string,
  playerIdx: number,
  message: Message,
  gameState: PlayerState[],
  isVoting?: boolean
) => {
  const player = gameState[playerIdx];
  if (!player) return;

  const ui = getSpeakingUi({
    onEnd: async () => {
      await console.log('end');
    },
    onNext: async () => {
      await console.log('next');
    },
    onNomitate: async () => {
      await console.log('nominate');
    },
    message,
    hostId,
    isVoting: true,
    gameState,
    alreadyOnVote: [2, 3],
    speaker: playerIdx,
    nominated: 1
  });

  await message.edit({
    content: t('general.host-assistant.speaking', { player: player.player.username }),
    components: ui
  });

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  await sleep(100_000);
};

const getSpeakingUi = (opts: {
  onEnd: () => Promise<void>;
  onNext: () => Promise<void>;
  onNomitate: (id: number) => Promise<void>;
  message: Message;
  hostId: string;
  isVoting?: boolean;
  gameState?: PlayerState[];
  alreadyOnVote?: number[];
  speaker: number;
  nominated?: number;
}) => {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];

  rows.push(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('stop_game')
        .setLabel(t('general.host-assistant.btn-stop'))
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('pause')
        .setLabel(t('general.host-assistant.btn-pause'))
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
            .setCustomId(`nominate_${idx}`)
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
