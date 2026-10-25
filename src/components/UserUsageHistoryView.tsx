import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { ItemUsageLog } from '../types';
import {
  Utensils,
  Search,
  Calendar,
  Clock,
  Package,
  History,
  Store,
  Tag,
  CheckCircle2,
  FileText,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

export const UserUsageHistoryView: React.FC = () => {
  const { usageLogs, currentUser, getUserInventory, setActiveTab } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductFilter, setSelectedProductFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  if (!currentUser) return null;

  // Filter logs only for the current user
  const myUsageLogs = useMemo(() => {
    return usageLogs.filter((log) => log.userId === currentUser.id);
  }, [usageLogs, currentUser.id]);

  // Current inventory stats for context
  const myInventory = getUserInventory(currentUser.id);
  const totalOwnedCount = myInventory.reduce((sum, item) => sum + item.quantity, 0);

  // Distinct product names used by this user for dropdown filter
  const usedProductNames = useMemo(() => {
    const set = new Set<string>();
    myUsageLogs.forEach((log) => set.add(log.productName));
    return Array.from(set);
  }, [myUsageLogs]);

  // Filtered & sorted logs
  const filteredLogs = useMemo(() => {
    let result = myUsageLogs.filter((log) => {
      const matchProduct = selectedProductFilter === 'all' || log.productName === selectedProductFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        log.productName.toLowerCase().includes(q) ||
        (log.note && log.note.toLowerCase().includes(q));

      return matchProduct && matchSearch;
    });

    result.sort((a, b) => {
      const timeA = new Date(a.usedAt).getTime();
      const timeB = new Date(b.usedAt).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [myUsageLogs, selectedProductFilter, searchQuery, sortOrder]);

  // Summary KPIs
  const totalUsageEvents = myUsageLogs.length;
  const totalConsumedCount = myUsageLogs.reduce((sum, log) => sum + log.quantity, 0);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <Utensils className="w-4 h-4" />
            <span>マイ商品使用履歴</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            {currentUser.name} さんの使用・消費履歴
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            所持数ページで使用・引換・提示したアイテムの履歴一覧です。使用日時やメモ（交換場所・用途など）をご確認いただけます。
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200/80">
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">累計使用回数</span>
            <span className="text-base sm:text-lg font-bold font-mono text-indigo-600 tabular-nums">
              {totalUsageEvents} 回
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">累計消費点数</span>
            <span className="text-base sm:text-lg font-bold font-mono text-slate-900 tabular-nums">
              {totalConsumedCount} 点
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">現在の手元所持数</span>
            <span className="text-base sm:text-lg font-bold font-mono text-emerald-600 tabular-nums">
              {totalOwnedCount} 点
            </span>
          </div>
        </div>
      </div>

      {/* Action / Jump bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/80 px-3.5 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <Package className="w-3.5 h-3.5 text-indigo-600" />
            <span>所持数ページ（アイテムを使う）</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>マイ購入履歴を確認</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          表示中: <strong className="text-slate-800 font-bold">{filteredLogs.length}</strong> 件 / 全 {totalUsageEvents} 件
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="商品名やメモ内容で検索..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Product Dropdown filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedProductFilter}
            onChange={(e) => setSelectedProductFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">すべての商品 ({myUsageLogs.length})</option>
            {usedProductNames.map((name) => {
              const count = myUsageLogs.filter((l) => l.productName === name).length;
              return (
                <option key={name} value={name}>
                  {name} ({count}回)
                </option>
              );
            })}
          </select>

          {/* Sort order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">新しい順</option>
            <option value="oldest">古い順</option>
          </select>
        </div>
      </div>

      {/* Usage Logs Content */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
            <Utensils className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-800">
              {searchQuery || selectedProductFilter !== 'all'
                ? '条件に一致する使用履歴が見つかりませんでした'
                : '商品の使用履歴はまだありません'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {searchQuery || selectedProductFilter !== 'all'
                ? '検索条件や商品フィルターを変更してお試しください。'
                : '購入ページで商品やチケットを購入後、「所持数ページ」で使用すると、ここに日時や引換メモの履歴が自動で記録されます。'}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setActiveTab('inventory')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Package className="w-4 h-4" />
              <span>所持数ページを見る</span>
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Store className="w-4 h-4" />
              <span>商品を購入する</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const dateObj = new Date(log.usedAt);
            const formattedDate = dateObj.toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'short',
            });
            const formattedTime = dateObj.toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={log.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                  {/* Thumbnail / Icon */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-400">
                    {log.image ? (
                      <img
                        src={log.image}
                        alt={log.productName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Utensils className="w-7 h-7 text-indigo-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight truncate">
                        {log.productName}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                        {log.quantity} 点使用
                      </span>
                      <span className="inline-flex items-center text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        使用済 / 引換完了
                      </span>
                    </div>

                    {/* Memo / Notes if entered */}
                    {log.note && (
                      <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5 max-w-full">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{log.note}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5">
                      <span className="font-mono">ID: {log.id}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Timestamp */}
                <div className="self-end sm:self-center shrink-0 text-right bg-slate-50 sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-xl border sm:border-0 border-slate-100 w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    {formattedDate}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {formattedTime}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
