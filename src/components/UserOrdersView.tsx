import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Order } from '../types';
import { OrderSuccessModal } from './OrderSuccessModal';
import { History, Receipt, ArrowRight, RotateCw, ShoppingBag, Calendar, CheckCircle2, XCircle, Utensils } from 'lucide-react';

interface UserOrdersViewProps {
  onOpenCart: () => void;
}

export const UserOrdersView: React.FC<UserOrdersViewProps> = ({ onOpenCart }) => {
  const { orders, currentUser, addToCart, products, setActiveTab } = useStore();
  const [selectedReceipt, setSelectedReceipt] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  if (!currentUser) return null;

  // Filter orders for current logged-in user
  const userOrders = orders.filter((o) => {
    const isUser = o.userId === currentUser.id;
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return isUser && matchesStatus;
  });

  const handleReorder = (order: Order) => {
    for (const item of order.items) {
      const liveProduct = products.find((p) => p.id === item.productId);
      if (liveProduct) {
        addToCart(liveProduct, item.quantity);
      }
    }
    onOpenCart();
  };

  const totalSpent = orders
    .filter((o) => o.userId === currentUser.id && o.status === 'completed')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <History className="w-4 h-4" />
            <span>マイ購入履歴</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            {currentUser.name} さんの購入履歴一覧
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            これまでの購入明細、決済レシート、所持金引き落とし履歴を確認できます
          </p>
        </div>

        {/* Stats summary */}
        <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
          <div>
            <span className="text-[11px] text-slate-500 block">現在の所持金</span>
            <span className="text-base font-bold font-mono text-emerald-600 tabular-nums">
              ¥{currentUser.balance.toLocaleString()}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-[11px] text-slate-500 block">累計購入総額</span>
            <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
              ¥{totalSpent.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            すべて ({orders.filter((o) => o.userId === currentUser.id).length})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              statusFilter === 'completed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            完了済み ({orders.filter((o) => o.userId === currentUser.id && o.status === 'completed').length})
          </button>
          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              statusFilter === 'cancelled' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            キャンセル ({orders.filter((o) => o.userId === currentUser.id && o.status === 'cancelled').length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('usage')}
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/80 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Utensils className="w-3.5 h-3.5 text-indigo-600" />
            <span>マイ使用履歴</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>ストアへ戻る</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Orders List */}
      {userOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-3">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">購入履歴がありません</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            商品カタログからお好きな商品を選んで、所持金で購入してみましょう。
          </p>
          <button
            onClick={() => setActiveTab('catalog')}
            className="mt-5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
          >
            商品カタログを見る
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {userOrders.map((order) => {
            const isCompleted = order.status === 'completed';

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-colors"
              >
                {/* Order Top Bar */}
                <div className="px-6 py-3.5 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-slate-400 block text-[11px]">注文日時</span>
                      <span className="font-medium text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(order.createdAt).toLocaleString('ja-JP', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">注文番号</span>
                      <span className="font-mono font-bold text-slate-800">{order.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          決済完了
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          返金・取消済み
                        </>
                      )}
                    </span>

                    <button
                      onClick={() => setSelectedReceipt(order)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors"
                    >
                      <Receipt className="w-3.5 h-3.5 text-slate-500" />
                      レシート詳細
                    </button>
                  </div>
                </div>

                {/* Items preview */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 py-1 border-b border-slate-50 last:border-b-0">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {item.productName}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                              ¥{item.price.toLocaleString()} × {item.quantity}点
                            </p>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-800 tabular-nums">
                            ¥{item.subtotal.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Financial summary on right */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between">
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>購入前所持金</span>
                          <span className="font-mono tabular-nums">¥{order.balanceBefore.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-rose-600 font-semibold">
                          <span>決済引き落とし額</span>
                          <span className="font-mono tabular-nums">- ¥{order.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                          <span>決済後所持金</span>
                          <span className="font-mono text-emerald-700 tabular-nums">
                            ¥{order.balanceAfter.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {!isCompleted && (
                        <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700 font-medium leading-relaxed">
                          <span className="font-bold block">【返金・所持数回収済み】</span>
                          全額 ¥{order.totalAmount.toLocaleString()} が所持金へ返還され、対象商品の所持数は手元から自動回収されました。
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                        <button
                          onClick={() => handleReorder(order)}
                          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold py-1 px-2 rounded hover:bg-indigo-50 transition-colors"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          同じ商品を再注文する
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Digital Receipt Modal */}
      <OrderSuccessModal
        order={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        onViewHistory={() => setSelectedReceipt(null)}
      />
    </div>
  );
};
