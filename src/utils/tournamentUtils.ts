import { Team, Tournament, TournamentMatch, TournamentRound } from '../types';

/**
 * Fisher-Yates array shuffle for random matchup determination
 * 「ランダムで対戦相手を決めれる」
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Priority order for match numbers that should receive a SEED slot (BYE)
 * Ensures seed slots are distributed evenly across the bracket.
 * 「メンバーが奇数の場合、シード枠を追加するようにトーナメント表を作成」
 */
export function getSeedMatchNumbers(matchCount: number, seedCount: number): Set<number> {
  const seedSet = new Set<number>();
  if (seedCount <= 0) return seedSet;

  let priorityOrder: number[] = [];
  if (matchCount === 1) {
    priorityOrder = [1];
  } else if (matchCount === 2) {
    priorityOrder = [2, 1];
  } else if (matchCount === 4) {
    priorityOrder = [4, 2, 3, 1];
  } else if (matchCount === 8) {
    priorityOrder = [8, 4, 6, 2, 7, 3, 5, 1];
  } else {
    for (let i = matchCount; i >= 1; i--) {
      priorityOrder.push(i);
    }
  }

  for (let i = 0; i < Math.min(seedCount, priorityOrder.length); i++) {
    seedSet.add(priorityOrder[i]);
  }
  return seedSet;
}

/**
 * Get display name for a round
 */
export function getRoundName(round: number, totalRounds: number): string {
  const remaining = totalRounds - round + 1;
  if (remaining === 1) return '決勝戦 (Final)';
  if (remaining === 2) return '準決勝 (Semifinals)';
  if (remaining === 3) return '準々決勝 (Quarterfinals)';
  return `${round}回戦 (Round ${round})`;
}

/**
 * Calculate bracket size and seed count for any number of teams
 */
export function calculateBracketMetrics(teamCount: number): { bracketSize: number; seedCount: number; totalRounds: number } {
  if (teamCount <= 2) {
    return { bracketSize: 2, seedCount: 0, totalRounds: 1 };
  }
  let bracketSize = 4;
  if (teamCount <= 4) {
    bracketSize = 4;
  } else if (teamCount <= 8) {
    bracketSize = 8;
  } else if (teamCount <= 16) {
    bracketSize = 16;
  } else {
    bracketSize = Math.pow(2, Math.ceil(Math.log2(teamCount)));
  }

  const seedCount = Math.max(0, bracketSize - teamCount);
  const totalRounds = Math.max(1, Math.round(Math.log2(bracketSize)));

  return { bracketSize, seedCount, totalRounds };
}

/**
 * Generate a clean single-elimination tournament bracket with automatic Seed slots (シード枠 / 不戦勝)
 * 「トーナメント表のメンバーが奇数の場合、シード枠を追加するようにトーナメント表を作成」
 */
