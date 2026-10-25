import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Tournament, TournamentMatch, Team } from '../types';
import { calculateBracketMetrics } from '../utils/tournamentUtils';
import {
  Trophy,
  Shuffle,
  PlusCircle,
  Crown,
  Swords,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Flame,
  Rocket,
  Sparkles,
  Shield,
  Star,
  Zap,
  Flag,
  X,
  Edit3,
  RotateCcw,
  Users,
  Eye,
  Check,
  Trash2,
} from 'lucide-react';

export const TournamentView: React.FC = () => {
  const {
    tournaments,
    teams,
    currentUser,
    addTournament,
    updateTournament,
    deleteTournament,
    randomizeTournamentMatchups,
    recordMatchResult,
    resetMatchResult,
    setActiveTab,
  } = useStore();

  const isAdmin = currentUser?.role === 'admin';

  // Active tournament selection
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(() => {
    return tournaments[0]?.id || '';
  });

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingTournament, setIsDeletingTournament] = useState(false);
  const [isRandomizeModalOpen, setIsRandomizeModalOpen] = useState(false);
  const [selectedMatchForEdit, setSelectedMatchForEdit] = useState<TournamentMatch | null>(null);
  const [matchScore1, setMatchScore1] = useState<string>('');
  const [matchScore2, setMatchScore2] = useState<string>('');
  const [selectedTeamPreview, setSelectedTeamPreview] = useState<Team | null>(null);

  // Create form state
  const [newTitle, setNewTitle] = useState('公式トーナメント大会');
  const [newDescription, setNewDescription] = useState('参加各チームによる勝ち抜きトーナメント対戦');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(() => {
    return teams.slice(0, 4).map((t) => t.id);
  });
  const [autoRandomize, setAutoRandomize] = useState(true);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Active tournament object
  const activeTournament = useMemo(() => {
    if (!selectedTournamentId && tournaments.length > 0) {
      return tournaments[0];
    }
    return tournaments.find((t) => t.id === selectedTournamentId) || tournaments[0] || null;
  }, [tournaments, selectedTournamentId]);

  // Team lookup map
  const teamMap = useMemo(() => {
    const map = new Map<string, Team>();
    teams.forEach((t) => map.set(t.id, t));
    return map;
  }, [teams]);

  // Color styles helper
  const getTeamColorStyle = (teamId?: string | null) => {
    if (!teamId) return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
    const team = teamMap.get(teamId);
    const color = team?.color || 'blue';

    switch (color) {
      case 'rose':
        return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300', dot: 'bg-rose-500' };
      case 'indigo':
        return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300', dot: 'bg-indigo-500' };
      case 'emerald':
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', dot: 'bg-emerald-500' };
      case 'amber':
        return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-500' };
      case 'violet':
        return { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-300', dot: 'bg-violet-500' };
      case 'cyan':
        return { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-300', dot: 'bg-cyan-500' };
      case 'orange':
        return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500' };
      default:
        return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', dot: 'bg-blue-500' };
    }
  };

  // Helper for team icon
  const renderTeamIcon = (iconName?: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'Flame':
        return <Flame className={className} />;
      case 'Rocket':
        return <Rocket className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Trophy':
        return <Trophy className={className} />;
      case 'Star':
        return <Star className={className} />;
      case 'Shield':
        return <Shield className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      default:
        return <Flag className={className} />;
    }
  };

  // Handle Randomize matchups
  const handleRandomize = () => {
    if (!activeTournament) return;
    setIsRandomizeModalOpen(true);
  };

  const handleConfirmRandomize = async () => {
    if (!activeTournament) return;
    await randomizeTournamentMatchups(activeTournament.id);
    setIsRandomizeModalOpen(false);
  };

  // Handle Delete Tournament
  const handleDeleteTournament = async () => {
    if (!activeTournament) return;
    setIsDeletingTournament(true);
    const targetId = activeTournament.id;
    const success = await deleteTournament(targetId);
    setIsDeletingTournament(false);
    if (success) {
      const remaining = tournaments.filter((t) => t.id !== targetId);
      setSelectedTournamentId(remaining[0]?.id || '');
      setIsDeleteModalOpen(false);
    }
  };

  // Handle open match edit modal
  const handleOpenMatchEdit = (match: TournamentMatch) => {
    if (!isAdmin) return;
    setSelectedMatchForEdit(match);
    setMatchScore1(typeof match.team1Score === 'number' ? String(match.team1Score) : '');
    setMatchScore2(typeof match.team2Score === 'number' ? String(match.team2Score) : '');
  };

  // Handle save winner
  const handleDeclareWinner = async (winnerId: string) => {
    if (!activeTournament || !selectedMatchForEdit) return;
    const s1 = matchScore1.trim() !== '' ? parseInt(matchScore1, 10) : undefined;
    const s2 = matchScore2.trim() !== '' ? parseInt(matchScore2, 10) : undefined;

    await recordMatchResult(activeTournament.id, selectedMatchForEdit.id, winnerId, s1, s2);
    setSelectedMatchForEdit(null);
  };

  // Handle reset match
  const handleResetMatch = async () => {
    if (!activeTournament || !selectedMatchForEdit) return;
    await resetMatchResult(activeTournament.id, selectedMatchForEdit.id);
    setSelectedMatchForEdit(null);
  };

  // Handle Create Tournament
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTeamIds.length < 2) {
      alert('参加チームを最低2チーム以上選択してください');
      return;
    }
    setIsSubmittingCreate(true);
    const created = await addTournament({
      name: newTitle.trim(),
      description: newDescription.trim(),
      selectedTeamIds,
      randomShuffle: autoRandomize,
    });
    setIsSubmittingCreate(false);
    if (created) {
      setSelectedTournamentId(created.id);
      setIsCreateModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <Trophy className="w-4 h-4" />
            <span>トーナメント表</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            イベント公式トーナメント対戦表
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            {isAdmin
              ? '参加チームのトーナメント表作成、対戦相手のランダム決定（シャッフル）、勝者進出およびスコア記録が行えます。'
              : 'イベントで熱戦を繰り広げる各チームの勝ち抜きトーナメント対戦表および試合結果をリアルタイムで確認できます。'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tournament Switcher if multiple */}
          {tournaments.length > 1 && (
            <select
              value={activeTournament?.id || ''}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}

          {isAdmin && (
            <>
              {/* Random Matchup Button 「ランダムで対戦相手を決めれるボタン」 */}
              {activeTournament && (
                <button
                  onClick={handleRandomize}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                  title="対戦相手をランダムにシャッフルして再抽選"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>ランダムで対戦相手を決める</span>
                </button>
              )}

              {/* Delete Tournament Button 「トーナメント表の削除ボタン」 */}
              {activeTournament && (
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                  title="このトーナメント表を完全に削除"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>トーナメントを削除</span>
                </button>
              )}

              {/* Create Tournament Button */}
              <button
                onClick={() => {
                  setSelectedTeamIds(teams.slice(0, 4).map((t) => t.id));
                  setIsCreateModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                <span>トーナメントを作成</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* No Tournaments empty state */}
      {!activeTournament ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-3">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">トーナメント表がまだありません</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {isAdmin
              ? '「トーナメントを作成」ボタンからエントリーチームを選択してトーナメント表を作成してください。'
              : '管理者がトーナメント表を作成・公開すると、ここにリアルタイムで表示されます。'}
          </p>
          {isAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
            >
              トーナメントを作成する
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tournament Overview Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  {activeTournament.name}
                </h2>
                {activeTournament.status === 'completed' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    大会終了・優勝決定
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-md">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    トーナメント進行中
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {activeTournament.description}
              </p>
            </div>

            {/* Champion Card if completed */}
            {activeTournament.championTeamName ? (
              <div className="p-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl shadow-md flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-amber-100">
                  <Crown className="w-6 h-6 text-amber-200 fill-amber-300" />
                </div>
                <div>
                  <span className="text-[10px] text-amber-100 uppercase tracking-wider block font-bold">
                    CHAMPION / 大会優勝
                  </span>
                  <span className="text-sm font-black tracking-tight">
                    {activeTournament.championTeamName}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">参加チーム</span>
                  <span className="font-mono font-bold text-indigo-600 text-sm">
                    {activeTournament.participatingTeamIds.length} チーム
                  </span>
                </div>
                <div className="w-px h-6 bg-slate-200" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">総ラウンド</span>
                  <span className="font-mono font-bold text-slate-700 text-sm">
                    {activeTournament.rounds.length} ラウンド
                  </span>
                </div>
                {typeof activeTournament.seedCount === 'number' && activeTournament.seedCount > 0 && (
                  <>
                    <div className="w-px h-6 bg-slate-200" />
                    <div>
                      <span className="text-[10px] text-emerald-600 block font-bold">シード枠 (不戦勝)</span>
                      <span className="font-mono font-bold text-emerald-700 text-sm flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        {activeTournament.seedCount} 枠
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Tournament Visual Tree Bracket */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs overflow-x-auto">
            <div className="min-w-[700px] flex items-stretch gap-6 sm:gap-10">
              {activeTournament.rounds.map((round, rIdx) => {
                const isFinal = rIdx === activeTournament.rounds.length - 1;

                return (
                  <div key={round.round} className="flex-1 flex flex-col">
                    {/* Round Header */}
                    <div className="text-center pb-3 mb-4 border-b border-slate-200">
                      <span className="text-[11px] font-black uppercase text-indigo-600 block tracking-wider">
                        ROUND {round.round}
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center justify-center gap-1.5 mt-0.5">
                        {isFinal && <Crown className="w-4 h-4 text-amber-500" />}
                        {round.name}
                      </h3>
                    </div>

                    {/* Matches Column */}
                    <div className="flex-1 flex flex-col justify-around gap-6">
                      {round.matches.map((match) => {
                        const t1Style = getTeamColorStyle(match.team1Id);
                        const t2Style = getTeamColorStyle(match.team2Id);
                        const team1 = match.team1Id ? teamMap.get(match.team1Id) : null;
                        const team2 = match.team2Id ? teamMap.get(match.team2Id) : null;

                        const isT1Winner = match.winnerId && match.winnerId === match.team1Id;
                        const isT2Winner = match.winnerId && match.winnerId === match.team2Id;

                        return (
                          <div
                            key={match.id}
                            className={`rounded-2xl border transition-all relative ${
                              match.status === 'completed'
                                ? 'border-slate-300 bg-white shadow-xs'
                                : 'border-slate-200 bg-slate-50/60 shadow-2xs'
                            } ${isAdmin ? 'hover:border-indigo-400' : ''}`}
                          >
                            {/* Match Card Top Meta */}
                            <div className="px-3.5 py-1.5 bg-slate-100/80 rounded-t-2xl border-b border-slate-200 flex items-center justify-between text-[10px]">
                              <span className="font-bold font-mono text-slate-500">
                                試合 #{match.matchNumber}
                              </span>

                              <div className="flex items-center gap-2">
                                {match.isSeedMatch ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-md shadow-2xs">
                                    <Sparkles className="w-3 h-3 text-emerald-600" />
                                    シード枠 (不戦勝)
                                  </span>
                                ) : match.status === 'completed' ? (
                                  <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    試合終了
                                  </span>
                                ) : match.team1Name && match.team2Name ? (
                                  <span className="inline-flex items-center gap-0.5 text-amber-700 font-bold">
                                    <Swords className="w-3 h-3 text-amber-600" />
                                    対戦カード確定
                                  </span>
                                ) : (
                                  <span className="text-slate-400">進出待ち</span>
                                )}

                                {isAdmin && !match.isSeedMatch && (
                                  <button
                                    onClick={() => handleOpenMatchEdit(match)}
                                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-md hover:bg-white transition-colors cursor-pointer"
                                    title="勝者・スコアを記録"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>記録</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Match Teams */}
                            {match.isSeedMatch ? (
                              <div className="p-3 space-y-2">
                                {/* Seeded Team 1 */}
                                <div
                                  onClick={() => team1 && setSelectedTeamPreview(team1)}
                                  className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 ring-2 ring-emerald-400/20 cursor-pointer shadow-2xs"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {team1 ? (
                                      <span className={`w-6 h-6 rounded-lg ${t1Style.bg} border ${t1Style.border} flex items-center justify-center shrink-0 text-slate-700`}>
                                        {renderTeamIcon(team1.icon, 'w-3.5 h-3.5')}
                                      </span>
                                    ) : (
                                      <span className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 text-[10px] font-bold">
                                        👑
                                      </span>
                                    )}
                                    <div className="min-w-0 truncate">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-black text-slate-900 truncate">
                                          {match.team1Name}
                                        </span>
                                        <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                                          <Crown className="w-2.5 h-2.5" />
                                          シード進出
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md">
                                    不戦勝 (2回戦へ進出)
                                  </span>
                                </div>

                                {/* Seed BYE (Slot 2) */}
                                <div className="flex items-center justify-between p-2 rounded-xl border border-dashed border-slate-300 bg-slate-100/60 text-slate-400">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-slate-200/80 flex items-center justify-center text-[10px] font-black text-slate-500">
                                      BYE
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500 italic">
                                      ― シード枠 (不戦勝) ―
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-400">
                                    対戦なし
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 space-y-2">
                                {/* Team 1 */}
                                <div
                                  onClick={() => team1 && setSelectedTeamPreview(team1)}
                                  className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                                    isT1Winner
                                      ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/30'
                                      : match.team1Id
                                      ? `${t1Style.bg} ${t1Style.border} hover:opacity-90 cursor-pointer`
                                      : 'bg-white border-dashed border-slate-200 text-slate-400'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {team1 ? (
                                      <span className={`w-6 h-6 rounded-lg ${t1Style.bg} border ${t1Style.border} flex items-center justify-center shrink-0 text-slate-700`}>
                                        {renderTeamIcon(team1.icon, 'w-3.5 h-3.5')}
                                      </span>
                                    ) : (
                                      <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 text-[10px]">
                                        ?
                                      </span>
                                    )}

                                    <div className="min-w-0 truncate">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`text-xs font-bold truncate ${isT1Winner ? 'text-slate-900 font-extrabold' : 'text-slate-800'}`}>
                                          {match.team1Name || '未決定 (勝者進出待ち)'}
                                        </span>
                                        {isT1Winner && (
                                          <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {typeof match.team1Score === 'number' && (
                                    <span className={`font-mono text-xs font-black px-2 py-0.5 rounded-md ${isT1Winner ? 'bg-amber-200 text-amber-900' : 'bg-slate-200/80 text-slate-700'}`}>
                                      {match.team1Score}
                                    </span>
                                  )}
                                </div>

                                {/* VS separator */}
                                <div className="flex items-center justify-center">
                                  <span className="text-[10px] font-black text-slate-400 font-mono tracking-widest px-2 py-0.2 bg-white rounded-full border border-slate-200/80">
                                    VS
                                  </span>
                                </div>

                                {/* Team 2 */}
                                <div
                                  onClick={() => team2 && setSelectedTeamPreview(team2)}
                                  className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                                    isT2Winner
                                      ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/30'
                                      : match.team2Id
                                      ? `${t2Style.bg} ${t2Style.border} hover:opacity-90 cursor-pointer`
                                      : 'bg-white border-dashed border-slate-200 text-slate-400'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {team2 ? (
                                      <span className={`w-6 h-6 rounded-lg ${t2Style.bg} border ${t2Style.border} flex items-center justify-center shrink-0 text-slate-700`}>
                                        {renderTeamIcon(team2.icon, 'w-3.5 h-3.5')}
                                      </span>
                                    ) : (
                                      <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 text-[10px]">
                                        ?
                                      </span>
                                    )}

                                    <div className="min-w-0 truncate">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`text-xs font-bold truncate ${isT2Winner ? 'text-slate-900 font-extrabold' : 'text-slate-800'}`}>
                                          {match.team2Name || '未決定 (勝者進出待ち)'}
                                        </span>
                                        {isT2Winner && (
                                          <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {typeof match.team2Score === 'number' && (
                                    <span className={`font-mono text-xs font-black px-2 py-0.5 rounded-md ${isT2Winner ? 'bg-amber-200 text-amber-900' : 'bg-slate-200/80 text-slate-700'}`}>
                                      {match.team2Score}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Note / Admin fast action */}
                            {match.note && (
                              <div className="px-3 pb-2 pt-0 text-[10px] text-slate-500 border-t border-slate-100 mt-1">
                                {match.note}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Champion Column */}
              <div className="w-48 flex flex-col items-center justify-center">
                <div className="text-center pb-3 mb-4 border-b border-slate-200 w-full">
                  <span className="text-[11px] font-black uppercase text-amber-600 block tracking-wider">
                    CHAMPION
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    優勝チーム
                  </h3>
                </div>

                <div className="w-full p-4 bg-gradient-to-b from-amber-50 to-amber-100/60 rounded-2xl border-2 border-amber-300 shadow-sm text-center">
                  <div className="w-14 h-14 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center mx-auto mb-2 shadow-sm">
                    <Trophy className="w-7 h-7" />
                  </div>

                  {activeTournament.championTeamName ? (
                    <div>
                      <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block">
                        WINNER
                      </span>
                      <h4 className="text-base font-black text-slate-900 mt-0.5">
                        {activeTournament.championTeamName}
                      </h4>
                      <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-white/90 px-2.5 py-0.5 rounded-full border border-amber-300">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        栄冠を奪取！
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-bold text-slate-500 block">
                        決勝戦勝者が
                      </span>
                      <span className="text-xs font-extrabold text-amber-800">
                        ここに決定します
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match Result Recording Modal (Admin only) */}
      {selectedMatchForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Swords className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">試合結果・勝者の設定</h3>
                  <p className="text-xs text-white/80">
                    Round {selectedMatchForEdit.round} - 試合 #{selectedMatchForEdit.matchNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMatchForEdit(null)}
                className="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-500">
                獲得スコアを入力し、勝利したチームを選択してください。勝利したチームは自動的に次のラウンドへ進出します。
              </p>

              {/* Team 1 Selection */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 block">チーム 1</span>
                  <span className="text-sm font-bold text-slate-900 truncate block">
                    {selectedMatchForEdit.team1Name || '未決定'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="得点"
                    value={matchScore1}
                    onChange={(e) => setMatchScore1(e.target.value)}
                    className="w-16 px-2 py-1.5 text-center font-mono font-bold text-sm bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  {selectedMatchForEdit.team1Id && (
                    <button
                      type="button"
                      onClick={() => handleDeclareWinner(selectedMatchForEdit.team1Id!)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>勝利進出</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Team 2 Selection */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 block">チーム 2</span>
                  <span className="text-sm font-bold text-slate-900 truncate block">
                    {selectedMatchForEdit.team2Name || '未決定'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="得点"
                    value={matchScore2}
                    onChange={(e) => setMatchScore2(e.target.value)}
                    className="w-16 px-2 py-1.5 text-center font-mono font-bold text-sm bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  {selectedMatchForEdit.team2Id && (
                    <button
                      type="button"
                      onClick={() => handleDeclareWinner(selectedMatchForEdit.team2Id!)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>勝利進出</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Reset match result button */}
              {selectedMatchForEdit.winnerId && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleResetMatch}
                    className="w-full py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>この試合結果を取り消し・リセットする</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedMatchForEdit(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Tournament Modal (Admin only) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="p-5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-white" />
                <h3 className="font-extrabold text-base">新しいトーナメント表を作成</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  トーナメント名 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="例: 第2回 メイントーナメント杯"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  概要・意気込み
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="例: エントリー全チームによる勝ち抜き戦"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Select participating teams */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    参加チームを選択 ({selectedTeamIds.length} チーム選択中)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedTeamIds.length === teams.length) {
                        setSelectedTeamIds([]);
                      } else {
                        setSelectedTeamIds(teams.map((t) => t.id));
                      }
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    {selectedTeamIds.length === teams.length ? '全解除' : '全選択'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 p-2 rounded-xl bg-slate-50">
                  {teams.map((team) => {
                    const isChecked = selectedTeamIds.includes(team.id);
                    return (
                      <label
                        key={team.id}
                        className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                          isChecked ? 'bg-indigo-50 border border-indigo-200' : 'bg-white border border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTeamIds([...selectedTeamIds, team.id]);
                              } else {
                                setSelectedTeamIds(selectedTeamIds.filter((id) => id !== team.id));
                              }
                            }}
                            className="rounded-sm text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-bold text-slate-900">{team.name}</span>
                          <span className="text-[10px] text-slate-400">（代表: {team.leaderName}）</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          {team.members.length} 名
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Seed Info Banner for Odd / Unbalanced Team Counts */}
              {(() => {
                const metrics = calculateBracketMetrics(selectedTeamIds.length);
                const isOdd = selectedTeamIds.length % 2 !== 0;
                if (selectedTeamIds.length >= 2 && metrics.seedCount > 0) {
                  return (
                    <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 rounded-xl border border-emerald-300 flex items-start gap-2.5 animate-fade-in shadow-2xs">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-slate-800 leading-relaxed">
                        <span className="font-bold block text-emerald-900 mb-0.5">
                          {isOdd ? `奇数参加（${selectedTeamIds.length} チーム）` : `シード枠適用（${selectedTeamIds.length} チーム）`}：シード枠（不戦勝）が自動追加されます
                        </span>
                        <span>
                          {metrics.bracketSize}枠トーナメント表として作成され、
                          <strong className="text-emerald-700 font-bold px-1 bg-white/80 rounded border border-emerald-200 mx-0.5">
                            {metrics.seedCount} 枠の【シード枠（不戦勝）】
                          </strong>
                          が自動配置されます。シードチームは1回戦不戦勝となり、2回戦へダイレクト進出します。
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Auto random matchups option */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="auto-random"
                  checked={autoRandomize}
                  onChange={(e) => setAutoRandomize(e.target.checked)}
                  className="mt-0.5 rounded-sm text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="auto-random" className="text-xs text-amber-900 cursor-pointer font-medium">
                  <strong className="font-bold block text-amber-950">
                    初期対戦カードをランダムに決定する（推奨）
                  </strong>
                  チェックを入れると、選択したチーム同士の対戦組み合わせが自動的にランダムシャッフルされて作成されます。
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate || selectedTeamIds.length < 2}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  {isSubmittingCreate ? '作成中...' : 'トーナメント表を作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Team Inspect Modal */}
      {selectedTeamPreview && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base">{selectedTeamPreview.name}</h3>
                <p className="text-xs text-slate-400">
                  代表リーダー: {selectedTeamPreview.leaderName} / {selectedTeamPreview.department || '所属なし'}
                </p>
              </div>
              <button
                onClick={() => setSelectedTeamPreview(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
                「{selectedTeamPreview.description}」
              </div>

              <div>
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  メンバー & 4キャラ編成 ({selectedTeamPreview.members.length} 名)
                </span>
                <div className="space-y-2">
                  {selectedTeamPreview.members.map((member, idx) => {
                    const mName = typeof member === 'string' ? member : member.name;
                    const chars = typeof member === 'object' && Array.isArray(member.characters) ? member.characters : [];

                    return (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/90 text-xs">
                        <div className="font-bold text-slate-800 mb-1 flex items-center justify-between">
                          <span>{mName}</span>
                          {typeof member === 'object' && member.isLeader && (
                            <span className="text-[10px] text-amber-700 font-bold">👑 リーダー</span>
                          )}
                        </div>

                        {chars.length > 0 && (
                          <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                            {chars.map((c) => (
                              <div
                                key={c.id || c.slotNumber}
                                className="bg-white p-1 rounded-lg border border-slate-200 text-[10px] truncate"
                              >
                                <span className="font-mono text-[9px] text-slate-400 block">枠{c.slotNumber}</span>
                                <span className="font-bold text-slate-800 truncate block">{c.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setSelectedTeamPreview(null);
                  setActiveTab('teams');
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>チーム一覧画面で詳細を見る</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedTeamPreview(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Tournament Confirmation Modal */}
      {isDeleteModalOpen && activeTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-left">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900 text-base">
                トーナメント表を削除しますか？
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                トーナメント「<strong className="text-slate-800 font-bold">{activeTournament.name}</strong>」を完全に削除します。
              </p>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>注意事項</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-700">
                参加チーム数: {activeTournament.participatingTeamIds.length}チーム / 全{activeTournament.rounds.length}ラウンド。これまでに記録された対戦結果、スコア、進出データはすべて消去されます。この操作は取り消せません。
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isDeletingTournament}
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={isDeletingTournament}
                onClick={handleDeleteTournament}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingTournament ? '削除中...' : '削除を実行する'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Randomize Matchups Modal */}
      {isRandomizeModalOpen && activeTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-left">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Shuffle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900 text-base">
                対戦相手をランダムに決めますか？
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                トーナメント「<strong className="text-slate-800 font-bold">{activeTournament.name}</strong>」の初戦カードをランダムにシャッフルして再抽選します。
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              ※既存の進行状況や対戦勝敗スコア結果はすべて初期状態にリセットされます。
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRandomizeModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirmRandomize}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <Shuffle className="w-4 h-4" />
                <span>シャッフル実行</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
