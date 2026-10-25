import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Order } from '../types';
import { X, Trash2, Plus, Minus, ShoppingBag, AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import { OrderSuccessModal } from './OrderSuccessModal';
import { SpellSpeedBadge } from './SpellSpeedBadge';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, updateCartQuantity, removeFromCart, clearCart, currentUser, checkout, setActiveTab } = useStore();
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen && !completedOrder) return null;
  if (!currentUser) return null;

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const canAfford = currentUser.balance >= totalAmount;
  const deficit = Math.max(0, totalAmount - currentUser.balance);
  const projectedBalance = currentUser.balance - totalAmount;

  const handleCheckout = async () => {
    if (cart.length === 0 || isProcessing) return;

    setIsProcessing(true);
    try {
      const res = await checkout();
      if (res.success && res.order) {
        setCompletedOrder(res.order);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
          {/* Backdrop */}
          <div
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-slate-900">ショッピングカート</h2>
                  <span className="text-xs text-slate-500 font-mono">
                    ({cart.reduce((sum, i) => sum + i.quantity, 0)}点)
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                  aria-label="閉じる"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">カートは空です</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                      商品カタログから商品を選んで追加してください。
                    </p>
                    <button
                      onClick={onClose}
                      className="mt-6 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                      商品を見に行く
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-semibold text-slate-500">注文商品</span>
                      <button
                        onClick={clearCart}
                        className="text-xs text-rose-500 hover:text-rose-700 transition-colors"
                      >
                        カートを空にする
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {cart.map((item) => (
                        <div key={item.product.id} className="py-3.5 flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {item.product.name}
                              </h4>
                              {item.product.spellSpeed && (
                                <SpellSpeedBadge speed={item.product.spellSpeed} size="sm" showLabel={false} />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                              ¥{item.product.price.toLocaleString()} × {item.quantity}
                            </p>
                            <p className="text-xs font-bold font-mono text-indigo-600 mt-1 tabular-nums">
                              ¥{(item.product.price * item.quantity).toLocaleString()}
                            </p>
                          </div>

                          {/* Stepper */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              aria-label="削除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-white">
                              <button
                                onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                                className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 text-xs"
                                aria-label="1つ減らす"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 font-mono text-xs font-semibold text-slate-800">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                                className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 text-xs"
                                aria-label="1つ増やす"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Drawer Footer / Financial Summary */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-4">
                  {/* Current User & Balance indicator */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">決済利用者:</span>
                      <span className="font-semibold text-slate-800">
                        {currentUser.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="text-slate-500">現在の所持金</span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        ¥{currentUser.balance.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">カート合計額</span>
                      <span className="font-mono font-bold text-indigo-600 tabular-nums">
                        - ¥{totalAmount.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                      <span className="font-medium text-slate-700">お支払い後残高</span>
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          canAfford ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {canAfford
                          ? `¥${projectedBalance.toLocaleString()}`
                          : `不足: ¥${deficit.toLocaleString()}`}
                      </span>
                    </div>
                  </div>

                  {/* Insufficient Funds Warning */}
                  {!canAfford && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">所持金が不足しています</p>
                        <p className="text-[11px] text-rose-700 mt-0.5">
                          必要金額に対して ¥{deficit.toLocaleString()} 不足しています。管理者に所持金のチャージを依頼するか、カート内の数量を調整してください。
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Checkout Button */}
                  <button
                    onClick={handleCheckout}
                    disabled={!canAfford || isProcessing}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-md active:scale-98"
                  >
                    {isProcessing ? (
                      '処理中...'
                    ) : canAfford ? (
                      <>
                        <span>所持金で決済を確定する</span>
                        <span className="font-mono tabular-nums">(¥{totalAmount.toLocaleString()})</span>
                      </>
                    ) : (
                      '残高不足のため購入できません'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <OrderSuccessModal
        order={completedOrder}
        onClose={() => {
          setCompletedOrder(null);
          onClose();
        }}
        onViewHistory={() => {
          setCompletedOrder(null);
          onClose();
          setActiveTab('orders');
        }}
      />
    </>
  );
};
