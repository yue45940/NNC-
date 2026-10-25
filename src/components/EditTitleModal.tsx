import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { X, Sliders, Sparkles, Check, RotateCcw, Eye } from 'lucide-react';
import { DEFAULT_APP_SETTINGS } from '../types';

interface EditTitleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditTitleModal: React.FC<EditTitleModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useStore();

  const [appTitle, setAppTitle] = useState(settings.appTitle);
  const [heroBadge, setHeroBadge] = useState(settings.heroBadge);
  const [heroTitle, setHeroTitle] = useState(settings.heroTitle);
  const [heroDescription, setHeroDescription] = useState(settings.heroDescription);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form fields only when modal opens (prevent background polling from overwriting user typing!)
  useEffect(() => {
    if (isOpen) {
      setAppTitle(settings.appTitle);
      setHeroBadge(settings.heroBadge);
      setHeroTitle(settings.heroTitle);
      setHeroDescription(settings.heroDescription);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateSettings({
        appTitle: appTitle.trim() || DEFAULT_APP_SETTINGS.appTitle,
        heroBadge: heroBadge.trim() || DEFAULT_APP_SETTINGS.heroBadge,
        heroTitle: heroTitle.trim() || DEFAULT_APP_SETTINGS.heroTitle,
        heroDescription: heroDescription.trim() || DEFAULT_APP_SETTINGS.heroDescription,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyPreset = (preset: {
    appTitle: string;
    heroBadge: string;
    heroTitle: string;
    heroDescription: string;
  }) => {
    setAppTitle(preset.appTitle);
    setHeroBadge(preset.heroBadge);
    setHeroTitle(preset.heroTitle);
    setHeroDescription(preset.heroDescription);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden z-10 border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-indigo-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                イベント・アプリタイトル設定
              </h2>
              <p className="text-[11px] text-indigo-700 font-medium">
                管理者専用：イベント名、見出し、説明文のカスタマイズ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                クイックプリセット（ワンクリック適用）
              </span>
              <button
                type="button"
                onClick={() => applyPreset(DEFAULT_APP_SETTINGS)}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                初期値に戻す
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    appTitle: '社内サマーフェス 2026',
                    heroBadge: 'サマーフェス限定スマートストア',
                    heroTitle: '屋台フード・クラフトドリンク・限定グッズを所持金でキャッシュレス決済',
                    heroDescription:
                      '【サマーフェスルール】\n・会場内の屋台や物販ブースで手元から即座に決済！\n・購入したチケットやドリンク引換券は所持数ページからその場で提示・使用できます。',
                  })
                }
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 text-left transition-all text-xs"
              >
                <span className="font-bold text-slate-800 block text-[11px]">🍧 サマーフェス仕様</span>
                <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">屋台フード・ドリンク・グッズ</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    appTitle: '秋の社内マルシェ & カフェ',
                    heroBadge: '秋の収穫マルシェ限定キオスク',
                    heroTitle: '特製スイーツ・焼き菓子・焙煎コーヒーを所持金でお買い物',
                    heroDescription:
                      '【マルシェ利用案内】\n・参加者の手元端末からいつでもワンタップ注文。\n・美味しい軽食や限定アイテムをキャッシュレスで購入できます。',
                  })
                }
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 text-left transition-all text-xs"
              >
                <span className="font-bold text-slate-800 block text-[11px]">🥐 マルシェ・カフェ仕様</span>
                <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">特製スイーツ・コーヒー</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    appTitle: '社員親睦レクリエーション大会',
                    heroBadge: '親睦イベント公式ストア',
                    heroTitle: 'アクティビティ参加券・ドリンク・軽食を所持金でスマート引換',
                    heroDescription:
                      '【大会ルール & 利用手順】\n・チーム対抗イベントをさらに楽しむ！\n・体験チケットや豪華抽選券も手元の所持金からリアルタイムに購入可能です。',
                  })
                }
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 text-left transition-all text-xs"
              >
                <span className="font-bold text-slate-800 block text-[11px]">🎯 社内レクリエーション仕様</span>
                <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">参加券・ドリンク・抽選券</span>
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {/* 1. App Title (Brand name) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                アプリ・イベント名（ヘッダーロゴ・ブラウザタイトル） *
              </label>
              <input
                type="text"
                required
                value={appTitle}
                onChange={(e) => setAppTitle(e.target.value)}
                placeholder="例: SmartStore / 社内サマーフェス 2026"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                ヘッダー上部のブランド表示、ログイン画面、ブラウザのタブにリアルタイム反映されます。
              </p>
            </div>

            {/* 2. Hero Badge */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                バッジ・タグラベル
              </label>
              <input
                type="text"
                value={heroBadge}
                onChange={(e) => setHeroBadge(e.target.value)}
                placeholder="例: イベント専用スマート決済アプリ / 2026年度フェス限定ストア"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* 3. Hero Main Title */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                ヒーローメイン見出し（特大タイトル） *
              </label>
              <input
                type="text"
                required
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="例: イベント限定フード・ドリンク・グッズを所持金でキャッシュレス決済"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-extrabold"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                購入ページのバナー中央に最も大きく表示されるメインタイトルです。
              </p>
            </div>

            {/* 4. Rule Description (ルール説明 - 改行対応) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-800">
                  ルール説明（改行可）
                </label>
                <span className="text-[10px] text-indigo-600 font-medium">
                  Enterキーで改行できます
                </span>
              </div>
              <textarea
                rows={4}
                value={heroDescription}
                onChange={(e) => setHeroDescription(e.target.value)}
                placeholder={"【イベントルール・注意事項】\n・配布された所持金でフードやグッズを注文\n・購入した商品は「所持数ページ」から提示して受け取り\n・残高不足時は管理者にチャージを依頼してください"}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                購入ページのバナー見出し下に表示されるイベントのルール・注意事項・購入手順です。改行がそのまま反映されます。
              </p>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              リアルタイムプレビュー表示
            </span>
            <div className="rounded-2xl bg-slate-900 text-white p-4 sm:p-5 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                <span className="text-sm font-extrabold text-white tracking-tight">
                  {appTitle || 'SmartStore'}
                </span>
                <span className="text-[10px] text-slate-400 px-2 py-0.5 bg-white/10 rounded">
                  イベントキオスク
                </span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 block">
                {heroBadge || 'イベント専用スマート決済アプリ'}
              </span>
              <h4 className="text-sm sm:text-base font-extrabold text-white mt-1 leading-snug">
                {heroTitle || 'イベント限定フード・ドリンク・グッズを所持金でキャッシュレス決済'}
              </h4>
              <div className="text-[11px] text-slate-300 mt-1.5 leading-relaxed whitespace-pre-line max-h-36 overflow-y-auto">
                {heroDescription || '【イベントルール・注意事項】\n・イベント会場の手元スマホやキオスクからワンタップで購入\n・購入した商品は所持数ページからその場で提示・使用できます'}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? '設定を保存中...' : '設定を保存して反映する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
