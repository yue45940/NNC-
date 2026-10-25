import { Team, TeamMember, TeamCharacter } from '../types';

// Preset sample character avatars (SVG data URIs for default styling)
export const DEFAULT_CHARACTER_PRESETS = [
  {
    name: 'ブレイズナイト (炎剣士)',
    color: '#ef4444',
    iconText: '⚔️',
  },
  {
    name: 'ストームアーチャー (風弓手)',
    color: '#06b6d4',
    iconText: '🏹',
  },
  {
    name: 'シャドウニンジャ (隠密)',
    color: '#8b5cf6',
    iconText: '🥷',
  },
  {
    name: 'ホーリーパラディン (聖騎士)',
    color: '#f59e0b',
    iconText: '🛡️',
  },
];

export function createDefaultCharacters(memberName: string): TeamCharacter[] {
  return [
    {
      id: `char-${Math.random().toString(36).substr(2, 6)}-1`,
      slotNumber: 1,
      name: `${memberName}のメインキャラ`,
      image: '',
      note: 'スロット1 (メイン)',
    },
    {
      id: `char-${Math.random().toString(36).substr(2, 6)}-2`,
      slotNumber: 2,
      name: `${memberName}のサブキャラA`,
      image: '',
      note: 'スロット2 (サブ)',
    },
    {
      id: `char-${Math.random().toString(36).substr(2, 6)}-3`,
      slotNumber: 3,
      name: `${memberName}のサブキャラB`,
      image: '',
      note: 'スロット3 (サポート)',
    },
    {
      id: `char-${Math.random().toString(36).substr(2, 6)}-4`,
      slotNumber: 4,
      name: `${memberName}のタクティカルキャラ`,
      image: '',
      note: 'スロット4 (タクティカル)',
    },
  ];
}

/**
 * Normalizes any team data (handles legacy string[] members or partial character arrays)
 * ensuring every member has exactly 4 character slots.
 */
export function normalizeTeam(rawTeam: any): Team {
  if (!rawTeam || typeof rawTeam !== 'object') {
    return {
      id: `team-${Date.now()}`,
      name: '未設定チーム',
      leaderName: '代表未設定',
      description: '',
      color: 'indigo',
      icon: 'Flag',
      members: [],
      createdAt: new Date().toISOString(),
    };
  }

  let normalizedMembers: TeamMember[] = [];

  if (Array.isArray(rawTeam.members)) {
    normalizedMembers = rawTeam.members.map((m: any, mIdx: number) => {
      if (typeof m === 'string') {
        return {
          id: `mem-${mIdx}-${Math.random().toString(36).substr(2, 5)}`,
          name: m,
          isLeader: mIdx === 0,
          characters: createDefaultCharacters(m),
        };
      }

      if (m && typeof m === 'object') {
        const memberName = m.name || `メンバー${mIdx + 1}`;
        let chars: TeamCharacter[] = [];

        if (Array.isArray(m.characters)) {
          chars = m.characters.map((c: any, cIdx: number) => ({
            id: c.id || `char-${mIdx}-${cIdx + 1}`,
            slotNumber: c.slotNumber || cIdx + 1,
            name: c.name || `キャラ${cIdx + 1}`,
            image: c.image || '',
            note: c.note || '',
          }));
        }

        // Guarantee 4 characters per member
        while (chars.length < 4) {
          const slotNum = chars.length + 1;
          chars.push({
            id: `char-${mIdx}-${slotNum}`,
            slotNumber: slotNum,
            name: `${memberName}のキャラ${slotNum}`,
            image: '',
            note: `スロット${slotNum}`,
          });
        }

        return {
          id: m.id || `mem-${mIdx}-${Math.random().toString(36).substr(2, 5)}`,
          name: memberName,
          userId: m.userId,
          isLeader: !!m.isLeader || mIdx === 0,
          roleTitle: m.roleTitle || (mIdx === 0 ? 'リーダー' : 'メンバー'),
          characters: chars.slice(0, 4),
        };
      }

      return {
        id: `mem-${mIdx}`,
        name: `メンバー${mIdx + 1}`,
        characters: createDefaultCharacters(`メンバー${mIdx + 1}`),
      };
    });
  }

  return {
    id: rawTeam.id || `team-${Date.now().toString(36)}`,
    name: rawTeam.name || '無名チーム',
    leaderName: rawTeam.leaderName || (normalizedMembers[0]?.name ?? '代表未設定'),
    leaderUserId: rawTeam.leaderUserId || normalizedMembers[0]?.userId,
    department: rawTeam.department || '',
    description: rawTeam.description || '',
    color: rawTeam.color || 'indigo',
    icon: rawTeam.icon || 'Flame',
    members: normalizedMembers,
    totalScore: typeof rawTeam.totalScore === 'number' ? rawTeam.totalScore : 0,
    createdAt: rawTeam.createdAt || new Date().toISOString(),
    updatedAt: rawTeam.updatedAt,
  };
}

import { optimizeLocalImage } from './imageOptimizer';

/**
 * Reads and optimizes a local image file selected by user to a clean, lightweight Base64 data URL.
 * Automatically handles orientation, size limits, and ensures quick loading & storage.
 */
export async function readLocalImageFile(
  file: File,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.85
): Promise<string> {
  const result = await optimizeLocalImage(file, {
    maxWidth,
    maxHeight,
    quality,
    targetMaxBytes: 50 * 1024,
  });
  return result.dataUrl;
}
