import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Team, TeamMember, TeamCharacter } from '../types';
import {
  Users,
  Search,
  Trophy,
  Flame,
  Rocket,
  Sparkles,
  Flag,
  Shield,
  Star,
  Zap,
  Crown,
  ChevronRight,
  PlusCircle,
  X,
  UserCheck,
  Maximize2,
  Sword,
  Sparkle,
  Image as ImageIcon,
  CheckCircle2,
  Tag,
} from 'lucide-react';

export const TeamsListView: React.FC = () => {
  const { teams, currentUser, setActiveTab } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [lightboxCharacter, setLightboxCharacter] = useState<{
    character: TeamCharacter;
    memberName: string;
    teamName: string;
  } | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  // Helper for color styles
  const getColorStyles = (color: string) => {
    switch (color) {
      case 'rose':
        return {
          bgGrad: 'from-rose-500 to-rose-600',
          border: 'border-rose-200',
          bgLight: 'bg-rose-50',
          text: 'text-rose-700',
          badge: 'bg-rose-100 text-rose-800',
          accent: 'bg-rose-500',
          borderAccent: 'border-rose-400',
        };
      case 'indigo':
        return {
          bgGrad: 'from-indigo-500 to-indigo-600',
          border: 'border-indigo-200',
          bgLight: 'bg-indigo-50',
          text: 'text-indigo-700',
          badge: 'bg-indigo-100 text-indigo-800',
          accent: 'bg-indigo-500',
          borderAccent: 'border-indigo-400',
        };
      case 'emerald':
        return {
          bgGrad: 'from-emerald-500 to-emerald-600',
          border: 'border-emerald-200',
          bgLight: 'bg-emerald-50',
          text: 'text-emerald-700',
          badge: 'bg-emerald-100 text-emerald-800',
          accent: 'bg-emerald-500',
          borderAccent: 'border-emerald-400',
        };
      case 'amber':
        return {
          bgGrad: 'from-amber-500 to-amber-600',
          border: 'border-amber-200',
          bgLight: 'bg-amber-50',
          text: 'text-amber-700',
          badge: 'bg-amber-100 text-amber-800',
          accent: 'bg-amber-500',
          borderAccent: 'border-amber-400',
        };
      case 'violet':
        return {
          bgGrad: 'from-violet-500 to-violet-600',
          border: 'border-violet-200',
          bgLight: 'bg-violet-50',
          text: 'text-violet-700',
          badge: 'bg-violet-100 text-violet-800',
          accent: 'bg-violet-500',
          borderAccent: 'border-violet-400',
        };
      case 'cyan':
        return {
          bgGrad: 'from-cyan-500 to-cyan-600',
          border: 'border-cyan-200',
          bgLight: 'bg-cyan-50',
          text: 'text-cyan-700',
          badge: 'bg-cyan-100 text-cyan-800',
          accent: 'bg-cyan-500',
          borderAccent: 'border-cyan-400',
        };
      case 'orange':
        return {
          bgGrad: 'from-orange-500 to-orange-600',
          border: 'border-orange-200',
          bgLight: 'bg-orange-50',
          text: 'text-orange-700',
          badge: 'bg-orange-100 text-orange-800',
          accent: 'bg-orange-500',
          borderAccent: 'border-orange-400',
        };
      case 'blue':
      default:
        return {
          bgGrad: 'from-blue-500 to-blue-600',
          border: 'border-blue-200',
          bgLight: 'bg-blue-50',
          text: 'text-blue-700',
          badge: 'bg-blue-100 text-blue-800',
          accent: 'bg-blue-500',
          borderAccent: 'border-blue-400',
        };
    }
  };

  // Helper for team icon
  const renderTeamIcon = (iconName?: string, className = 'w-5 h-5') => {
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
      case 'Flag':
      default:
        return <Flag className={className} />;
    }
  };

  // Safe helper to extract member name string
  const getMemberName = (m: TeamMember | string): string => {
    if (typeof m === 'string') return m;
    return m?.name || 'メンバー';
  };

  // Safe helper to extract member characters
  const getMemberCharacters = (m: TeamMember | string): TeamCharacter[] => {
    if (typeof m === 'object' && m && Array.isArray(m.characters)) {
      return m.characters;
    }
    return [];
  };

  // Total members count across all teams
  const totalMembersCount = useMemo(() => {
    const set = new Set<string>();
    teams.forEach((t) => {
      if (t.leaderName) set.add(t.leaderName);
      if (Array.isArray(t.members)) {
        t.members.forEach((m) => {
          set.add(getMemberName(m));
        });
      }
    });
    return set.size;
  }, [teams]);

  // Filtered teams
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) {
        return selectedColorFilter === 'all' || t.color === selectedColorFilter;
      }

      const matchesBasic =
        t.name.toLowerCase().includes(q) ||
        (t.leaderName && t.leaderName.toLowerCase().includes(q)) ||
        (t.department && t.department.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q));

      const matchesMembers = Array.isArray(t.members) && t.members.some((m) => {
        const name = getMemberName(m).toLowerCase();
        if (name.includes(q)) return true;
        const chars = getMemberCharacters(m);
        return chars.some((c) =>
          c.name.toLowerCase().includes(q) || (c.note && c.note.toLowerCase().includes(q))
        );
      });

      const matchesColor = selectedColorFilter === 'all' || t.color === selectedColorFilter;

      return (matchesBasic || matchesMembers) && matchesColor;
    });
  }, [teams, searchQuery, selectedColorFilter]);

  // Check if current user is in team
  const isUserInTeam = (team: Team) => {
    if (!currentUser) return false;
    if (team.leaderUserId === currentUser.id) return true;
    if (team.leaderName === currentUser.name) return true;
    if (Array.isArray(team.members)) {
      return team.members.some((m) => {
        if (typeof m === 'object' && m) {
          if (m.userId && m.userId === currentUser.id) return true;
          return m.name === currentUser.name || m.name === currentUser.loginId;
        }
        if (typeof m === 'string') {
          return m === currentUser.name || m === currentUser.loginId;
        }
        return false;
      });
    }
    return false;
  };

  // Keep selectedTeam in sync if teams state changes
  const activeSelectedTeam = useMemo(() => {
    if (!selectedTeam) return null;
    return teams.find((t) => t.id === selectedTeam.id) || selectedTeam;
  }, [teams, selectedTeam]);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <Users className="w-4 h-4" />
            <span>参加チーム閲覧</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            イベント参加チーム & 編成キャラクター
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            イベントにエントリーしている各チームの確認が行えます。チームを選択すると、各メンバーおよび<strong className="text-slate-800 font-semibold">使用キャラクター4名（画像・役割情報）</strong>が詳細に確認できます。
          </p>
        </div>

        {/* Stats summary & Admin Quick Link */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[11px] text-slate-500 block">登録チーム数</span>
              <span className="text-base font-bold font-mono text-indigo-600 tabular-nums">
                {teams.length} チーム
              </span>
            </div>
            <div className="h-7 w-px bg-slate-200" />
            <div>
              <span className="text-[11px] text-slate-500 block">参加メンバー総数</span>
              <span className="text-base font-bold font-mono text-emerald-600 tabular-nums">
                {totalMembersCount} 名
              </span>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin-teams')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>チームを作成・編集する</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Color Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="チーム名、リーダー、メンバー名、キャラクター名で検索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Color Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedColorFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedColorFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            すべて ({teams.length})
          </button>
          {[
            { key: 'rose', label: '赤 / ローズ' },
            { key: 'indigo', label: '藍 / インディゴ' },
            { key: 'emerald', label: '緑 / エメラルド' },
            { key: 'amber', label: '金 / アンバー' },
          ].map((col) => {
            const count = teams.filter((t) => t.color === col.key).length;
            if (count === 0) return null;
            return (
              <button
                key={col.key}
                onClick={() => setSelectedColorFilter(col.key)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedColorFilter === col.key
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${getColorStyles(col.key).bgLight} border ${getColorStyles(col.key).border}`} />
                <span>{col.label}</span>
                <span className="text-[10px] opacity-80 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">一致するチームが見つかりませんでした</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            検索キーワードまたはカラーフィルターを変更してお試しください。
          </p>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin-teams')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              新しいチームを作成する
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredTeams.map((team) => {
            const styles = getColorStyles(team.color);
            const userInThisTeam = isUserInTeam(team);
            const members = Array.isArray(team.members) ? team.members : [];

            return (
              <div
                key={team.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group cursor-pointer"
                onClick={() => setSelectedTeam(team)}
              >
                <div>
                  {/* Team Top Header Strip */}
                  <div className={`p-4 bg-gradient-to-r ${styles.bgGrad} text-white flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-xs">
                        {renderTeamIcon(team.icon, 'w-5 h-5')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base tracking-tight leading-snug group-hover:underline">
                            {team.name}
                          </h3>
                          {userInThisTeam && (
                            <span className="inline-flex items-center gap-1 bg-white/90 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                              あなたの所属チーム
                            </span>
                          )}
                        </div>
                        {team.department && (
                          <p className="text-[11px] text-white/80 font-medium">
                            {team.department}
                          </p>
                        )}
                      </div>
                    </div>

                    {typeof team.totalScore === 'number' && (
                      <div className="bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-xl text-right">
                        <span className="text-[10px] text-white/80 block leading-none">獲得スコア</span>
                        <span className="font-mono font-black text-sm text-white">
                          {team.totalScore} pts
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    {/* Slogan / Description */}
                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        チームスローガン
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium line-clamp-2">
                        「{team.description || 'チーム一丸となって全力でイベントを盛り上げます！'}」
                      </p>
                    </div>

                    {/* Leader & Member count info */}
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                          <Crown className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block leading-tight">代表・リーダー</span>
                          <span className="text-xs font-bold text-slate-800">{team.leaderName}</span>
                        </div>
                      </div>

                      <span className="text-[11px] text-slate-500 font-medium">
                        メンバー <strong className="text-slate-900 font-bold">{members.length}</strong> 名 / キャラ <strong className="text-indigo-600 font-bold">{members.length * 4}</strong> 枠
                      </span>
                    </div>

                    {/* Member Cards preview */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-600">
                          登録メンバー & キャラクター編成:
                        </span>
                        <span className="text-[10px] text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                          タップして詳細を確認 <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>

                      <div className="space-y-2">
                        {members.map((member, mIdx) => {
                          const mName = getMemberName(member);
                          const chars = getMemberCharacters(member);
                          const isCurrentUser = currentUser && (mName === currentUser.name || mName === currentUser.loginId);

                          return (
                            <div
                              key={typeof member === 'object' ? member.id : mIdx}
                              className={`p-2.5 rounded-xl border transition-all ${
                                isCurrentUser
                                  ? 'bg-indigo-50/60 border-indigo-200'
                                  : 'bg-slate-50/70 border-slate-200/80'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                                    {mIdx + 1}
                                  </span>
                                  <span className="text-xs font-bold text-slate-800 truncate">
                                    {mName}
                                  </span>
                                  {typeof member === 'object' && member.isLeader && (
                                    <span className="text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded-md shrink-0">
                                      👑 リーダー
                                    </span>
                                  )}
                                  {isCurrentUser && (
                                    <span className="text-[9px] font-black bg-indigo-600 text-white px-1.5 py-0.2 rounded-md shrink-0">
                                      自分
                                    </span>
                                  )}
                                </div>
                                {typeof member === 'object' && member.roleTitle && (
                                  <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">
                                    {member.roleTitle}
                                  </span>
                                )}
                              </div>

                              {/* 4 Mini Character icons preview */}
                              <div className="grid grid-cols-4 gap-1.5">
                                {chars.map((char) => (
                                  <div
                                    key={char.id || char.slotNumber}
                                    className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200/90 text-[10px]"
                                    title={`枠${char.slotNumber}: ${char.name}${char.note ? ` (${char.note})` : ''}`}
                                  >
                                    <div className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                      {char.image ? (
                                        <img
                                          src={char.image}
                                          alt={char.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <Sword className="w-3 h-3 text-slate-400" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1 truncate">
                                      <div className="font-bold text-slate-800 truncate leading-tight">
                                        {char.name}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    登録日: {new Date(team.createdAt).toLocaleDateString('ja-JP')}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTeam(team);
                    }}
                    className="flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <span>チーム詳細・キャラクターを見る</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Team Selection Detail Modal */}
      {activeSelectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className={`p-5 sm:p-6 bg-gradient-to-r ${getColorStyles(activeSelectedTeam.color).bgGrad} text-white relative shrink-0`}>
              <button
                onClick={() => setSelectedTeam(null)}
                className="absolute right-4 top-4 p-2 rounded-xl bg-black/20 hover:bg-black/35 text-white transition-colors cursor-pointer"
                aria-label="閉じる"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start sm:items-center gap-4 pr-10">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-md shrink-0">
                  {renderTeamIcon(activeSelectedTeam.icon, 'w-8 h-8')}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                      {activeSelectedTeam.name}
                    </h2>
                    {isUserInTeam(activeSelectedTeam) && (
                      <span className="inline-flex items-center gap-1 bg-white/90 text-slate-900 text-xs font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        あなたの所属チーム
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-white/90 font-medium">
                    {activeSelectedTeam.department && (
                      <span>ブロック / 部門: <strong>{activeSelectedTeam.department}</strong></span>
                    )}
                    <span>代表: <strong>{activeSelectedTeam.leaderName}</strong></span>
                    {typeof activeSelectedTeam.totalScore === 'number' && (
                      <span className="bg-white/20 px-2 py-0.5 rounded-md font-mono font-bold">
                        スコア: {activeSelectedTeam.totalScore} pts
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
              {/* Slogan */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  チームスローガン・意気込み
                </span>
                <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                  「{activeSelectedTeam.description || 'チーム一丸となって全力でイベントを盛り上げます！'}」
                </p>
              </div>

              {/* Members and their 4 Characters */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      メンバーおよび使用キャラクター一覧
                    </h3>
                    <p className="text-xs text-slate-500">
                      各メンバーが使用する4体のキャラクターと登録画像・役割です。画像をクリックすると拡大表示できます。
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200">
                    メンバー {activeSelectedTeam.members.length} 名
                  </span>
                </div>

                {/* Member Roster List */}
                <div className="space-y-5">
                  {activeSelectedTeam.members.map((member, mIdx) => {
                    const mName = getMemberName(member);
                    const chars = getMemberCharacters(member);
                    const isLeader = typeof member === 'object' ? member.isLeader : mName === activeSelectedTeam.leaderName;
                    const roleTitle = typeof member === 'object' ? member.roleTitle : undefined;
                    const isCurrentUser = currentUser && (mName === currentUser.name || mName === currentUser.loginId);

                    return (
                      <div
                        key={typeof member === 'object' ? member.id : mIdx}
                        className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                          isCurrentUser
                            ? 'bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-400/20'
                            : 'bg-white border-slate-200 shadow-2xs'
                        }`}
                      >
                        {/* Member Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center shadow-xs">
                              {mIdx + 1}
                            </span>
                            <span className="text-base font-extrabold text-slate-900">
                              {mName}
                            </span>

                            {isLeader && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-lg shadow-2xs">
                                <Crown className="w-3.5 h-3.5 text-amber-600" />
                                チーム代表リーダー
                              </span>
                            )}

                            {isCurrentUser && (
                              <span className="text-[11px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-lg">
                                あなた
                              </span>
                            )}
                          </div>

                          {roleTitle && (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
                              <Tag className="w-3 h-3 text-slate-400" />
                              役職: {roleTitle}
                            </span>
                          )}
                        </div>

                        {/* 4 Characters Cards Grid */}
                        <div>
                          <div className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1">
                            <Sword className="w-3.5 h-3.5 text-indigo-500" />
                            <span>使用キャラクター（全4枠）:</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {chars.map((char) => (
                              <div
                                key={char.id || char.slotNumber}
                                className="bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 p-2.5 flex flex-col justify-between transition-colors group/card"
                              >
                                <div>
                                  {/* Slot badge & zoom trigger */}
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-mono">
                                      枠 {char.slotNumber}
                                    </span>
                                    {char.image && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setLightboxCharacter({
                                            character: char,
                                            memberName: mName,
                                            teamName: activeSelectedTeam.name,
                                          })
                                        }
                                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 opacity-80 group-hover/card:opacity-100 cursor-pointer"
                                        title="画像拡大表示"
                                      >
                                        <Maximize2 className="w-3 h-3" />
                                        <span>拡大</span>
                                      </button>
                                    )}
                                  </div>

                                  {/* Character Image container */}
                                  <div
                                    onClick={() => {
                                      if (char.image) {
                                        setLightboxCharacter({
                                          character: char,
                                          memberName: mName,
                                          teamName: activeSelectedTeam.name,
                                        });
                                      }
                                    }}
                                    className={`w-full aspect-square rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center relative mb-2 ${
                                      char.image ? 'cursor-pointer hover:border-indigo-400' : ''
                                    }`}
                                  >
                                    {char.image ? (
                                      <>
                                        <img
                                          src={char.image}
                                          alt={char.name}
                                          className="w-full h-full object-cover transition-transform group-hover/card:scale-105 duration-200"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/10 transition-colors flex items-center justify-center">
                                          <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover/card:opacity-90 drop-shadow" />
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-center p-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-1">
                                          <ImageIcon className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] text-slate-400 block font-medium">
                                          画像未登録
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Character Name */}
                                  <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                    {char.name}
                                  </div>
                                </div>

                                {/* Character Note / Role */}
                                <div className="mt-2 pt-2 border-t border-slate-200/80">
                                  {char.note ? (
                                    <p className="text-[11px] text-indigo-700 bg-indigo-50/80 px-2 py-1 rounded-md font-medium border border-indigo-100/80 truncate">
                                      {char.note}
                                    </p>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">
                                      役割メモなし
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500">
                表示チーム: <strong className="text-slate-800">{activeSelectedTeam.name}</strong>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTeam(null);
                      setActiveTab('admin-teams');
                    }}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    管理者: このチームを編集する
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedTeam(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Character Zoom Modal */}
      {lightboxCharacter && (
        <div
          onClick={() => setLightboxCharacter(null)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-700 overflow-hidden cursor-default animate-scale-up"
          >
            <div className="relative bg-slate-950 flex items-center justify-center p-4 min-h-[300px]">
              <button
                type="button"
                onClick={() => setLightboxCharacter(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {lightboxCharacter.character.image ? (
                <img
                  src={lightboxCharacter.character.image}
                  alt={lightboxCharacter.character.name}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
                />
              ) : (
                <div className="text-white text-xs">画像がありません</div>
              )}
            </div>

            <div className="p-4 bg-white">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md uppercase font-mono">
                  枠 {lightboxCharacter.character.slotNumber}
                </span>
                <span className="text-xs text-slate-500">
                  {lightboxCharacter.teamName} / {lightboxCharacter.memberName}
                </span>
              </div>
              <h4 className="text-base font-extrabold text-slate-900">
                {lightboxCharacter.character.name}
              </h4>
              {lightboxCharacter.character.note && (
                <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  役割: {lightboxCharacter.character.note}
                </p>
              )}
              <button
                type="button"
                onClick={() => setLightboxCharacter(null)}
                className="w-full mt-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
