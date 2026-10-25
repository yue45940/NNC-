import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { ProductDetailModal } from './ProductDetailModal';
import { EditTitleModal } from './EditTitleModal';
import { Search, Plus, ArrowRight, Sliders, Eye, EyeOff, Tag, ArrowUpDown, X, Zap } from 'lucide-react';
import { SpellSpeedBadge, isSpellSpeedMatching, normalizeSpeedStr } from './SpellSpeedBadge';

interface ProductCatalogProps {
  onOpenCart: () => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ onOpenCart }) => {
  const { products, currentUser, addToCart, setActiveTab, settings } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<
    'featured' | 'spellspeed-asc' | 'spellspeed-desc' | 'badge-asc' | 'badge-desc' | 'price-asc' | 'price-desc' | 'name-asc'
  >('featured');
  const [badgeFilter, setBadgeFilter] = useState<string>('all');
  const [spellSpeedFilter, setSpellSpeedFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditTitleModalOpen, setIsEditTitleModalOpen] = useState(false);
  const [adminShowHidden, setAdminShowHidden] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  // Available unique badges
  const availableBadges = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const isPub = p.isPublished !== false;
      if (!isAdmin && !isPub) return;
      if (isAdmin && !adminShowHidden && !isPub) return;
      if (p.badge?.trim()) {
        set.add(p.badge.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ja'));
  }, [products, isAdmin, adminShowHidden]);

  // Available unique spell speeds across all registered products (including user custom entries)
  const availableSpellSpeeds = useMemo(() => {
    const map = new Map<string, string>();
    // Default baseline speeds
    ['1', '2', '3'].forEach((s) => map.set(s, s));

    products.forEach((p) => {
      const isPub = p.isPublished !== false;
      if (!isAdmin && !isPub) return;
      if (isAdmin && !adminShowHidden && !isPub) return;
      if (p.spellSpeed !== undefined && p.spellSpeed !== null && String(p.spellSpeed).trim() !== '') {
        const raw = String(p.spellSpeed).trim();
        const norm = normalizeSpeedStr(raw);
        if (norm) {
          map.set(norm, raw);
        }
      }
    });

    return Array.from(map.entries()).sort((a, b) => {
      const numA = Number(a[0]);
      const numB = Number(b[0]);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      if (!isNaN(numA)) return -1;
      if (!isNaN(numB)) return 1;
      return a[0].localeCompare(b[0], 'ja');
    });
  }, [products, isAdmin, adminShowHidden]);

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // 購入ページへの表示/非表示フィルタ
        const isPublished = p.isPublished !== false;

        // 一般利用者は非表示の商品を絶対に表示しない
        if (!isAdmin && !isPublished) {
          return false;
        }

        // 管理者が「非公開も含めて確認」を有効にしていない場合は非表示商品を隠す
        if (isAdmin && !adminShowHidden && !isPublished) {
          return false;
        }

        // バッジフィルタ
        if (badgeFilter !== 'all') {
          if (p.badge?.trim() !== badgeFilter) {
            return false;
          }
        }

        // スペルスピードフィルタ (独自入力・正規化・未設定に完全対応)
        if (!isSpellSpeedMatching(p.spellSpeed, spellSpeedFilter)) {
          return false;
        }

        const query = searchQuery.toLowerCase();
        const matchesSearch =
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          (p.badge && p.badge.toLowerCase().includes(query)) ||
          (p.spellSpeed && String(p.spellSpeed).toLowerCase().includes(query)) ||
          (p.spellSpeed && `スペルスピード${p.spellSpeed}`.toLowerCase().includes(query)) ||
          (p.spellSpeed && `ss${p.spellSpeed}`.toLowerCase().includes(query));
        return matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'ja');
        if (sortBy === 'spellspeed-asc') {
          const getSpeedVal = (s?: number | string) => {
            if (s === undefined || s === null || s === '') return 999;
            const n = Number(s);
            return isNaN(n) ? 500 : n;
          };
          const diff = getSpeedVal(a.spellSpeed) - getSpeedVal(b.spellSpeed);
          return diff !== 0 ? diff : a.name.localeCompare(b.name, 'ja');
        }
        if (sortBy === 'spellspeed-desc') {
          const getSpeedVal = (s?: number | string) => {
            if (s === undefined || s === null || s === '') return -1;
            const n = Number(s);
            return isNaN(n) ? 500 : n;
          };
          const diff = getSpeedVal(b.spellSpeed) - getSpeedVal(a.spellSpeed);
          return diff !== 0 ? diff : a.name.localeCompare(b.name, 'ja');
        }
        if (sortBy === 'badge-asc') {
          const hasA = Boolean(a.badge && a.badge.trim());
          const hasB = Boolean(b.badge && b.badge.trim());
          if (hasA && !hasB) return -1;
          if (!hasA && hasB) return 1;
          if (!hasA && !hasB) return a.name.localeCompare(b.name, 'ja');
          const badgeComp = (a.badge || '').localeCompare(b.badge || '', 'ja');
          return badgeComp !== 0 ? badgeComp : a.name.localeCompare(b.name, 'ja');
        }
        if (sortBy === 'badge-desc') {
          const hasA = Boolean(a.badge && a.badge.trim());
          const hasB = Boolean(b.badge && b.badge.trim());
          if (hasA && !hasB) return -1;
          if (!hasA && hasB) return 1;
          if (!hasA && !hasB) return b.name.localeCompare(a.name, 'ja');
          const badgeComp = (b.badge || '').localeCompare(a.badge || '', 'ja');
          return badgeComp !== 0 ? badgeComp : a.name.localeCompare(b.name, 'ja');
        }
        return 0; // featured/default
      });
  }, [products, searchQuery, sortBy, badgeFilter, spellSpeedFilter, isAdmin, adminShowHidden]);

  if (!currentUser) return null;

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Showcase Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-xl border border-slate-800 text-white">
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/hero_cafe_store_1792325094927.jpg"
            alt="SmartStore Showcase"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-35 filter brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />
        </div>

        <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-14 max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              {settings.heroBadge}
            </span>
            {currentUser.role === 'admin' && (
              <button
                type="button"
                onClick={() => setIsEditTitleModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md text-xs font-bold border border-white/20 transition-all shadow-xs cursor-pointer"
                title="管理者用：イベント名・見出しタイトルを変更"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-300" />
                <span>見出し・タイトルを編集</span>
              </button>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-2 text-white">
            {settings.heroTitle}
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl whitespace-pre-line">
            {settings.heroDescription}
          </p>

          {/* User balance strip */}
          <div className="mt-6 inline-flex flex-wrap items-center gap-3 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${currentUser.avatarColor}`}>
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-xs">
                <span className="text-slate-300 block text-[11px]">{currentUser.name} さんのイベント所持金</span>
                <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                  ¥{currentUser.balance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Search & Controls */}
      <div className="space-y-4">
        {/* Top search & sort row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="商品名・キーワードで検索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setAdminShowHidden(!adminShowHidden)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer shadow-2xs ${
                  adminShowHidden
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title="管理者の非公開商品表示切り替え"
              >
                {adminShowHidden ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-amber-600" />
                    <span>非公開商品も含めて表示中</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    <span>公開商品のみ表示（利用者視点）</span>
                  </>
                )}
              </button>
            )}

            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-slate-700 focus:outline-hidden font-medium cursor-pointer pr-1"
                aria-label="並び替え"
              >
                <option value="featured">おすすめ順</option>
                <option value="spellspeed-asc">⚡ スペルスピード順 (1→2→3)</option>
                <option value="spellspeed-desc">⚡ スペルスピード順 (3→2→1)</option>
                <option value="badge-asc">🏷️ バッジ・ラベル順 (昇順: A→Z/あ→ん)</option>
                <option value="badge-desc">🏷️ バッジ・ラベル順 (降順: Z→A/ん→あ)</option>
                <option value="price-asc">価格が安い順</option>
                <option value="price-desc">価格が高い順</option>
                <option value="name-asc">商品名順</option>
              </select>
            </div>
          </div>
        </div>

        {/* Badge Quick Filters */}
        {availableBadges.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
              <Tag className="w-3 h-3 text-indigo-500" />
              バッジ絞り込み:
            </span>
            <button
              type="button"
              onClick={() => setBadgeFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                badgeFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              すべて
            </button>
            {availableBadges.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBadgeFilter(badgeFilter === b ? 'all' : b)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  badgeFilter === b
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50/80 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                <span>{b}</span>
                {badgeFilter === b && <X className="w-3 h-3 ml-0.5" />}
              </button>
            ))}
          </div>
        )}

        {/* Spell Speed Quick Filters (動的自作値・標準値すべて反映) */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
            <Zap className="w-3 h-3 text-amber-500" />
            スペルスピード絞り込み:
          </span>
          <button
            type="button"
            onClick={() => setSpellSpeedFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              spellSpeedFilter === 'all'
                ? 'bg-amber-500 text-white shadow-xs font-bold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            すべて
          </button>

          {availableSpellSpeeds.map(([normKey, rawLabel]) => {
            const isSelected =
              spellSpeedFilter === rawLabel ||
              spellSpeedFilter === normKey ||
              normalizeSpeedStr(spellSpeedFilter) === normKey;

            let displayLabel = `SS ${rawLabel}`;
            if (normKey === '1') displayLabel = 'SS 1 (通常)';
            else if (normKey === '2') displayLabel = 'SS 2 (速攻)';
            else if (normKey === '3') displayLabel = 'SS 3 (カウンター)';
            else if (rawLabel.startsWith('SS') || rawLabel.startsWith('スペルスピード')) {
              displayLabel = rawLabel;
            }

            return (
              <button
                key={normKey}
                type="button"
                onClick={() => setSpellSpeedFilter(isSelected ? 'all' : rawLabel)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-xs font-bold'
                    : 'bg-amber-50/80 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
                title={`スペルスピード「${rawLabel}」で絞り込み`}
              >
                <span>{displayLabel}</span>
                {isSelected && <X className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setSpellSpeedFilter(spellSpeedFilter === 'none' ? 'all' : 'none')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              spellSpeedFilter === 'none'
                ? 'bg-slate-700 text-white shadow-xs font-bold'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>未設定</span>
            {spellSpeedFilter === 'none' && <X className="w-3 h-3 ml-0.5" />}
          </button>
        </div>

        {/* Results summary text */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2 flex-wrap">
            <span>{filteredProducts.length} 点の商品</span>
            {badgeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
                バッジ: {badgeFilter}
                <button
                  type="button"
                  onClick={() => setBadgeFilter('all')}
                  className="hover:text-indigo-950 cursor-pointer"
                  title="バッジ絞り込みを解除"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {spellSpeedFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                速度: {spellSpeedFilter === 'none' ? '未設定のみ' : `SS ${spellSpeedFilter}`}
                <button
                  type="button"
                  onClick={() => setSpellSpeedFilter('all')}
                  className="hover:text-amber-950 cursor-pointer"
                  title="スペルスピード絞り込みを解除"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {sortBy.startsWith('spellspeed-') && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                速度ソート中 ({sortBy === 'spellspeed-asc' ? '1→3順' : '3→1順'})
              </span>
            )}
            {sortBy.startsWith('badge-') && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200">
                バッジソート中 ({sortBy === 'badge-asc' ? '昇順' : '降順'})
              </span>
            )}
          </div>
          <button
            onClick={() => setActiveTab('inventory')}
            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
          >
            所持数・使用管理ページへ
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200">
          <p className="text-sm font-semibold text-slate-700">該当する商品がありません</p>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery || badgeFilter !== 'all'
              ? '検索条件やバッジ絞り込みを変更してください。'
              : '現在購入可能な商品はありません。'}
          </p>
          {(searchQuery || badgeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setBadgeFilter('all');
              }}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              条件をクリア
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((product) => {
            const isUnpublished = product.isPublished === false;

            return (
              <div
                key={product.id}
                className={`group relative bg-white rounded-2xl border overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between p-5 ${
                  isUnpublished ? 'border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/10' : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div>
                  {/* Badge & Spell Speed & Category Header */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-3">
                    <div className="flex items-center flex-wrap gap-1.5">
                      {product.badge ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBadgeFilter(product.badge!);
                          }}
                          className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-[11px] font-bold px-2.5 py-0.5 rounded-full cursor-pointer transition-colors"
                          title={`バッジ「${product.badge}」で絞り込み`}
                        >
                          <Tag className="w-3 h-3 text-indigo-500" />
                          <span>{product.badge}</span>
                        </button>
                      ) : (
                        <span className="inline-block bg-slate-100 text-slate-500 text-[10px] font-medium px-2 py-0.5 rounded-full">
                          アイテム
                        </span>
                      )}

                      {/* Spell Speed Badge */}
                      {product.spellSpeed && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSpellSpeedFilter(String(product.spellSpeed));
                          }}
                          className="cursor-pointer"
                          title={`スペルスピード「${product.spellSpeed}」で絞り込み`}
                        >
                          <SpellSpeedBadge speed={product.spellSpeed} size="sm" />
                        </button>
                      )}
                    </div>

                    {/* Unpublished indicator badge for Admin */}
                    {isUnpublished && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <EyeOff className="w-3 h-3 text-amber-600" />
                        非表示中（管理者のみ）
                      </span>
                    )}
                  </div>

                  {/* Product Image Thumbnail */}
                  {product.image && (
                    <div
                      onClick={() => setSelectedProduct(product)}
                      className="w-full aspect-video rounded-xl bg-slate-100 overflow-hidden mb-3 border border-slate-200 cursor-pointer"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Body Details */}
                  <div onClick={() => setSelectedProduct(product)} className="cursor-pointer">
                    <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {product.name}
                    </h3>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </div>

                {/* Price & Buy Action */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                      ¥{product.price.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">税込</span>
                  </div>

                  <button
                    onClick={() => addToCart(product, 1)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-xs cursor-pointer"
                    title="カートに入れる"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    追加
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCartSuccess={onOpenCart}
      />

      {/* Edit Title Modal for Admin */}
      <EditTitleModal
        isOpen={isEditTitleModalOpen}
        onClose={() => setIsEditTitleModalOpen(false)}
      />
    </div>
  );
};
