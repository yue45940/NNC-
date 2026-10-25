import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Team, TeamMember, TeamCharacter } from '../types';
import { createDefaultCharacters, readLocalImageFile } from '../utils/teamUtils';
import { optimizeLocalImage, formatBytes } from '../utils/imageOptimizer';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Flame,
  Rocket,
  Sparkles,
  Trophy,
  Flag,
  Shield,
  Star,
  Zap,
  Crown,
  X,
  Eye,
  Upload,
  Image as ImageIcon,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';

export const AdminTeamsView: React.FC = () => {
  const { teams, users, addTeam, updateTeam, deleteTeam, setActiveTab, showToast } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('indigo');
  const [icon, setIcon] = useState('Flame');
  const [totalScore, setTotalScore] = useState<string>('0');
  const [members, setMembers] = useState<TeamMember[]>([]);

  // Active expanded member index in modal (for accordion editing)
  const [expandedMemberIndex, setExpandedMemberIndex] = useState<number | null>(0);

  // Custom new member name input
  const [newMemberNameInput, setNewMemberNameInput] = useState('');

  // Available colors
  const COLOR_OPTIONS = [
    { key: 'rose', label: 'レッド / 赤', bg: 'bg-rose-500', text: 'text-rose-600' },
    { key: 'indigo', label: 'インディゴ / 藍', bg: 'bg-indigo-500', text: 'text-indigo-600' },
    { key: 'emerald', label: 'グリーン / 緑', bg: 'bg-emerald-500', text: 'text-emerald-600' },
    { key: 'amber', label: 'ゴールド / 金', bg: 'bg-amber-500', text: 'text-amber-600' },
    { key: 'violet', label: 'パープル / 紫', bg: 'bg-violet-500', text: 'text-violet-600' },
    { key: 'cyan', label: 'シアン / 水色', bg: 'bg-cyan-500', text: 'text-cyan-600' },
    { key: 'orange', label: 'オレンジ / 橙', bg: 'bg-orange-500', text: 'text-orange-600' },
    { key: 'blue', label: 'ブルー / 青', bg: 'bg-blue-500', text: 'text-blue-600' },
  ];

  // Available icons
  const ICON_OPTIONS = [
    { key: 'Flame', label: '炎 / 情熱', component: Flame },
    { key: 'Rocket', label: 'ロケット / 先進', component: Rocket },
    { key: 'Sparkles', label: 'スター / 煌めき', component: Sparkles },
    { key: 'Trophy', label: 'トロフィー / 栄冠', component: Trophy },
    { key: 'Flag', label: 'フラッグ / 旗手', component: Flag },
    { key: 'Shield', label: 'シールド / 結束', component: Shield },
    { key: 'Star', label: '星 / チャンプ', component: Star },
    { key: 'Zap', label: '稲妻 / スピード', component: Zap },
  ];

  const filteredTeams = teams.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.leaderName.toLowerCase().includes(q) ||
      (t.department && t.department.toLowerCase().includes(q)) ||
      t.members.some(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.characters.some((c) => c.name.toLowerCase().includes(q))
      )
    );
  });

  const openAddModal = () => {
    setName('');
    setDepartment('');
    setDescription('');
    setColor('indigo');
    setIcon('Flame');
    setTotalScore('0');

    // Default 1 member with 4 character slots
    const initialMember: TeamMember = {
      id: `mem-${Date.now()}-1`,
      name: '第1走者 / エース',
      isLeader: true,
      roleTitle: 'リーダー',
      characters: createDefaultCharacters('メンバー1'),
    };
    setMembers([initialMember]);
    setExpandedMemberIndex(0);
    setNewMemberNameInput('');
    setEditingTeam(null);
    setIsModalOpen(true);
  };

  const openEditModal = (t: Team) => {
    setEditingTeam(t);
    setName(t.name);
    setDepartment(t.department || '');
    setDescription(t.description || '');
    setColor(t.color || 'indigo');
    setIcon(t.icon || 'Flame');
    setTotalScore((t.totalScore || 0).toString());

    // Ensure all members have 4 character slots
    const normalized = t.members.map((m, mIdx) => {
      const chars = [...(m.characters || [])];
      while (chars.length < 4) {
        const slotNum = chars.length + 1;
        chars.push({
          id: `char-${mIdx}-${slotNum}`,
          slotNumber: slotNum,
          name: '',
          image: '',
        });
      }
      return {
        ...m,
        characters: chars.slice(0, 4),
      };
    });

    setMembers(normalized);
    setExpandedMemberIndex(0);
    setNewMemberNameInput('');
    setIsModalOpen(true);
  };

  // Add new member
  const handleAddNewMember = (memberName: string, userId?: string) => {
    const trimmed = memberName.trim();
    if (!trimmed) return;

    const newMem: TeamMember = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed,
      userId,
      isLeader: members.length === 0,
      roleTitle: members.length === 0 ? 'リーダー' : 'メンバー',
      characters: createDefaultCharacters(trimmed),
    };

    setMembers([...members, newMem]);
    setExpandedMemberIndex(members.length);
    setNewMemberNameInput('');
  };

  // Remove member
  const handleRemoveMember = (memberId: string) => {
    const updated = members.filter((m) => m.id !== memberId);
    if (updated.length > 0 && !updated.some((m) => m.isLeader)) {
      updated[0].isLeader = true;
      updated[0].roleTitle = 'リーダー';
    }
    setMembers(updated);
    setExpandedMemberIndex(updated.length > 0 ? 0 : null);
  };

  // Set member as leader
  const handleSetLeader = (memberId: string) => {
    setMembers(
      members.map((m) => ({
        ...m,
        isLeader: m.id === memberId,
        roleTitle: m.id === memberId ? 'リーダー' : m.roleTitle === 'リーダー' ? 'メンバー' : m.roleTitle,
      }))
    );
  };

  // Update member name or role
  const handleUpdateMemberField = (memberId: string, field: 'name' | 'roleTitle', value: string) => {
    setMembers(
      members.map((m) => (m.id === memberId ? { ...m, [field]: value } : m))
    );
  };

  // Update character slot
  const handleUpdateCharacter = (
    memberId: string,
    slotNumber: number,
    field: keyof TeamCharacter,
    value: any
  ) => {
    setMembers(
      members.map((m) => {
        if (m.id !== memberId) return m;
        const nextChars = m.characters.map((c) =>
          c.slotNumber === slotNumber ? { ...c, [field]: value } : c
        );
        return { ...m, characters: nextChars };
      })
    );
  };

  // Handle local image file upload for character
  const handleCharacterImageUpload = async (
    memberId: string,
    slotNumber: number,
    file: File
  ) => {
    try {
      showToast('画像を圧縮・最適化中...', 'info');
      const res = await optimizeLocalImage(file, {
        maxWidth: 480,
        maxHeight: 480,
        quality: 0.82,
        targetMaxBytes: 40 * 1024,
      });
      handleUpdateCharacter(memberId, slotNumber, 'image', res.dataUrl);
      showToast(
        `キャラクター画像を最適化しました (${formatBytes(res.originalSizeBytes)} → ${formatBytes(res.compressedSizeBytes)} / ${res.reductionRatio}%削減)`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || '画像の読み込みに失敗しました', 'error');
    }
  };

  // Save Team
  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      showToast('チーム名を入力してください', 'error');
      return;
    }
    if (members.length === 0) {
      showToast('少なくとも1名のメンバーを登録してください', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const leader = members.find((m) => m.isLeader) || members[0];
      const parsedScore = parseInt(totalScore, 10);
      const scoreVal = isNaN(parsedScore) ? 0 : parsedScore;

      // Ensure all members have 4 characters
      const finalMembers = members.map((m, mIdx) => {
        const chars: TeamCharacter[] = m.characters.map((c, cIdx) => ({
          id: c.id || `char-${mIdx}-${cIdx + 1}`,
          slotNumber: c.slotNumber || cIdx + 1,
          name: c.name.trim() || `使用キャラ ${cIdx + 1}`,
          image: c.image || '',
          note: c.note || '',
        }));
        while (chars.length < 4) {
          const slotNum = chars.length + 1;
          chars.push({
            id: `char-${mIdx}-${slotNum}`,
            slotNumber: slotNum,
            name: `使用キャラ ${slotNum}`,
            image: '',
          });
        }
        return {
          ...m,
          isLeader: m.id === leader.id,
          characters: chars.slice(0, 4),
        };
      });

      if (editingTeam) {
        await updateTeam(editingTeam.id, {
          name: name.trim(),
          leaderName: leader.name,
          leaderUserId: leader.userId,
          department: department.trim() || undefined,
          description: description.trim() || '一致団結してイベントを盛り上げます！',
          color,
          icon,
          members: finalMembers,
          totalScore: scoreVal,
        });
        setEditingTeam(null);
        setIsModalOpen(false);
      } else {
        await addTeam({
          name: name.trim(),
          leaderName: leader.name,
          leaderUserId: leader.userId,
          department: department.trim() || undefined,
          description: description.trim() || '一致団結してイベントを盛り上げます！',
          color,
          icon,
          members: finalMembers,
          totalScore: scoreVal,
        });
        setIsModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderIconComponent = (iconKey?: string, className = 'w-4 h-4') => {
    const item = ICON_OPTIONS.find((i) => i.key === iconKey) || ICON_OPTIONS[0];
    const Comp = item.component;
    return <Comp className={className} />;
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <Users className="w-4 h-4" />
            <span>参加チーム作成・編成管理（管理者専用）</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            参加チーム・メンバー・使用キャラクター管理
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            チーム名、チームメンバー、各メンバーの使用キャラクター（各4キャラ）およびローカル画像の登録・編集が行えます。登録した内容は利用者の「参加チーム閲覧」画面に反映されます。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('teams')}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
            title="利用者が閲覧するチーム一覧・キャラクター画面を確認"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>利用者向け閲覧画面へ</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>新規チームを作成する</span>
          </button>
        </div>
      </div>

      {/* Search and Count */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="チーム名、メンバー名、キャラクター名で検索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          登録済み: <strong className="text-slate-900 font-bold">{filteredTeams.length}</strong> チーム
        </span>
      </div>

      {/* Teams Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">チーム情報</th>
                <th className="px-4 py-3.5">代表リーダー</th>
                <th className="px-4 py-3.5">メンバーと使用キャラクター (各4キャラ)</th>
                <th className="px-4 py-3.5 text-center">スコア</th>
                <th className="px-6 py-3.5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeams.map((team) => {
                const colorObj = COLOR_OPTIONS.find((c) => c.key === team.color) || COLOR_OPTIONS[0];

                return (
                  <tr key={team.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Team Name, Icon & Slogan */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${colorObj.bg} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                          {renderIconComponent(team.icon, 'w-5 h-5')}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm leading-snug">{team.name}</p>
                          {team.department && (
                            <span className="inline-block bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px] font-medium mt-0.5">
                              {team.department}
                            </span>
                          )}
                          <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                            {team.description || 'スローガン未設定'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Leader */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{team.leaderName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        メンバー計 {team.members.length} 名
                      </span>
                    </td>

                    {/* Members & Characters preview */}
                    <td className="px-4 py-4">
                      <div className="space-y-2 max-w-md">
                        {team.members.map((member) => (
                          <div key={member.id} className="bg-slate-50 p-2 rounded-lg border border-slate-200/70">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                                {member.isLeader && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
                                {member.name}
                              </span>
                              <span className="text-[10px] text-indigo-600 font-semibold">
                                4キャラ登録済み
                              </span>
                            </div>

                            {/* 4 Character Slots Preview */}
                            <div className="grid grid-cols-4 gap-1.5">
                              {member.characters.slice(0, 4).map((char, cIdx) => (
                                <div
                                  key={cIdx}
                                  className="bg-white p-1 rounded border border-slate-200 flex items-center gap-1 overflow-hidden"
                                  title={`${char.slotNumber}. ${char.name || '未設定'}`}
                                >
                                  {char.image ? (
                                    <img
                                      src={char.image}
                                      alt={char.name}
                                      className="w-4 h-4 rounded object-cover shrink-0"
                                    />
                                  ) : (
                                    <div className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center text-[8px] text-slate-400 shrink-0">
                                      {cIdx + 1}
                                    </div>
                                  )}
                                  <span className="text-[10px] text-slate-700 truncate font-medium">
                                    {char.name || `キャラ${cIdx + 1}`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Score */}
                    <td className="px-4 py-4 text-center font-mono font-bold text-sm text-slate-900 tabular-nums">
                      {team.totalScore || 0} pts
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(team)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="チーム編集"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTeamToDelete(team)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="チーム削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Team Modal with 4-Character slots and local image upload */}
      {(isModalOpen || editingTeam) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingTeam ? `チーム「${editingTeam.name}」の編集` : '参加チームの新規作成・メンバーキャラクター登録'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    チーム名、メンバー、および各メンバーの使用キャラクター4体と画像を登録します
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTeam(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTeam} className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* SECTION 1: チーム基本情報 */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  1. チーム基本情報
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      チーム名 *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="例: レッドフェニックス / 開発部ドリームチーム"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      所属・ブロック（任意）
                    </label>
                    <input
                      type="text"
                      placeholder="例: 営業本部 / Aブロック"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* カラー & アイコン */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      チームカラー *
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {COLOR_OPTIONS.map((col) => (
                        <button
                          key={col.key}
                          type="button"
                          onClick={() => setColor(col.key)}
                          className={`p-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                            color === col.key
                              ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full ${col.bg}`} />
                          <span className="text-[10px] font-bold text-slate-700">{col.key}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      シンボルアイコン *
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {ICON_OPTIONS.map((ic) => {
                        const IconComp = ic.component;
                        return (
                          <button
                            key={ic.key}
                            type="button"
                            onClick={() => setIcon(ic.key)}
                            className={`p-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                              icon === ic.key
                                ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 text-indigo-600'
                                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                            }`}
                          >
                            <IconComp className="w-4 h-4" />
                            <span className="text-[10px] font-bold">{ic.key}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    スローガン・意気込み
                  </label>
                  <input
                    type="text"
                    placeholder="例: 全員で優勝目指して一致団結！情熱の赤で会場を最高に盛り上げます！"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* SECTION 2: メンバー編成 & 各メンバーの4キャラ設定 */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <span>2. チームメンバー & 使用キャラクター（各4キャラ）</span>
                      <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {members.length} 名登録
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      各メンバーごとに4体の使用キャラクターを登録し、ローカルから画像を設定できます
                    </p>
                  </div>
                </div>

                {/* Quick Add from Registered Users / Custom Input */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    メンバーの追加:
                  </span>

                  {/* Registered Users Click-to-Add */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-slate-400">登録ユーザーから追加:</span>
                    {users.map((u) => {
                      const isAdded = members.some((m) => m.name === u.name || m.userId === u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            if (!isAdded) handleAddNewMember(u.name, u.id);
                          }}
                          disabled={isAdded}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                            isAdded
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-white hover:bg-indigo-50 text-slate-700 border border-slate-200 hover:border-indigo-300 cursor-pointer'
                          }`}
                        >
                          {isAdded && <Check className="w-3 h-3 text-emerald-600" />}
                          <span>{u.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Free Text Input */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                    <input
                      type="text"
                      placeholder="外部メンバー名を入力して追加 (例: 渡辺 蓮)"
                      value={newMemberNameInput}
                      onChange={(e) => setNewMemberNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewMember(newMemberNameInput);
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddNewMember(newMemberNameInput)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
                    >
                      メンバー追加
                    </button>
                  </div>
                </div>

                {/* Member List with 4 Characters Accordion */}
                <div className="space-y-3">
                  {members.map((member, mIdx) => {
                    const isExpanded = expandedMemberIndex === mIdx;

                    return (
                      <div
                        key={member.id}
                        className={`border rounded-xl transition-all overflow-hidden bg-white ${
                          member.isLeader ? 'border-amber-300 shadow-xs' : 'border-slate-200'
                        }`}
                      >
                        {/* Member Header Bar */}
                        <div
                          className={`px-4 py-3 flex items-center justify-between cursor-pointer ${
                            member.isLeader ? 'bg-amber-50/60' : 'bg-slate-50/80 hover:bg-slate-100/60'
                          }`}
                          onClick={() => setExpandedMemberIndex(isExpanded ? null : mIdx)}
                        >
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetLeader(member.id);
                              }}
                              className={`p-1 rounded-md transition-colors ${
                                member.isLeader
                                  ? 'text-amber-600 bg-amber-100 hover:bg-amber-200'
                                  : 'text-slate-300 hover:text-amber-500'
                              }`}
                              title={member.isLeader ? '代表リーダーです' : '代表リーダーに指定'}
                            >
                              <Crown className="w-4 h-4" />
                            </button>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs">{member.name}</span>
                                {member.isLeader && (
                                  <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded">
                                    👑 リーダー
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500">
                                登録キャラ: {member.characters.filter((c) => c.name.trim()).length}/4枠
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              title="メンバーから削除"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedMemberIndex(isExpanded ? null : mIdx)}
                              className="p-1 text-slate-400 hover:text-slate-700"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Member 4-Characters Configuration */}
                        {isExpanded && (
                          <div className="p-4 bg-white border-t border-slate-100 space-y-4">
                            {/* Member Name and Role Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                  メンバー名
                                </label>
                                <input
                                  type="text"
                                  value={member.name}
                                  onChange={(e) => handleUpdateMemberField(member.id, 'name', e.target.value)}
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                  役割・ロール名（任意）
                                </label>
                                <input
                                  type="text"
                                  placeholder="例: メインアタッカー / 司令塔"
                                  value={member.roleTitle || ''}
                                  onChange={(e) => handleUpdateMemberField(member.id, 'roleTitle', e.target.value)}
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                            </div>

                            {/* 4 CHARACTER SLOTS */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                  <span>使用キャラクター 4キャラ登録</span>
                                  <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                    スロット 1〜4
                                  </span>
                                </label>
                                <span className="text-[10px] text-slate-400">
                                  ※各枠の「ローカルから画像」でPCやスマホの画像ファイルを直接挿入できます
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {member.characters.slice(0, 4).map((char, slotIdx) => {
                                  const slotNum = slotIdx + 1;
                                  const fileInputId = `file-${member.id}-slot-${slotNum}`;

                                  return (
                                    <div
                                      key={slotIdx}
                                      className="p-3 bg-slate-50/90 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2.5"
                                    >
                                      {/* Slot Label */}
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider bg-white px-1.5 py-0.5 rounded border border-indigo-100">
                                          キャラ {slotNum}
                                        </span>
                                        {char.image && (
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateCharacter(member.id, slotNum, 'image', '')}
                                            className="text-[10px] text-rose-500 hover:text-rose-700 underline"
                                          >
                                            画像解除
                                          </button>
                                        )}
                                      </div>

                                      {/* Character Image Thumbnail & Local File Input */}
                                      <div className="flex flex-col items-center">
                                        <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-2xs group flex items-center justify-center">
                                          {char.image ? (
                                            <img
                                              src={char.image}
                                              alt={char.name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                                              <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                                              <span className="text-[9px] leading-tight">画像なし</span>
                                            </div>
                                          )}

                                          {/* Hover Overlay with Change Button */}
                                          <label
                                            htmlFor={fileInputId}
                                            className="absolute inset-0 bg-black/50 text-white text-[10px] font-bold flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                          >
                                            <Upload className="w-4 h-4 mb-0.5" />
                                            <span>画像変更</span>
                                          </label>
                                        </div>

                                        {/* Hidden File Input for local image selection */}
                                        <input
                                          id={fileInputId}
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              handleCharacterImageUpload(member.id, slotNum, file);
                                            }
                                          }}
                                          className="hidden"
                                        />

                                        {/* Local File Insert Button */}
                                        <label
                                          htmlFor={fileInputId}
                                          className="mt-2 w-full text-center py-1 px-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[10px] font-semibold text-slate-700 cursor-pointer transition-colors shadow-2xs flex items-center justify-center gap-1"
                                        >
                                          <Upload className="w-3 h-3 text-indigo-600" />
                                          <span>{char.image ? '画像を変更' : 'ローカルから画像挿入'}</span>
                                        </label>
                                      </div>

                                      {/* Character Name Input */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                          キャラクター名 *
                                        </label>
                                        <input
                                          type="text"
                                          placeholder={`例: キャラクター${slotNum}`}
                                          value={char.name}
                                          onChange={(e) =>
                                            handleUpdateCharacter(member.id, slotNum, 'name', e.target.value)
                                          }
                                          className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                                        />
                                      </div>

                                      {/* Character Note Input */}
                                      <div>
                                        <input
                                          type="text"
                                          placeholder="ロール/補足 (例: メイン)"
                                          value={char.note || ''}
                                          onChange={(e) =>
                                            handleUpdateCharacter(member.id, slotNum, 'note', e.target.value)
                                          }
                                          className="w-full px-2 py-0.5 text-[10px] rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-600"
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Score */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  獲得得点・初期スコア（任意）
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={totalScore}
                  onChange={(e) => setTotalScore(e.target.value)}
                  className="w-32 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTeam(null);
                  }}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  {isSubmitting ? '保存中...' : editingTeam ? '変更を保存する' : 'チームとキャラクターを登録する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {teamToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">チームの削除確認</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                参加チーム「<span className="font-bold text-slate-900">{teamToDelete.name}</span>」（メンバー: {teamToDelete.members.length}名）をシステムから完全に削除しますか？<br />
                登録されたキャラクター情報もすべて消去されます。この操作は取り消せません。
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTeamToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteTeam(teamToDelete.id);
                    setTeamToDelete(null);
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  削除する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