export function generateTournament(params: {
  name: string;
  description?: string;
  teams: Team[];
  randomShuffle?: boolean;
}): Tournament {
  const { name, description, teams, randomShuffle = true } = params;

  const teamCount = teams.length;
  const { bracketSize, seedCount, totalRounds } = calculateBracketMetrics(teamCount);

  // Shuffle teams if requested
  const orderedTeams = randomShuffle ? shuffleArray(teams) : [...teams];

  const tournamentId = `tourn-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  // Pre-generate match IDs so we can establish tree connections
  let currentMatchCount = Math.max(1, Math.floor(bracketSize / 2));
  const matchIdMap = new Map<string, { round: number; matchNumber: number; id: string }>();

  for (let r = 1; r <= totalRounds; r++) {
    for (let m = 1; m <= currentMatchCount; m++) {
      const matchId = `${tournamentId}-r${r}-m${m}`;
      matchIdMap.set(`${r}-${m}`, { round: r, matchNumber: m, id: matchId });
    }
    currentMatchCount = Math.max(1, Math.floor(currentMatchCount / 2));
  }

  // Determine which matches in Round 1 will receive seed slots (BYE)
  const round1MatchCount = Math.max(1, Math.floor(bracketSize / 2));
  const seedMatchesSet = getSeedMatchNumbers(round1MatchCount, seedCount);

  // Map to store seed winners advancing directly into Round 2 slots
  const seedWinners = new Map<string, { winnerId: string; winnerName: string }>();

  // Build rounds and matches
  const rounds: TournamentRound[] = [];
  currentMatchCount = round1MatchCount;
  let teamCursor = 0;

  for (let r = 1; r <= totalRounds; r++) {
    const roundMatches: TournamentMatch[] = [];

    for (let m = 1; m <= currentMatchCount; m++) {
      const matchKey = `${r}-${m}`;
      const matchMeta = matchIdMap.get(matchKey)!;

      // Link to next match if not final round
      let nextMatchId: string | null = null;
      let nextMatchSlot: 1 | 2 | undefined = undefined;

      if (r < totalRounds) {
        const nextRound = r + 1;
        const nextMatchNum = Math.ceil(m / 2);
        const nextMeta = matchIdMap.get(`${nextRound}-${nextMatchNum}`);
        if (nextMeta) {
          nextMatchId = nextMeta.id;
          nextMatchSlot = m % 2 === 1 ? 1 : 2;
        }
      }

      let team1Id: string | null = null;
      let team1Name: string | null = null;
      let team2Id: string | null = null;
      let team2Name: string | null = null;
      let winnerId: string | null = null;
      let winnerName: string | null = null;
      let status: 'scheduled' | 'in_progress' | 'completed' = 'scheduled';
      let isSeedMatch = false;
      let note: string | undefined = undefined;

      if (r === 1) {
        if (seedMatchesSet.has(m)) {
          // SEED MATCH (不戦勝): 1 real team vs BYE
          isSeedMatch = true;
          const seededTeam = orderedTeams[teamCursor++];
          if (seededTeam) {
            team1Id = seededTeam.id;
            team1Name = seededTeam.name;
            team2Id = null;
            team2Name = '― シード枠 (不戦勝) ―';
            winnerId = seededTeam.id;
            winnerName = seededTeam.name;
            status = 'completed';
            note = 'シード枠（不戦勝）により次戦進出確定';

            // Register winner so Round 2 match receives this team automatically
            if (nextMatchId && nextMatchSlot) {
              seedWinners.set(`${nextMatchId}-${nextMatchSlot}`, {
                winnerId: seededTeam.id,
                winnerName: seededTeam.name,
              });
            }
          }
        } else {
          // REGULAR MATCH: 2 real teams compete
          const t1 = orderedTeams[teamCursor++];
          const t2 = orderedTeams[teamCursor++];
          if (t1) {
            team1Id = t1.id;
            team1Name = t1.name;
          }
          if (t2) {
            team2Id = t2.id;
            team2Name = t2.name;
          }
        }
      } else {
        // Subsequent rounds: Check if any seed winners already advanced into this match
        const slot1Winner = seedWinners.get(`${matchMeta.id}-1`);
        if (slot1Winner) {
          team1Id = slot1Winner.winnerId;
          team1Name = slot1Winner.winnerName;
        }
        const slot2Winner = seedWinners.get(`${matchMeta.id}-2`);
        if (slot2Winner) {
          team2Id = slot2Winner.winnerId;
          team2Name = slot2Winner.winnerName;
        }

        if (slot1Winner && slot2Winner) {
          note = 'シード進出チーム同士の対戦';
        } else if (slot1Winner || slot2Winner) {
          note = 'シード進出枠確定済み（1回戦勝者の進出待ち）';
        }
      }

      roundMatches.push({
        id: matchMeta.id,
        round: r,
        matchNumber: m,
        team1Id,
        team1Name,
        team1Score: undefined,
        team2Id,
        team2Name,
        team2Score: undefined,
        winnerId,
        winnerName,
        status,
        note,
        isSeedMatch,
        nextMatchId,
        nextMatchSlot,
      });
    }

    rounds.push({
      round: r,
      name: getRoundName(r, totalRounds),
      matches: roundMatches,
    });

    currentMatchCount = Math.max(1, Math.floor(currentMatchCount / 2));
  }

  return {
    id: tournamentId,
    name: name.trim() || '公式トーナメント大会',
    description: description?.trim() || '参加チームによる勝ち抜きトーナメント対戦表',
    teamCount,
    participatingTeamIds: orderedTeams.map((t) => t.id),
    rounds,
    championTeamId: null,
    championTeamName: null,
    status: 'in_progress',
    seedCount,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Re-randomize match-ups and re-distribute seed slots
 * 「ランダムで対戦相手を決めれるボタン」
 */
export function randomizeTournamentMatchups(
  tournament: Tournament,
  allTeams: Team[]
): Tournament {
  // Get the teams that belong to this tournament
  const validTeams = allTeams.filter((t) => tournament.participatingTeamIds.includes(t.id));
  const pool = validTeams.length > 0 ? validTeams : allTeams.slice(0, tournament.teamCount);
  const shuffled = shuffleArray(pool);

  // Regenerate clean tournament structure with newly shuffled teams and seed slots
  const regenerated = generateTournament({
    name: tournament.name,
    description: tournament.description,
    teams: shuffled,
    randomShuffle: false, // Already shuffled
  });

  return {
    ...regenerated,
    id: tournament.id, // Preserve existing tournament ID
    createdAt: tournament.createdAt,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Record match outcome and advance winner to next round
 */
export function recordMatchOutcome(
  tournament: Tournament,
  matchId: string,
  winnerId: string,
  team1Score?: number,
  team2Score?: number
): Tournament {
  let targetMatch: TournamentMatch | null = null;
  let winnerTeamName: string | null = null;

  // 1. Locate match and determine winner name
  for (const round of tournament.rounds) {
    const found = round.matches.find((m) => m.id === matchId);
    if (found) {
      targetMatch = found;
      if (winnerId === found.team1Id) {
        winnerTeamName = found.team1Name || 'Team 1';
      } else if (winnerId === found.team2Id) {
        winnerTeamName = found.team2Name || 'Team 2';
      }
      break;
    }
  }

  if (!targetMatch || !winnerTeamName) return tournament;

  const nextMatchId = targetMatch.nextMatchId;
  const nextMatchSlot = targetMatch.nextMatchSlot;

  // 2. Clone rounds and update target match and next match
  const updatedRounds = tournament.rounds.map((round) => {
    const updatedMatches = round.matches.map((match) => {
      // Update the current match
      if (match.id === matchId) {
        return {
          ...match,
          winnerId,
          winnerName: winnerTeamName,
          team1Score: typeof team1Score === 'number' ? team1Score : match.team1Score,
          team2Score: typeof team2Score === 'number' ? team2Score : match.team2Score,
          status: 'completed' as const,
        };
      }

      // If this is the next match that receives the winner, propagate winner into slot
      if (nextMatchId && match.id === nextMatchId) {
        if (nextMatchSlot === 1) {
          return {
            ...match,
            team1Id: winnerId,
            team1Name: winnerTeamName,
            // If winner changed, reset winner of this subsequent match
            winnerId: match.winnerId === match.team1Id ? null : match.winnerId,
            winnerName: match.winnerId === match.team1Id ? null : match.winnerName,
          };
        } else if (nextMatchSlot === 2) {
          return {
            ...match,
            team2Id: winnerId,
            team2Name: winnerTeamName,
            winnerId: match.winnerId === match.team2Id ? null : match.winnerId,
            winnerName: match.winnerId === match.team2Id ? null : match.winnerName,
          };
        }
      }

      return match;
    });

    return { ...round, matches: updatedMatches };
  });

  // Check if final round match was completed
  const finalRound = updatedRounds[updatedRounds.length - 1];
  const finalMatch = finalRound?.matches[0];
  let championTeamId = tournament.championTeamId;
  let championTeamName = tournament.championTeamName;
  let tournamentStatus: 'in_progress' | 'completed' = 'in_progress';

  if (finalMatch && finalMatch.id === matchId && finalMatch.winnerId) {
    championTeamId = finalMatch.winnerId;
    championTeamName = finalMatch.winnerName;
    tournamentStatus = 'completed';
  }

  return {
    ...tournament,
    rounds: updatedRounds,
    championTeamId,
    championTeamName,
    status: tournamentStatus,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Reset match result
 */
export function resetMatchOutcome(tournament: Tournament, matchId: string): Tournament {
  let targetMatch: TournamentMatch | null = null;

  for (const round of tournament.rounds) {
    const found = round.matches.find((m) => m.id === matchId);
    if (found) {
      targetMatch = found;
      break;
    }
  }

  // Seed matches (BYE) cannot be reset
  if (!targetMatch || targetMatch.isSeedMatch) return tournament;

  const nextMatchId = targetMatch.nextMatchId;
  const nextMatchSlot = targetMatch.nextMatchSlot;

  const updatedRounds = tournament.rounds.map((round) => {
    const updatedMatches = round.matches.map((match) => {
      if (match.id === matchId) {
        return {
          ...match,
          winnerId: null,
          winnerName: null,
          team1Score: undefined,
          team2Score: undefined,
          status: 'scheduled' as const,
        };
      }
      if (nextMatchId && match.id === nextMatchId) {
        if (nextMatchSlot === 1) {
          return {
            ...match,
            team1Id: null,
            team1Name: null,
            team1Score: undefined,
            winnerId: null,
            winnerName: null,
          };
        } else if (nextMatchSlot === 2) {
          return {
            ...match,
            team2Id: null,
            team2Name: null,
            team2Score: undefined,
            winnerId: null,
            winnerName: null,
          };
        }
      }
      return match;
    });
    return { ...round, matches: updatedMatches };
  });

  return {
    ...tournament,
    rounds: updatedRounds,
    championTeamId: null,
    championTeamName: null,
    status: 'in_progress',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Initial sample tournament created from initial 4 teams
 */
export function createInitialTournament(teams: Team[]): Tournament {
  return generateTournament({
    name: '第1回 イベント公式トーナメント大会',
    description: '登録4チームによる公式トーナメント戦。各チーム4キャラの最強編成で激突！',
    teams: teams.length >= 4 ? teams.slice(0, 4) : teams,
    randomShuffle: false,
  });
}
