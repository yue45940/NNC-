import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { ItemUsageLog } from '../types';
import {
  Utensils,
  Search,
  Download,
  Calendar,
  User,
  Package,
  TrendingUp,
  Trash2,
  AlertTriangle,
  X,
  CheckSquare,
  Square,
} from 'lucide-react';

export const AdminUsageHistoryView: React.FC = () => {
  const { usageLogs, users, deleteUsageLog, deleteUsageLogs, clearAllUsageLogs } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');

  // Multiselect state
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);

  // Confirmation modal states
  const [logToDelete, setLogToDelete] = useState<ItemUsageLog | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  const filteredLogs = useMemo(() => {
    return usageLogs.filter((log) => {
      const matchesUser = selectedUserId === 'all' || log.userId === selectedUserId;
      const matchesSearch =
        log.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.note && log.note.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesUser && matchesSearch;
    });
  }, [usageLogs, selectedUserId, searchQuery]);

  // Aggregate KPIs
  const totalEvents = usageLogs.length;
  const totalConsumedItems = usageLogs.reduce((sum, log) => sum + log.quantity, 0);

  // Top consumed product
  const productConsumptionMap: { [name: string]: number } = {};
  usageLogs.forEach((l) => {
    productConsumptionMap[l.productName] = (productConsumptionMap[l.productName] || 0) + l.quantity;
  });
  let topProduct = 'なし';
  let topProductCount = 0;
  Object.entries(productConsumptionMap).forEach(([name, count]) => {
    if (count > topProductCount) {
      topProduct = name;
      topProductCount = count;
    }
  });

  // Multiselect handlers
  const isAllSelected = filteredLogs.length > 0 && filteredLogs.every((l) => selectedLogIds.includes(l.id));
  const isSomeSelected = filteredLogs.some((l) => selectedLogIds.includes(l.id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedLogIds([]);
    } else {
      setSelectedLogIds(filteredLogs.map((l) => l.id));
    }
  };

  const handleToggleSelectLog = (logId: string) => {
    setSelectedLogIds((prev) =>
      prev.includes(logId) ? prev.filter((id) => id !== logId) : [...prev, logId]
    );
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['使用ログID', '使用日時', '利用者名', '商品名', '使用数量', 'メモ・場所'];
    const rows = filteredLogs.map((log) => [
      log.id,
      new Date(log.usedAt).toLocaleString('ja-JP'),
      `"${log.userName}"`,
      `"${log.productName}"`,
      log.quantity,
      `"${log.note || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartstore_usage_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Execution handlers
  const handleConfirmDeleteSingle = () => {
    if (!logToDelete) return;
    deleteUsageLog(logToDelete.id);
    setSelectedLogIds((prev) => prev.filter((id) => id !== logToDelete.id));
    setLogToDelete(null);
  };

  const handleConfirmDeleteBulk = () => {
    if (selectedLogIds.length === 0) return;
    deleteUsageLogs(selectedLogIds);
    setSelectedLogIds([]);
    setIsBulkDeleteModalOpen(false);
  };

  const handleConfirmClearAll = () => {
    clearAllUsageLogs();
    setSelectedLogIds([]);
    setIsClearAllModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Export / Clear Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <Utensils className="w-4 h-4" />
            <span>商品使用・消費履歴（管理者専用）</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            全利用者の商品使用・消費ログ
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            各利用者が購入後に所持数ページから「使用」した商品の履歴管理、使用ログの削除、CSV出力が可能です
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {usageLogs.length > 0 && (
            <button
              onClick={() => setIsClearAllModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 hover:border-rose-300 bg-rose-50/50 hover:bg-rose-50 text-rose-700 font-semibold text-xs transition-colors shadow-xs"
              title="すべての使用履歴を完全に削除"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>全履歴クリア</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            使用履歴CSV出力
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>累計使用回数</span>
            <Utensils className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums mt-1">
            {totalEvents} 回
          </div>
          <p className="text-[11px] text-slate-400 mt-1">利用者が商品を使用した総トランザクション数</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>総消費アイテム数</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 tabular-nums mt-1">
            {totalConsumedItems} 点
          </div>
          <p className="text-[11px] text-slate-400 mt-1">これまでに使用・消費された商品の合計数量</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>最多消費商品</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 truncate mt-1">
            {topProduct}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            累計 {topProductCount} 点消費
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">すべての利用者</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.department})
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="商品名・利用者名・メモで検索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Batch Action Bar (Displayed when items are selected) */}
      {selectedLogIds.length > 0 && (
        <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">
              {selectedLogIds.length}
            </span>
            <span>件の使用履歴を選択中</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedLogIds([])}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              選択解除
            </button>

            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              選択した {selectedLogIds.length} 件を削除
            </button>
          </div>
        </div>
      )}

      {/* Usage Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="w-10 px-4 py-3.5 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    disabled={filteredLogs.length === 0}
                    className="text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-40"
                    title={isAllSelected ? 'すべての選択を解除' : '表示中の全履歴を選択'}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : isSomeSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3.5">使用日時 / ログID</th>
                <th className="px-4 py-3.5">使用者</th>
                <th className="px-4 py-3.5">使用商品</th>
                <th className="px-4 py-3.5">使用数量</th>
                <th className="px-4 py-3.5">使用メモ / 用途</th>
                <th className="px-6 py-3.5 text-right">操作 (管理者)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    該当する商品使用履歴データがありません
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isSelected = selectedLogIds.includes(log.id);

                  return (
                    <tr
                      key={log.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-indigo-50/50 hover:bg-indigo-50/80' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectLog(log.id)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Timestamp */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(log.usedAt).toLocaleString('ja-JP')}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                          {log.id}
                        </span>
                      </td>

                      {/* User */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                            {log.userName.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-900">{log.userName}</span>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-800 leading-snug">
                          {log.productName}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-mono font-bold rounded-md">
                          {log.quantity} 点使用
                        </span>
                      </td>

                      {/* Note */}
                      <td className="px-4 py-3.5 text-slate-600">
                        {log.note || <span className="text-slate-400">—</span>}
                      </td>

                      {/* Action: Delete */}
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => setLogToDelete(log)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="この使用履歴を削除"
                          aria-label={`ログ ${log.id} を削除`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Modal: Single Usage Log Delete Confirmation */}
      {logToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="fixed inset-0" onClick={() => setLogToDelete(null)} aria-hidden="true" />

          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden z-10 border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-rose-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">使用履歴の削除</h3>
                  <p className="text-[11px] text-rose-600 font-medium">管理者権限による履歴削除</p>
                </div>
              </div>
              <button
                onClick={() => setLogToDelete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">ログID:</span>
                  <span className="font-mono font-bold text-slate-800">{logToDelete.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">使用者:</span>
                  <span className="font-semibold text-slate-800">{logToDelete.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">使用日時:</span>
                  <span className="text-slate-700">{new Date(logToDelete.usedAt).toLocaleString('ja-JP')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">使用商品:</span>
                  <span className="font-semibold text-slate-900">{logToDelete.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">使用数量:</span>
                  <span className="font-mono font-bold text-indigo-700">{logToDelete.quantity} 点</span>
                </div>
                {logToDelete.note && (
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">メモ:</span>
                    <span className="text-slate-700 truncate">{logToDelete.note}</span>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">注意:</span> この操作は使用履歴レコードのみを削除します。利用者の手元の所持品数や購入履歴は変更されません。
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLogToDelete(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteSingle}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  使用履歴を削除する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Bulk Delete Confirmation */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="fixed inset-0" onClick={() => setIsBulkDeleteModalOpen(false)} aria-hidden="true" />

          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden z-10 border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-rose-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">選択した使用履歴の一括削除</h3>
                  <p className="text-[11px] text-rose-600 font-medium">{selectedLogIds.length} 件を削除</p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-700 leading-relaxed">
                選択されている <strong className="text-rose-600 font-bold">{selectedLogIds.length} 件</strong> の使用履歴レコードを完全に削除します。
                一度削除した履歴は復元できません。
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteBulk}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  選択した {selectedLogIds.length} 件を削除する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Clear All Usage Logs Confirmation */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="fixed inset-0" onClick={() => setIsClearAllModalOpen(false)} aria-hidden="true" />

          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden z-10 border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-rose-100/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-rose-950">全商品使用履歴の完全消去</h3>
                  <p className="text-[11px] text-rose-700 font-semibold">全 {usageLogs.length} 件のレコード削除</p>
                </div>
              </div>
              <button
                onClick={() => setIsClearAllModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-700 leading-relaxed">
                システム内のすべての商品使用履歴（計 <strong className="text-rose-600 font-bold">{usageLogs.length} 件</strong>）を消去します。
                この操作は取り消せません。本当に削除を実行しますか？
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClearAllModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClearAll}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  すべての使用履歴を消去する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
