import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  MessageSquare,
  Send,
  X,
  ExternalLink,
} from 'lucide-react';

interface ContactAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToHistory?: () => void;
}

export const ContactAdminModal: React.FC<ContactAdminModalProps> = ({
  isOpen,
  onClose,
  onNavigateToHistory,
}) => {
  const { currentUser, sendMessage } = useStore();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    const success = await sendMessage(content.trim());
    setIsSubmitting(false);

    if (success) {
      setContent('');
      onClose();
      if (onNavigateToHistory) {
        onNavigateToHistory();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                管理者へメッセージを送信
              </h3>
              <p className="text-xs text-slate-500">
                所持金のチャージ依頼や商品に関するご質問を送信できます
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form (メッセージ内容のみ) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="modal-message-content" className="text-xs font-bold text-slate-800">
                メッセージ内容 <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {content.length} / 500文字
              </span>
            </div>
            <textarea
              id="modal-message-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="管理者への連絡・質問・チャージ依頼などをご入力ください。&#10;例: 所持金を2,000円分チャージ希望です。メインブース付近におります。"
              rows={5}
              required
              maxLength={500}
              className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed transition-all"
            />
          </div>

          {/* Sender Notice */}
          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
            <span>送信者: {currentUser.name} (ID: {currentUser.loginId})</span>
            {onNavigateToHistory && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToHistory();
                }}
                className="text-indigo-600 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
              >
                送信履歴へ
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              閉じる
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? '送信中...' : '送信する'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
