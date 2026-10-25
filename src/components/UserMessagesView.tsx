import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  MessageCircle,
  HelpCircle,
  Trash2,
  Sparkles,
  UserCheck,
  Megaphone,
  Inbox,
  Reply,
  CheckCheck,
  AlertCircle,
  Trophy,
  CreditCard,
  Package,
} from 'lucide-react';

interface UserMessagesViewProps {
  onGoToShop?: () => void;
}

export const UserMessagesView: React.FC<UserMessagesViewProps> = ({ onGoToShop }) => {
  const {
    currentUser,
    messages,
    sendMessage,
    markReplyAsRead,
    markAdminMessageAsReadByUser,
    userReplyToAdminMessage,
    deleteMessage,
    userUnreadReplyCount,
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'inbox' | 'compose' | 'history'>('inbox');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Replying to admin message state
  const [replyingAdminMsgId, setReplyingAdminMsgId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [isSendingAdminReply, setIsSendingAdminReply] = useState(false);
  const [deleteTargetMsgId, setDeleteTargetMsgId] = useState<string | null>(null);

  if (!currentUser) return null;

  // Filter messages sent by Admin to this user (or broadcast 'all')
  const adminMessagesForMe = messages.filter((m) => {
    if (m.senderType !== 'admin') return false;
    return m.recipientUserId === currentUser.id || m.recipientUserId === 'all';
  });

  // Filter inquiries sent by the current user
  const mySentInquiries = messages.filter((m) => m.userId === currentUser.id && m.senderType !== 'admin');

  // Count unread admin messages specifically
  const unreadAdminMsgCount = adminMessagesForMe.filter((m) => !m.userReadMessage).length;

  // Handle user submit inquiry to admin
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    const success = await sendMessage(content.trim());
    setIsSubmitting(false);

    if (success) {
      setContent('');
      setActiveSubTab('history');
    }
  };

  // Handle reply back to admin
  const handleSendReplyToAdmin = async (msgId: string) => {
    if (!adminReplyText.trim()) return;
    setIsSendingAdminReply(true);
    await userReplyToAdminMessage(msgId, adminReplyText.trim());
    setIsSendingAdminReply(false);
    setReplyingAdminMsgId(null);
    setAdminReplyText('');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner / Heading */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              メッセージ・運営連絡
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            運営・管理者からの公式アナウンスや個別連絡を確認したり、管理者へ直接問い合わせ・連絡を送信できます。
          </p>
        </div>

        {/* Sub-tab toggle buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start md:self-auto overflow-x-auto">
          {/* Tab 1: Inbox from Admin */}
          <button
            onClick={() => setActiveSubTab('inbox')}
            className={`relative px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'inbox'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>運営からの連絡</span>
            {unreadAdminMsgCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-black rounded-full animate-pulse">
                新着 {unreadAdminMsgCount}
              </span>
            )}
          </button>

          {/* Tab 2: Compose Inquiry */}
          <button
            onClick={() => setActiveSubTab('compose')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'compose'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>管理者へ連絡</span>
          </button>

          {/* Tab 3: Sent Inquiries History */}
          <button
            onClick={() => setActiveSubTab('history')}
            className={`relative px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'history'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>送信履歴 ({mySentInquiries.length})</span>
            {mySentInquiries.some((m) => m.status === 'replied' && !m.userReadReply) && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-black rounded-full animate-pulse">
                返信あり
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 1. SubTab: Inbox from Admin (運営・管理者からの連絡) */}
      {activeSubTab === 'inbox' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-indigo-600" />
              <span>運営・管理者からあなたへのメッセージ一覧</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              合計 {adminMessagesForMe.length} 件
            </span>
          </div>

          {adminMessagesForMe.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">運営からのメッセージはまだありません</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                管理者からアナウンスやトーナメント連絡、所持金チャージの連絡などが届くとここに表示されます。
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {adminMessagesForMe.map((msg) => {
                const isUnread = !msg.userReadMessage;
                const isBroadcast = msg.recipientType === 'all';

                return (
                  <div
                    key={msg.id}
                    className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                      isUnread
                        ? 'border-indigo-300 ring-2 ring-indigo-400/20 shadow-xs'
                        : 'border-slate-200 shadow-2xs'
                    }`}
                  >
                    {/* Header Strip */}
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isUnread && (
                          <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                            未読新着
                          </span>
                        )}

                        {isBroadcast ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
                            <Megaphone className="w-3 h-3 text-indigo-600" />
                            全体アナウンス
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            あなた宛の個別連絡
                          </span>
                        )}

                        <span className="text-xs font-bold text-slate-700">
                          差出人: {msg.userName}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(msg.createdAt).toLocaleString('ja-JP')}
                        </span>

                        {isUnread && (
                          <button
                            onClick={() => markAdminMessageAsReadByUser(msg.id)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                          >
                            既読にする
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <h3 className="text-base font-extrabold text-slate-900">
                        {msg.subject}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                        {msg.content}
                      </p>

                      {/* Display user's reply if user already replied */}
                      {msg.userReply && (
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-emerald-800 flex items-center gap-1">
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                              あなたの返信内容
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

                      {/* Reply form toggle / action */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {isUnread ? '未読メッセージ' : '既読'}
                        </span>

                        {replyingAdminMsgId === msg.id ? (
                          <div className="w-full space-y-2 mt-2">
                            <textarea
                              rows={3}
                              value={adminReplyText}
                              onChange={(e) => setAdminReplyText(e.target.value)}
                              placeholder="管理者への返信内容を入力してください..."
                              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingAdminMsgId(null);
                                  setAdminReplyText('');
                                }}
                                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                              >
                                キャンセル
                              </button>
                              <button
                                type="button"
                                disabled={isSendingAdminReply || !adminReplyText.trim()}
                                onClick={() => handleSendReplyToAdmin(msg.id)}
                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                {isSendingAdminReply ? '送信中...' : '返信を送信'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setReplyingAdminMsgId(msg.id);
                              setAdminReplyText('');
                              if (isUnread) markAdminMessageAsReadByUser(msg.id);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                          >
                            <Reply className="w-3.5 h-3.5" />
                            <span>{msg.userReply ? '返信を追加する' : 'この連絡に返信する'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. SubTab: Compose Inquiry to Admin (管理者への連絡フォーム) */}
      {activeSubTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              管理者への連絡・問い合わせフォーム
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="message-content" className="text-sm font-bold text-slate-800">
                    メッセージ内容 <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400 font-mono">
                    {content.length} / 500文字
                  </span>
                </div>
                <textarea
                  id="message-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="管理者への連絡・質問・所持金チャージ依頼などをご入力ください。&#10;例: 所持金を2,000円分チャージ希望です。現在メインブース付近におります。"
                  rows={6}
                  required
                  maxLength={500}
                  className="w-full p-4 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm placeholder:text-slate-400 leading-relaxed transition-all"
                />
              </div>

              {/* Sender Info Badge */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    送信者: <strong className="text-slate-900">{currentUser.name}</strong>（ID: {currentUser.loginId} / 所属: {currentUser.department}）
                  </span>
                </div>
                <span className="text-slate-400">管理者に直接届きます</span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? '送信中...' : '管理者に送信する'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Col: Tips / Info */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">
              💡 メッセージ機能について
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              運営本部へメッセージを送信すると、管理者の画面に即時届きます。回答があると「送信履歴」に返信が表示されます。
            </p>
            <div className="space-y-2 pt-2 border-t border-slate-200 text-xs text-slate-600">
              <div className="font-bold text-slate-800">よくある問い合わせ例:</div>
              <ul className="list-disc pl-4 space-y-1">
                <li>所持金の現金チャージ依頼</li>
                <li>チケットの引換場所や受付時間について</li>
                <li>購入商品のキャンセル・返金相談</li>
                <li>対戦トーナメントの集合場所確認</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 3. SubTab: Sent Inquiries History (送信履歴) */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-indigo-600" />
              <span>あなたが送信した問い合わせ履歴</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              合計 {mySentInquiries.length} 件
            </span>
          </div>

          {mySentInquiries.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">送信履歴はありません</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                「管理者へ連絡」タブからメッセージを送信すると、履歴と管理者からの返信がここに表示されます。
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mySentInquiries.map((msg) => {
                const hasReply = !!msg.adminReply;
                const isUnreadReply = hasReply && !msg.userReadReply;

                return (
                  <div
                    key={msg.id}
                    className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                      isUnreadReply
                        ? 'border-rose-300 ring-2 ring-rose-400/20 shadow-xs'
                        : 'border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        {hasReply ? (
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isUnreadReply ? 'bg-rose-500 text-white' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            <CheckCheck className="w-3 h-3" />
                            {isUnreadReply ? '返信あり（未読）' : '返信確認済'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            管理者確認中
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono text-[11px]">
                          {new Date(msg.createdAt).toLocaleString('ja-JP')}
                        </span>
                        <button
                          onClick={() => setDeleteTargetMsgId(msg.id)}
                          className="flex items-center gap-1 text-slate-400 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer text-xs"
                          title="この送信履歴を削除"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span className="text-[11px] font-bold text-rose-600">削除</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                        {msg.content}
                      </p>

                      {/* Admin Reply */}
                      {msg.adminReply && (
                        <div className="mt-3 p-4 bg-indigo-50/80 rounded-xl border border-indigo-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                              運営管理者からの回答 ({msg.adminReply.adminName})
                            </span>
                            <span className="text-[10px] text-indigo-400 font-mono">
                              {new Date(msg.adminReply.repliedAt).toLocaleString('ja-JP')}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-indigo-950 whitespace-pre-line leading-relaxed font-medium">
                            {msg.adminReply.content}
                          </p>

                          {isUnreadReply && (
                            <div className="pt-2 flex justify-end">
                              <button
                                onClick={() => markReplyAsRead(msg.id)}
                                className="px-3 py-1 text-xs font-bold bg-white text-indigo-700 hover:bg-indigo-100 rounded-lg border border-indigo-300 transition-colors cursor-pointer"
                              >
                                既読にする
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Delete User Message Confirmation Modal */}
      {deleteTargetMsgId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">問い合わせ履歴を削除しますか？</h3>
              <p className="text-xs text-slate-500 mt-1">この履歴および運営からの返信データが削除されます。</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTargetMsgId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (deleteTargetMsgId) {
                    await deleteMessage(deleteTargetMsgId);
                    setDeleteTargetMsgId(null);
                  }
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>削除する</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
