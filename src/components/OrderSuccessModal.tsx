import React from 'react';
import { Order } from '../types';
import { CheckCircle2, X, Printer, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
  onViewHistory: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  onClose,
  onViewHistory,
}) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Receipt Header */}
        <div className="bg-slate-900 text-white p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold tracking-tight">ご購入ありがとうございます</h2>
          <p className="text-xs text-slate-300 mt-1">所持金からの引き落としが完了しました</p>
        </div>

        {/* Receipt Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
          {/* Order Info */}
          <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100">
            <div>
              <span className="text-slate-400 block">注文番号</span>
              <span className="font-mono font-bold text-slate-800">{order.id}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block">購入日時</span>
              <span className="text-slate-700">
                {new Date(order.createdAt).toLocaleString('ja-JP', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* User info */}
          <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100">
            <span className="text-slate-500">購入者</span>
            <span className="font-semibold text-slate-800">{order.userName}</span>
          </div>

          {/* Purchased Items */}
          <div className="space-y-2 py-2">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
              購入商品明細
            </span>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50">
                <div className="flex-1 pr-3">
                  <p className="font-medium text-slate-800 leading-snug">{item.productName}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ¥{item.price.toLocaleString()} × {item.quantity}点
                  </p>
                </div>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  ¥{item.subtotal.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Ledger Calculation */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-100">
            <div className="flex justify-between items-center text-xs text-slate-600">
              <span>購入前所持金</span>
              <span className="font-mono tabular-nums">¥{order.balanceBefore.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-rose-600 font-medium">
              <span>お支払い合計額</span>
              <span className="font-mono tabular-nums font-bold">- ¥{order.totalAmount.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
              <span>お支払い後残高</span>
              <span className="font-mono text-emerald-600 tabular-nums">
                ¥{order.balanceAfter.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            印刷する
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onViewHistory();
              }}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors"
            >
              購入履歴・明細を確認
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
            >
              買い物を続ける
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
