import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, QrCode, Share2, Shield, Info, AlertTriangle, Globe, Send } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const { showToast, currentUser, settings } = useStore();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'guide' | 'message'>('url');

  const isAdmin = currentUser?.role === 'admin';

  // 共有URLは管理者のみ表示。利用者は非表示。
  if (!isOpen || !isAdmin) return null;

  // The official shared app URL in Google AI Studio
  const sharedUrl = 'https://ais-pre-cqkwtnbc3kk423uwmwoly6-569271989937.asia-east1.run.app';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(sharedUrl);
    setCopiedUrl(true);
    showToast('共有用URLをクリップボードにコピーしました', 'success');
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const inviteMessage = `【${settings.appTitle} ご利用案内】
以下のURLよりアクセスし、運営管理者が発行した参加者IDとパスワードでログインしてください。

■ アプリURL:
${sharedUrl}

■ ご利用可能な画面:
・イベント商品購入（フード・ドリンク・グッズ・体験チケットを所持金で決済）
・所持数ページ（購入したチケットやフードの確認・その場での提示・使用）
※参加者ID・パスワードの発行および所持金の設定は運営管理者が行っています。`;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(inviteMessage);
    setCopiedMessage(true);
    showToast('招待用案内文をクリップボードにコピーしました', 'success');
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  // Google Chart API QR Code URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(sharedUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden z-10 border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">製作者以外へのアプリ共有</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                  管理者限定
                </span>
              </div>
              <p className="text-[11px] text-slate-500">外部メンバー・端末へのURL共有とアクセス権限設定</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('url')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'url'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>共有URL・QRコード</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>他者が開けない場合の解決法</span>
          </button>
          <button
            onClick={() => setActiveTab('message')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'message'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>送信用メッセージ</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Tab 1: URL & QR */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  共有用本番URL（外部アクセス用リンク）
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={sharedUrl}
                    className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shrink-0 shadow-sm"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>コピー済</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>コピー</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-3">
                <a
                  href={sharedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200/60"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  新しいタブで開く
                </a>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200/60"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  {showQR ? 'QRを隠す' : 'スマホ用QRコード'}
                </button>
              </div>

              {/* QR Code section */}
              {showQR && (
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in">
                  <p className="text-[11px] text-slate-500 mb-2 font-medium">スマートフォンのカメラで読み取ってアクセス</p>
                  <img
                    src={qrCodeUrl}
                    alt="Shared QR Code"
                    className="w-40 h-40 border border-slate-300 rounded-lg bg-white p-2 shadow-xs"
                  />
                </div>
              )}

              {/* Notice */}
              <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3.5 space-y-1.5 text-xs text-amber-900">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>製作者以外が開いたときに「403エラー」になる場合</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Google AI Studio画面右上の<strong>「Share（共有）」ボタン</strong>から、General accessを<strong>「Anyone with the link（リンクを知っている全員）」</strong>に変更してください。
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Permission Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  なぜ作成者以外が開けないのか？
                </div>
                <p className="text-[11px] text-blue-800">
                  Google AI Studioで作成されたアプリのCloud Run環境は、セキュリティ保護のためデフォルトで作成者のGoogleアカウント（saki.syuri@gmail.com）のみに限定されています。
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-slate-900">他者がアクセスできるようにする2つの方法:</h3>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] flex items-center justify-center font-bold">1</span>
                    AI Studio の「Share」設定（推奨・簡単）
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 pl-1 leading-relaxed">
                    <li>AI Studio画面の右上にある<strong>「Share」</strong>ボタンをクリック</li>
                    <li>「General access」を<strong>「Anyone with the link」</strong>に設定</li>
                    <li>または共有したい同僚のGoogleメールアドレスを追加して招待</li>
                  </ol>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center font-bold">2</span>
                    無料ホスティングへ公開（Google認証なしで全員利用可能）
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    本アプリは静的ビルドに対応しており、GitHub連携またはVercel / Netlify / Cloudflare Pages等へデプロイすることで、Googleアカウントを持たない方でもアクセス可能な専用URL（例: https://my-store.vercel.app）を完全無料で即座に運用できます。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Copy Message */}
          {activeTab === 'message' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  チャット（Slack・Teams・LINE）やメール送信用定型文
                </label>
                <textarea
                  readOnly
                  rows={8}
                  value={inviteMessage}
                  className="w-full font-mono text-xs p-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 select-all focus:outline-none"
                />
              </div>

              <button
                onClick={handleCopyMessage}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                {copiedMessage ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>案内文をコピーしました</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>送信用案内文をクリップボードにコピー</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
