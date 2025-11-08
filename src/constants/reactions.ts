import { REACTION_TYPES } from '../services/api/likesCommentsApi';

export type ReactionType = (typeof REACTION_TYPES)[number];

const REACTION_EMOJI_MAP: Record<ReactionType, { label: string; emoji: string }> = {
  like: { label: 'Like', emoji: '👍' },
  love: { label: 'Love', emoji: '❤️' },
  celebrate: { label: 'Celebrate', emoji: '🎉' },
  insightful: { label: 'Insightful', emoji: '💡' },
  support: { label: 'Support', emoji: '🤝' },
};

export const REACTION_OPTIONS = REACTION_TYPES.map((type) => ({
  type,
  label: REACTION_EMOJI_MAP[type].label,
  emoji: REACTION_EMOJI_MAP[type].emoji,
})) as Array<{ type: ReactionType; label: string; emoji: string }>;

export const DEFAULT_REACTION: ReactionType = 'like';

export const getReactionDisplay = (type: ReactionType) => REACTION_EMOJI_MAP[type];
