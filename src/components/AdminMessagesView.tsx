import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { AdminMessage, MessageCategory, User } from '../types';
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Reply,
  Trash2,
  Filter,
  Send,
  X,
  CreditCard,
  Package,
  Ticket,
  HelpCircle,
  MessageCircle,
  AlertCircle,
  Eye,
  CheckCheck,
  Megaphone,
  Trophy,
  UserCheck,
  Users,
  PlusCircle,
  Radio,
} from 'lucide-react';

const CATEGORIES: { id: MessageCategory; label: string; icon: any; color: string }[] = [
  { id: 'announcement', label: '全体アナウンス・案内', icon: Megaphone, color: 'text-rose-700 bg-rose-50 border-rose-200' },
  { id: 'tournament', label: 'トーナメント・対戦連絡', icon: Trophy, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: 'balance', label: '所持金・チャージ', icon: CreditCard, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { id: 'product', label: '商品・在庫・メニュー', icon: Package, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  { id: 'usage', label: '引換・使用方法', icon: Ticket, color: 'text-teal-700 bg-teal-50 border-teal-200' },
  { id: 'question', label: 'システム操作・質問', icon: HelpCircle, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { id: 'other', label: 'その他・ご意見・連絡', icon: MessageCircle, color: 'text-purple-700 bg-purple-50 border-purple-200' },
];

const PRESET_ADMIN_TEMPLATES = [
  {
    title: 'トーナメント対戦相手決定',
    category: 'tournament' as MessageCategory,
    subject: '【トーナメント】対戦組み合わせ・カードが決定しました',
    content: '参加者の皆様へ：トーナメント表タブにて対戦カードを公開いたしました。各チームの編成をご確認の上、試合開始時間までに特設ブースへお集まりください。',
  },
  {
    title: '所持金チャージ完了',
    category: 'balance' as MessageCategory,
    subject: '所持金のチャージ処理が完了いたしました',
    content: 'ご依頼いただいておりました所持金のチャージ（加算）処理を反映いたしました。アプリ画面を更新して残高をご確認ください。',
  },
  {
    title: '試合呼び出し・集合',
    category: 'tournament' as MessageCategory,
    subject: 'まもなく対戦試合が始まります（集合のお願い）',
    content: 'まもなくあなたの所属チームの対戦が始まります。メンバー全員でメインアリーナの試合ブースへお越しください。',
  },
  {
    title: '新商品・フード補充',
    category: 'product' as MessageCategory,
    subject: '【販売情報】新商品・メニューの追加および在庫補充を行いました',
    content: 'フード・ドリンクブースにて人気商品の追加および在庫補充を行いました。購入ページより所持金にてご注文いただけます。',
  },
];

const PRESET_REPLIES = [
  'ご連絡ありがとうございます。所持金チャージの処理を反映いたしました。画面を更新してご確認ください。',
  'お問い合わせありがとうございます。現地インフォメーションブースにて随時ご対応しております。お気軽にお越しください。',
  'ご確認ありがとうございます。商品の追加・在庫の補充を行いましたので、購入ページをご確認ください。',
  'メッセージを確認いたしました。引き続きイベントをお楽しみください。ご不明な点がございましたらお気軽にお声がけください。',
];

export const AdminMessagesView: React.FC = () => {
  const {
    messages,
    users,
    replyMessage,
    sendAdminMessage,
    markMessageAsRead,
    deleteMessage,
    clearAllMessages,
    currentUser,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'replied'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Reply modal state (for user inquiries)
  const [replyingMessage, setReplyingMessage] = useState<AdminMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Send Direct Message modal state (Admin to User)
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [composeRecipientId, setComposeRecipientId] = useState<string>('all');
  const [composeCategory, setComposeCategory] = useState<MessageCategory>('announcement');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [isSubmittingCompose, setIsSubmittingCompose] = useState(false);

  // Delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  // Participants list for recipient dropdown
  const participantUsers = users.filter((u) => u.role !== 'admin');

  // Statistics
  const totalCount = messages.length;
  const unreadCount = messages.filter((m) => m.status === 'unread' && (!m.senderType || m.senderType === 'user')).length;

  // Filter messages
  const filteredMessages = messages.filter((msg) => {
    // Direction filter
    if (directionFilter === 'user' && msg.senderType === 'admin') return false;
    if (directionFilter === 'admin' && msg.senderType !== 'admin') return false;

    // Status filter
    if (statusFilter === 'unread' && msg.status !== 'unread') return false;
    if (statusFilter === 'replied' && msg.status !== 'replied') return false;

    // Category filter
    if (selectedCategory !== 'all' && msg.category !== selectedCategory) return false;

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = msg.userName.toLowerCase().includes(q);
      const matchRecipient = (msg.recipientUserName || '').toLowerCase().includes(q);
      const matchId = (msg.userLoginId || '').toLowerCase().includes(q);
      const matchDept = (msg.userDepartment || '').toLowerCase().includes(q);
      const matchSubject = msg.subject.toLowerCase().includes(q);
      const matchContent = msg.content.toLowerCase().includes(q);
      return matchName || matchRecipient || matchId || matchDept || matchSubject || matchContent;
    }

    return true;
  });

  const handleOpenReplyModal = (msg: AdminMessage) => {
    setReplyingMessage(msg);
    setReplyText(msg.adminReply ? msg.adminReply.content : '');
    if (msg.status === 'unread') {
      markMessageAsRead(msg.id);
    }
  };

  const handleSendReply = async () => {
    if (!replyingMessage || !replyText.trim()) return;
    setIsSendingReply(true);
    await replyMessage(replyingMessage.id, replyText.trim());
    setIsSendingReply(false);
    setReplyingMessage(null);
    setReplyText('');
  };

  // Submit Admin direct message
  const handleSendAdminMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeContent.trim()) return;

    setIsSubmittingCompose(true);
    const success = await sendAdminMessage({
      recipientUserId: composeRecipientId,
      content: composeContent.trim(),
      subject: composeSubject.trim() || undefined,
      category: composeCategory,
    });
    setIsSubmittingCompose(false);

    if (success) {
      setComposeContent('');
      setComposeSubject('');
      setIsComposeModalOpen(false);
    }
  };

  // Apply template
  const handleApplyTemplate = (tpl: typeof PRESET_ADMIN_TEMPLATES[0]) => {
    setComposeSubject(tpl.subject);
    setComposeContent(tpl.content);
    setComposeCategory(tpl.category);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId) {
      await deleteMessage(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const handleConfirmClearAll = async () => {
    await clearAllMessages();
    setIsClearAllModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner / Heading */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              メッセージ・連絡管理
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 bg-rose-500 text-white text-xs font-black rounded-full animate-pulse">
                未読 {unreadCount}件
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            利用者からの問い合わせへの返信に加え、管理者から参加者（全体・個別）への直接メッセージ連絡が可能です。
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {messages.length > 0 && (
            <button
              onClick={() => setIsClearAllModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
              title="メッセージ履歴を全件一括削除"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>履歴を一括削除</span>
            </button>
          )}

          <button
            onClick={() => setIsComposeModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Send className="w-4 h-4" />
            <span>利用者にメッセージを送信</span>
          </button>
        </div>
      </div>

      {/* Filters & Direction toggle */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Direction toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setDirectionFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                directionFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              すべて ({totalCount})
            </button>
            <button
              onClick={() => setDirectionFilter('user')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                directionFilter === 'user'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              利用者からの受信
            </button>
            <button
              onClick={() => setDirectionFilter('admin')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                directionFilter === 'admin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              管理者からの送信連絡
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="送信者・宛先・内容で検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages List */}
      {filteredMessages.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-3">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">一致するメッセージがありません</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            フィルターまたは検索キーワードを変更してお試しください。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((msg) => {
            const isAdminSent = msg.senderType === 'admin';
            const catInfo = CATEGORIES.find((c) => c.id === msg.category) || CATEGORIES[CATEGORIES.length - 1];
            const Icon = catInfo.icon;

            return (
              <div
                key={msg.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  msg.status === 'unread' && !isAdminSent
                    ? 'border-indigo-300 ring-2 ring-indigo-400/20 shadow-xs'
                    : 'border-slate-200 shadow-2xs'
                }`}
              >
                {/* Message Header Strip */}
                <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
                  isAdminSent ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50/70 border-slate-100'
                }`}>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Badge: Sender direction */}
                    {isAdminSent ? (
                      <span className="inline-flex items-center gap-1 bg-indigo-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-lg shadow-2xs">
                        <Megaphone className="w-3 h-3" />
                        管理者から送信
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-slate-800 text-white text-[11px] font-black px-2.5 py-0.5 rounded-lg shadow-2xs">
                        <Users className="w-3 h-3" />
                        利用者から受信
                      </span>
                    )}

                    {/* Category Badge */}
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${catInfo.color}`}>
                      <Icon className="w-3 h-3" />
                      <span>{catInfo.label}</span>
                    </span>

                    {/* Target recipient for admin messages */}
                    {isAdminSent && (
                      <span className="text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        宛先: <strong>{msg.recipientUserName || '全参加者'}</strong>
                      </span>
                    )}

                    {/* Sender name for user messages */}
                    {!isAdminSent && (
                      <span className="text-xs font-bold text-slate-800">
                        {msg.userName}
                        {msg.userLoginId && <span className="text-slate-400 font-normal">（ID: {msg.userLoginId}）</span>}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(msg.createdAt).toLocaleString('ja-JP')}
                    </span>

                    <button
                      onClick={() => setDeleteTargetId(msg.id)}
                      className="flex items-center gap-1 text-slate-400 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer text-xs font-semibold"
                      title="このメッセージを削除"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-[11px] font-bold text-rose-600">削除</span>
                    </button>
                  </div>
                </div>

                {/* Message Content */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 mb-1">
                      {msg.subject}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                      {msg.content}
                    </p>
                  </div>

                  {/* Admin Reply Section (if user inquiry) */}
                  {msg.adminReply && (
                    <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-indigo-800 flex items-center gap-1">
                          <CheckCheck className="w-3.5 h-3.5 text-indigo-600" />
                          管理者返信済 ({msg.adminReply.adminName})
                        </span>
                        <span className="text-indigo-400 font-mono text-[10px]">
                          {new Date(msg.adminReply.repliedAt).toLocaleString('ja-JP')}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-950 whitespace-pre-line font-medium leading-relaxed">
                        {msg.adminReply.content}
                      </p>
                    </div>
                  )}

                  {/* User Reply Section (if user replied to admin message) */}
                  {msg.userReply && (
                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-800 flex items-center gap-1">
                          <Reply className="w-3.5 h-3.5 text-emerald-600" />
                          参加者からの返信あり ({msg.userReply.userName})
                        </span>
                        <span className="text-emerald-500 font-mono text-[10px]">
                          {new Date(msg.userReply.repliedAt).toLocaleString('ja-JP')}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-950 whitespace-pre-line font-medium leading-relaxed">
                        {msg.userReply.content}
                      </p>
                    </div>
                  )}

                  {/* Action row */}
                  {!isAdminSent && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleOpenReplyModal(msg)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        <span>{msg.adminReply ? '返信内容を編集' : 'このメッセージに返信する'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reply Modal */}
      {replyingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base">問い合わせへの返信</h3>
                <p className="text-xs text-white/80">
                  宛先: {replyingMessage.userName}（ID: {replyingMessage.userLoginId}）
                </p>
              </div>
              <button
                onClick={() => setReplyingMessage(null)}
                className="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Original Message quote */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 max-h-32 overflow-y-auto">
                <span className="font-bold text-slate-500 block mb-0.5">受信メッセージ:</span>
                <p className="whitespace-pre-line">{replyingMessage.content}</p>
              </div>

              {/* Reply Text */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  返信メッセージ <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="返信内容を入力してください..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1.5">定型文を挿入:</span>
                <div className="grid grid-cols-1 gap-1.5">
                  {PRESET_REPLIES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReplyText(preset)}
                      className="text-left text-[11px] p-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setReplyingMessage(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={isSendingReply || !replyText.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  {isSendingReply ? '送信中...' : '返信を送信'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compose Admin Direct Message Modal */}
      {isComposeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="p-5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-white" />
                <h3 className="font-extrabold text-base">利用者にメッセージを送信</h3>
              </div>
              <button
                onClick={() => setIsComposeModalOpen(false)}
                className="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendAdminMessage} className="p-5 sm:p-6 space-y-4">
              {/* Recipient Selection */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  宛先 <span className="text-rose-500">*</span>
                </label>
                <select
                  value={composeRecipientId}
                  onChange={(e) => setComposeRecipientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="all">📢 全参加者へ一斉配信（全体アナウンス）</option>
                  <optgroup label="個別参加者への送信">
                    {participantUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        👤 {u.name} (ID: {u.loginId} / 所属: {u.department || '未設定'})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  カテゴリー
                </label>
                <select
                  value={composeCategory}
                  onChange={(e) => setComposeCategory(e.target.value as MessageCategory)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  件名・見出し
                </label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="例: 【トーナメント】対戦組み合わせが決定しました"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Content */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800">
                    メッセージ内容 <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {composeContent.length} / 500文字
                  </span>
                </div>
                <textarea
                  rows={5}
                  required
                  maxLength={500}
                  value={composeContent}
                  onChange={(e) => setComposeContent(e.target.value)}
                  placeholder="参加者へ届ける連絡内容をご入力ください..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              {/* Preset Templates */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                  よく使うテンプレートを挿入:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESET_ADMIN_TEMPLATES.map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="text-left text-[11px] p-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer truncate"
                    >
                      {tpl.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsComposeModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCompose || !composeContent.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingCompose ? '送信中...' : 'メッセージを送信'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Single Confirmation Modal */}
      {deleteTargetId && (() => {
        const targetMsg = messages.find((m) => m.id === deleteTargetId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">メッセージを削除しますか？</h3>
                {targetMsg && (
                  <p className="text-xs text-slate-600 mt-1 font-medium bg-slate-50 p-2 rounded-lg border border-slate-200 truncate">
                    「{targetMsg.subject || targetMsg.content.slice(0, 30)}」
                  </p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">この操作は取り消せません。</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteTargetId(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>削除する</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Clear All Messages Modal */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                メッセージ履歴を一括削除しますか？
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                現在保存されている全 <strong className="text-rose-600 font-bold">{messages.length}件</strong> のメッセージ履歴を完全に削除します。
              </p>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-left text-xs text-rose-800 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>注意事項</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-700">
                参加者からの問い合わせや運営返信、全体連絡を含むすべての履歴が消去されます。この操作は取り消せません。
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>全件削除を実行</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
