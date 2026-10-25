import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Order } from '../types';
import { OrderSuccessModal } from './OrderSuccessModal';
import {
  Search,
  Download,
  History,
  Receipt,
  Undo2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Trash2,
  AlertTriangle,
  X,
  CheckSquare,
  Square,
} from 'lucide-react';

export const AdminOrdersView: React.FC = () => {
  const { orders, users, cancelOrder, deleteOrder, deleteOrders, clearAllOrders } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<Order | null>(null);

  // Selection state for batch deletion
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Confirmation modal states
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [orderToRefund, setOrderToRefund] = useState<Order | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesUser = selectedUserId === 'all' || o.userId === selectedUserId;
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchesSearch =
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.items.some((item) => item.productName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesUser && matchesStatus && matchesSearch;
    });
  }, [orders, selectedUserId, statusFilter, searchQuery]);

  // Aggregate stats
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrdersCount = completedOrders.length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
  const cancelledOrdersCount = orders.filter((o) => o.status === 'cancelled').length;

  // Selection handlers
  const isAllSelected = filteredOrders.length > 0 && filteredOrders.every((o) => selectedOrderIds.includes(o.id));
  const isSomeSelected = filteredOrders.some((o) => selectedOrderIds.includes(o.id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    }
  };

  const handleToggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['注文番号', '注文日時', '購入者氏名', 'メールアドレス', '購入商品', '合計金額(円)', '購入前残高(円)', '購入後残高(円)', 'ステータス'];
    const rows = filteredOrders.map((o) => [
      o.id,
      new Date(o.createdAt).toLocaleString('ja-JP'),
      `"${o.userName}"`,
      `"${o.userEmail}"`,
      `"${o.items.map((i) => `${i.productName}×${i.quantity}`).join('; ')}"`,
      o.totalAmount,
      o.balanceBefore,
      o.balanceAfter,
      o.status === 'completed' ? '完了' : 'キャンセル',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartstore_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefund = (order: Order) => {
    setOrderToRefund(order);
  };

  // Delete single order execution
  const handleConfirmDeleteSingle = () => {
    if (!orderToDelete) return;
    deleteOrder(orderToDelete.id);
    setSelectedOrderIds((prev) => prev.filter((id) => id !== orderToDelete.id));
    setOrderToDelete(null);
  };

  // Delete multiple orders execution
  const handleConfirmDeleteBulk = () => {
    if (selectedOrderIds.length === 0) return;
    deleteOrders(selectedOrderIds);
    setSelectedOrderIds([]);
    setIsBulkDeleteModalOpen(false);
  };

  // Clear all orders execution
  const handleConfirmClearAll = () => {
    clearAllOrders();
    setSelectedOrderIds([]);
    setIsClearAllModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Export / Clear Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <History className="w-4 h-4" />
            <span>全社・全利用者 購入履歴（管理者専用）</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            システム全体の購入履歴・売上集計
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            すべての利用者の決済履歴の閲覧、レシート確認、購入履歴の削除、キャンセル返金、CSV出力が可能です
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {orders.length > 0 && (
            <button
              onClick={() => setIsClearAllModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 hover:border-rose-300 bg-rose-50/50 hover:bg-rose-50 text-rose-700 font-semibold text-xs transition-colors shadow-xs"
              title="すべての購入履歴を完全に削除"
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
            CSVでダウンロード
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>総売上金額</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums mt-1">
            ¥{totalRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">完了済み注文の合計金額</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>累計注文件数</span>
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums mt-1">
            {totalOrdersCount} 件
          </div>
          <p className="text-[11px] text-slate-400 mt-1">正常に完了した決済数</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>平均客単価 (AOV)</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-600 tabular-nums mt-1">
            ¥{avgOrderValue.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">1注文あたりの平均決済額</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>取消・返金件数</span>
            <Undo2 className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 tabular-nums mt-1">
            {cancelledOrdersCount} 件
          </div>
          <p className="text-[11px] text-slate-400 mt-1">キャンセル処理済み注文</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* User selector filter */}
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

          {/* Status filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全件
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'completed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              完了のみ
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'cancelled' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              返金済のみ
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="注文番号・商品名・購入者名"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Batch Action Bar (Displayed when items are selected) */}
      {selectedOrderIds.length > 0 && (
        <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">
              {selectedOrderIds.length}
            </span>
            <span>件の購入履歴を選択中</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedOrderIds([])}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              選択解除
            </button>

            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              選択した {selectedOrderIds.length} 件を削除
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="w-10 px-4 py-3.5 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    disabled={filteredOrders.length === 0}
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
                <th className="px-4 py-3.5">注文番号 / 日時</th>
                <th className="px-4 py-3.5">購入者</th>
                <th className="px-4 py-3.5">購入商品</th>
                <th className="px-4 py-3.5">決済総額</th>
                <th className="px-4 py-3.5">決済前後残高</th>
                <th className="px-4 py-3.5">状態</th>
                <th className="px-6 py-3.5 text-right">操作 (管理者)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    該当する注文データがありません
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isCompleted = order.status === 'completed';
                  const isSelected = selectedOrderIds.includes(order.id);

                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-indigo-50/50 hover:bg-indigo-50/80' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectOrder(order.id)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* ID and Date */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-slate-900">{order.id}</div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {new Date(order.createdAt).toLocaleString('ja-JP')}
                        </span>
                      </td>

                      {/* User */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{order.userName}</div>
                        <span className="text-[11px] text-slate-400">{order.userEmail}</span>
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5 max-w-xs">
                          {order.items.map((i, idx) => (
                            <div key={idx} className="text-slate-700 truncate">
                              {i.productName} × {i.quantity}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3.5 font-mono font-bold text-sm text-slate-900 tabular-nums">
                        ¥{order.totalAmount.toLocaleString()}
                      </td>

                      {/* Balance change */}
                      <td className="px-4 py-3.5 font-mono text-slate-500 tabular-nums">
                        ¥{order.balanceBefore.toLocaleString()} → <strong className="text-slate-800">¥{order.balanceAfter.toLocaleString()}</strong>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-medium ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              決済完了
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              返金済み
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedReceipt(order)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="レシート・明細表示"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>

                          {isCompleted && (
                            <button
                              onClick={() => handleRefund(order)}
                              className="px-2 py-1 text-[11px] text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-colors font-medium flex items-center gap-1"
                              title="返金して在庫を戻す"
                            >
                              <Undo2 className="w-3 h-3" />
                              返金
                            </button>
                          )}

                          {/* Delete Order Record (管理者専用) */}
                          <button
                            onClick={() => setOrderToDelete(order)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="購入履歴を削除"
                            aria-label={`注文 ${order.id} の購入履歴を削除`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Modal: Single Order Delete Confirmation */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="fixed inset-0" onClick={() => setOrderToDelete(null)} aria-hidden="true" />

          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden z-10 border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-rose-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">購入履歴の削除</h3>
                  <p className="text-[11px] text-rose-600 font-medium">管理者権限による履歴削除</p>
                </div>
              </div>
              <button
                onClick={() => setOrderToDelete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">注文番号:</span>
                  <span className="font-mono font-bold text-slate-800">{orderToDelete.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">購入者:</span>
                  <span className="font-semibold text-slate-800">{orderToDelete.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">決済日時:</span>
                  <span className="text-slate-700">{new Date(orderToDelete.createdAt).toLocaleString('ja-JP')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">決済総額:</span>
                  <span className="font-mono font-bold text-emerald-600">¥{orderToDelete.totalAmount.toLocaleString()}</span>
                </div>
                <div className="pt-1 border-t border-slate-200">
                  <span className="text-slate-500 block mb-1">購入アイテム:</span>
                  <ul className="space-y-0.5 text-slate-700 list-disc list-inside">
                    {orderToDelete.items.map((item, idx) => (
                      <li key={idx} className="truncate">
                        {item.productName} × {item.quantity}点 (¥{item.subtotal.toLocaleString()})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">注意:</span> この操作は購入履歴データのみを削除します。
                  利用者の所持金や商品の在庫数を戻す（返金）場合は、先に「返金」ボタンを実行してください。
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOrderToDelete(null)}
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
                  購入履歴を削除する
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
                  <h3 className="text-base font-bold text-slate-900">選択した購入履歴の一括削除</h3>
                  <p className="text-[11px] text-rose-600 font-medium">{selectedOrderIds.length} 件を削除</p>
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
                選択されている <strong className="text-rose-600 font-bold">{selectedOrderIds.length} 件</strong> の購入履歴レコードを完全に削除します。
                一度削除した履歴は復元できません。
              </p>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  ※利用者の所持金は変更されません。
                </div>
              </div>

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
                  選択した {selectedOrderIds.length} 件を削除する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Clear All Orders Confirmation */}
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
                  <h3 className="text-base font-bold text-rose-950">全購入履歴の完全消去</h3>
                  <p className="text-[11px] text-rose-700 font-semibold">全 {orders.length} 件のレコード削除</p>
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
                システム内のすべての購入履歴（計 <strong className="text-rose-600 font-bold">{orders.length} 件</strong>）を消去します。
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
                  すべての履歴を消去する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      {orderToRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Undo2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">注文のキャンセル・返金確認</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                注文「<span className="font-bold text-slate-900">{orderToRefund.id}</span>」（¥{orderToRefund.totalAmount.toLocaleString()}）をキャンセルし、購入者（{orderToRefund.userName}）の所持金へ全額返金しますか？
              </p>
              <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                <span className="font-bold block mb-1">【所持数の自動回収】</span>
                購入者の所持数から、この注文で獲得された商品（{orderToRefund.items.map((i) => `${i.productName} × ${i.quantity}点`).join(', ')}）が自動的に減算されます。
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOrderToRefund(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  戻る
                </button>
                <button
                  type="button"
                  onClick={() => {
                    cancelOrder(orderToRefund.id, '管理者による返金処理');
                    setOrderToRefund(null);
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  キャンセル・返金を実行
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Receipt Modal */}
      <OrderSuccessModal
        order={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        onViewHistory={() => setSelectedReceipt(null)}
      />
    </div>
  );
};
