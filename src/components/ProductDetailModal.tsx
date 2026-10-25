import React, { useState } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { X, ShoppingBag, Plus, Minus, AlertTriangle, Tag, Zap } from 'lucide-react';
import { SpellSpeedBadge } from './SpellSpeedBadge';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCartSuccess?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCartSuccess,
}) => {
  const { addToCart, currentUser } = useStore();
  const [quantity, setQuantity] = useState(1);

  if (!product || !currentUser) return null;

  const totalPrice = product.price * quantity;
  const canAfford = currentUser.balance >= totalPrice;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    if (onAddToCartSuccess) onAddToCartSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden z-10 border border-slate-200">
        {/* Modal Top */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {product.isPublished === false ? (
              <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                非公開中（購入ページ非表示）
              </span>
            ) : product.badge ? (
              <span className="bg-indigo-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                {product.badge}
              </span>
            ) : (
              <span className="bg-slate-200 text-slate-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                商品詳細
              </span>
            )}

            {product.spellSpeed !== undefined && product.spellSpeed !== null && String(product.spellSpeed).trim() !== '' && (
              <SpellSpeedBadge speed={product.spellSpeed} size="md" />
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {product.image && (
            <div className="w-full aspect-video rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div>
            <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
              {product.name}
            </h2>

            {/* Price */}
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
                ¥{product.price.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">（税込）</span>
            </div>

            {/* Spell Speed Info Strip */}
            {product.spellSpeed && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                  スペルスピード（発動速度）
                </span>
                <SpellSpeedBadge speed={product.spellSpeed} size="md" />
              </div>
            )}

            {/* Description */}
            <p className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {product.description}
            </p>
          </div>

          {/* Quantity and Actions */}
          <div className="border-t border-slate-100 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">購入数量</span>
              <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="p-2.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  aria-label="1つ減らす"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-12 text-center font-mono text-sm font-bold text-slate-900">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  disabled={quantity >= 99}
                  className="p-2.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  aria-label="1つ増やす"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Price check against wallet */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                現在の所持金: <strong className="font-mono text-slate-800">¥{currentUser.balance.toLocaleString()}</strong>
              </span>
              <span className={`font-mono font-bold text-sm ${canAfford ? 'text-indigo-600' : 'text-rose-600'}`}>
                合計: ¥{totalPrice.toLocaleString()}
              </span>
            </div>

            {!canAfford && (
              <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                所持金が不足しています（管理者にチャージを依頼してください）
              </p>
            )}

            {product.isPublished === false && currentUser.role !== 'admin' ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-800 font-bold">
                この商品は管理者により現在非公開に設定されているため購入できません。
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition-colors shadow-sm cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>カートに追加する (¥{totalPrice.toLocaleString()})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
