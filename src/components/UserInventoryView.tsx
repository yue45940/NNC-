import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { UserInventoryItem } from '../types';
import { Package, Utensils, ShoppingBag, ArrowRight, X, History, Zap } from 'lucide-react';
import { SpellSpeedBadge } from './SpellSpeedBadge';

interface UserInventoryViewProps {
  onGoToShop: () => void;
}

export const UserInventoryView: React.FC<UserInventoryViewProps> = ({ onGoToShop }) => {
  const { currentUser, getUserInventory, useItem, setActiveTab, products, usageLogs } = useStore();

  // Item to consume modal state
  const [consumingItem, setConsumingItem] = useState<UserInventoryItem | null>(null);
  const [consumeQuantity, setConsumeQuantity] = useState(1);
  const [consumeNote, setConsumeNote] = useState('');

  if (!currentUser) return null;

  const userInventory = getUserInventory(currentUser.id);
  const availableItems = userInventory.filter((item) => item.quantity > 0);
  const totalOwnedCount = availableItems.reduce((sum, item) => sum + item.quantity, 0);
  const myRecentLogs = usageLogs.filter((l) => l.userId === currentUser.id).slice(0, 3);

  const openConsumeModal = (item: UserInventoryItem) => {
    setConsumingItem(item);
    setConsumeQuantity(1);
    setConsumeNote('');
  };

  const liveProduct = consumingItem ? products.find((p) => p.id === consumingItem.productId) : null;
  const isMemoEnabled = consumingItem
    ? consumingItem.enableUsageMemo !== undefined
      ? consumingItem.enableUsageMemo
      : liveProduct?.enableUsageMemo === true
    : false;

  const handleConfirmConsume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumingItem) return;

    useItem(consumingItem.productId, consumeQuantity, isMemoEnabled ? consumeNote.trim() || undefined : undefined);
    setConsumingItem(null);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <Package className="w-4 h-4" />
            <span>所持数ページ (所持アイテム・使用管理)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            {currentUser.name} さんの所持商品一覧
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            イベントで購入したフード・ドリンクやチケット、限定グッズの所持数を確認し、手元のアイテムをその場で「使用・引換」できます
          </p>
        </div>

        {/* User stats */}
        <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
          <div>
            <span className="text-[11px] text-slate-500 block">現在の所持金</span>
            <span className="text-base font-bold font-mono text-emerald-600 tabular-nums">
              ¥{currentUser.balance.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">※管理者のみ変更可能</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-[11px] text-slate-500 block">現在所持数</span>
            <span className="text-base font-bold font-mono text-indigo-600 tabular-nums">
              {totalOwnedCount} 点
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">使用可能アイテム</span>
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-bold text-slate-700">
          所持中の商品一覧 ({availableItems.length} 種類)
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('usage')}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/80 px-3.5 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Utensils className="w-3.5 h-3.5 text-indigo-600" />
            <span>マイ使用履歴</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>購入履歴・明細</span>
          </button>

          <button
            onClick={onGoToShop}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>商品購入ページ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Available Items List */}
      {availableItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-3">
            <Package className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">現在所持している商品はありません</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            購入ページから商品を購入すると、このページに所持数として追加され、いつでも使用できるようになります。
          </p>
          <button
            onClick={onGoToShop}
            className="mt-5 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            商品購入ページへ進む
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {item.productName}
                    </h3>
                    {(() => {
                      const speed = item.spellSpeed ?? products.find((p) => p.id === item.productId)?.spellSpeed;
                      return speed !== undefined && speed !== null && String(speed).trim() !== '' ? (
                        <SpellSpeedBadge speed={speed} size="sm" />
                      ) : null;
                    })()}
                  </div>

                  {/* Owned Quantity Display */}
                  <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                    <span className="text-xs font-medium">所持数:</span>
                    <span className="text-base font-extrabold font-mono tabular-nums text-emerald-700">
                      {item.quantity}
                    </span>
                    <span className="text-xs">点</span>
                  </div>
                </div>

              {/* Card Bottom / Action */}
              <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  累計獲得: {item.totalAcquired}点
                </span>

                <button
                  onClick={() => openConsumeModal(item)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-lg transition-all shadow-xs"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  使用する
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Usage History Preview */}
      {myRecentLogs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Utensils className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-800">
                最近の使用・引換履歴（直近{myRecentLogs.length}件）
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('usage')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>すべての使用履歴を確認</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {myRecentLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 truncate">
                    {log.productName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {new Date(log.usedAt).toLocaleString('ja-JP', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  {log.note && (
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      💬 {log.note}
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md shrink-0">
                  {log.quantity}点済
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: 商品を使用する (Consume Item Modal) */}
      {consumingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">商品の使用</h2>
              <button
                onClick={() => setConsumingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmConsume} className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {consumingItem.productName}
                  </h4>
                  {consumingItem.spellSpeed && (
                    <SpellSpeedBadge speed={consumingItem.spellSpeed} size="sm" />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  現在の所持数: <strong className="font-mono text-emerald-600 font-bold">{consumingItem.quantity}点</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  使用する数量
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={consumingItem.quantity}
                    required
                    value={consumeQuantity}
                    onChange={(e) => setConsumeQuantity(Math.min(consumingItem.quantity, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                    className="w-24 px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold text-center"
                  />
                  <span className="text-xs text-slate-500">点使用する (最大 {consumingItem.quantity} 点)</span>
                </div>
              </div>

              {isMemoEnabled ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>使用メモ・引換場所（任意）</span>
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      メモ機能対応商品
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="例: メインステージ前で引換 / 第2部ワークショップ参加"
                    value={consumeNote}
                    onChange={(e) => setConsumeNote(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    使用履歴に残すメモや引換整理番号を入力できます
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-600 flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block text-[11px]">メモ入力不要（即時使用・引換）</span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                      この商品はメモ入力なしでスピーディに使用確定できます。確認後に確定ボタンを押してください。
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3 bg-indigo-50 border border-indigo-200/60 rounded-xl text-xs text-indigo-900">
                <p className="font-medium">
                  使用後は所持数が <strong>{consumingItem.quantity - consumeQuantity} 点</strong> に更新されます。
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConsumingItem(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  使用を確定する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
