import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ShoppingBag, LogOut, Package, Store, Users, History, Share2, Sliders, Utensils, MessageSquare, Trophy } from 'lucide-react';
import { EditTitleModal } from './EditTitleModal';

interface HeaderProps {
  onOpenCart: () => void;
  onOpenShare?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCart, onOpenShare }) => {
  const {
    currentUser,
    cart,
    activeTab,
    setActiveTab,
    logout,
    settings,
    userUnreadReplyCount,
    adminUnreadMessageCount,
  } = useStore();
  const [isEditTitleModalOpen, setIsEditTitleModalOpen] = useState(false);

  if (!currentUser) return null;

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isAdmin = currentUser.role === 'admin';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Brand title wordmark (Dynamic Admin Configurable Title) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveTab(isAdmin ? 'admin-users' : 'catalog')}
              className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 hover:text-indigo-600 transition-colors whitespace-nowrap text-left"
              title="ホームに戻る"
            >
              {settings.appTitle}
            </button>
            <span className="hidden sm:inline-block text-xs text-slate-400 border-l border-slate-200 pl-2.5 py-0.5">
              {isAdmin ? '管理者モード' : 'イベントキオスク'}
            </span>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
            {!isAdmin ? (
              // 利用者専用ナビゲーション
              <>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                    activeTab === 'catalog'
                      ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  購入ページ
                </button>

                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                    activeTab === 'inventory'
                      ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  所持数ページ
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                    activeTab === 'orders'
                      ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <History className="w-4 h-4" />
                  購入履歴
                </button>

                <button
                  onClick={() => setActiveTab('usage')}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                    activeTab === 'usage'
                      ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Utensils className="w-4 h-4" />
                  使用履歴
                </button>

                <button
                  onClick={() => setActiveTab('teams')}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                    activeTab === 'teams'
                      ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  参加チーム閲覧
                </button>

                <button
                  onClick={() => setActiveTab('tournaments')}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                    activeTab === 'tournaments'
                      ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Trophy className="w-4 h-4 text-amber-500" />
                  トーナメント表
                </button>

                <button
                  onClick={() => setActiveTab('messages')}
                  className={`relative whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                    activeTab === 'messages'
                      ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  メッセージ・連絡
                  {userUnreadReplyCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-black rounded-full animate-pulse">
                      新着連絡あり
                    </span>
                  )}
                </button>
              </>
            ) : (
              // 管理者ナビゲーション
              <>
                <button
                  onClick={() => setActiveTab('admin-users')}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                    activeTab === 'admin-users'
                      ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  参加者管理
                </button>

                <button
                  onClick={() => setActiveTab('admin-teams')}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                    activeTab === 'admin-teams'
                      ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4 text-indigo-600" />
                  参加チーム作成
                </button>

                <button
                  onClick={() => setActiveTab('tournaments')}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                    activeTab === 'tournaments'
                      ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Trophy className="w-4 h-4 text-amber-500" />
                  トーナメント表
                </button>

                <button
                  onClick={() => setActiveTab('admin-products')}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                    activeTab === 'admin-products'
                      ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  商品管理
                </button>

                <button
                  onClick={() => setActiveTab('admin-orders')}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                    activeTab === 'admin-orders'
                      ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <History className="w-4 h-4" />
                  購入履歴
                </button>

                <button
                  onClick={() => setActiveTab('admin-usage')}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                    activeTab === 'admin-usage'
                      ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Utensils className="w-4 h-4" />
                  使用履歴
                </button>

                <button
                  onClick={() => setActiveTab('admin-messages')}
                  className={`relative whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                    activeTab === 'admin-messages'
                      ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  メッセージ管理
                  {adminUnreadMessageCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-black rounded-full">
                      {adminUnreadMessageCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setIsEditTitleModalOpen(true)}
                  className="whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold"
                  title="イベント名・見出しタイトルの変更"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  タイトル設定
                </button>

                <button
                  onClick={() => setActiveTab('catalog')}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 text-slate-400 hover:text-slate-700 text-xs ${
                    activeTab === 'catalog' ? 'text-indigo-600 font-bold' : ''
                  }`}
                >
                  購入画面へ
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Title Settings button for admin (quick access) */}
            {isAdmin && (
              <button
                onClick={() => setIsEditTitleModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg transition-colors shadow-2xs"
                title="管理者用：イベント名・見出しタイトルを変更"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden lg:inline">タイトル設定</span>
              </button>
            )}

            {/* User info & Wallet balance */}
            <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${currentUser.avatarColor}`}>
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="font-semibold text-slate-800 truncate max-w-[80px] sm:max-w-[100px]">{currentUser.name}</span>
                <span className="text-[10px] text-emerald-700 font-mono font-bold tabular-nums">
                  ¥{currentUser.balance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Share URL Button (管理者のみ表示) */}
            {isAdmin && onOpenShare && (
              <button
                onClick={onOpenShare}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                title="管理者用：共有用URL・QRコードを表示"
                aria-label="管理者用：共有用URLを表示"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">共有URL</span>
              </button>
            )}

            {/* Cart Button (Always visible on store) */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap shadow-xs"
              aria-label="カートを開く"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">カート</span>
              {totalCartCount > 0 && (
                <span className="px-1.5 py-0.2 bg-white text-indigo-700 text-[11px] font-bold rounded-full min-w-4 text-center">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="ログアウトしてログイン画面に戻る"
              aria-label="ログアウト"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile navigation strip */}
        <div className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center justify-around text-xs overflow-x-auto gap-1">
          {!isAdmin ? (
            <>
              <button
                onClick={() => setActiveTab('catalog')}
                className={`px-3 py-1 rounded font-bold whitespace-nowrap ${activeTab === 'catalog' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
              >
                購入ページ
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-3 py-1 rounded font-bold whitespace-nowrap ${activeTab === 'inventory' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
              >
                所持数ページ
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3 py-1 rounded font-bold whitespace-nowrap ${activeTab === 'orders' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
              >
                購入履歴
              </button>
              <button
                onClick={() => setActiveTab('usage')}
                className={`px-3 py-1 rounded font-bold whitespace-nowrap flex items-center gap-1 ${activeTab === 'usage' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
              >
                <Utensils className="w-3.5 h-3.5" />
                使用履歴
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`px-3 py-1 rounded font-bold whitespace-nowrap ${activeTab === 'teams' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
              >
                参加チーム
              </button>
              <button
                onClick={() => setActiveTab('tournaments')}
                className={`px-3 py-1 rounded font-bold whitespace-nowrap flex items-center gap-1 ${activeTab === 'tournaments' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                トーナメント
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`relative px-3 py-1 rounded font-bold whitespace-nowrap flex items-center gap-1 ${activeTab === 'messages' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
              >
                メッセージ
                {userUnreadReplyCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('admin-users')}
                className={`px-2 py-1 rounded font-bold whitespace-nowrap ${activeTab === 'admin-users' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
              >
                参加者管理
              </button>
              <button
                onClick={() => setActiveTab('admin-teams')}
                className={`px-2 py-1 rounded font-bold whitespace-nowrap ${activeTab === 'admin-teams' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
              >
                チーム作成
              </button>
              <button
                onClick={() => setActiveTab('tournaments')}
                className={`px-2 py-1 rounded font-bold whitespace-nowrap flex items-center gap-1 ${activeTab === 'tournaments' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                トーナメント
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`px-2 py-1 rounded font-bold whitespace-nowrap ${activeTab === 'teams' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
              >
                チーム一覧
              </button>
              <button
                onClick={() => setActiveTab('admin-products')}
                className={`px-2 py-1 rounded font-bold whitespace-nowrap ${activeTab === 'admin-products' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
              >
                商品管理
              </button>
              <button
                onClick={() => setActiveTab('admin-orders')}
                className={`px-2 py-1 rounded font-bold whitespace-nowrap ${activeTab === 'admin-orders' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
              >
                購入履歴
              </button>
              <button
                onClick={() => setActiveTab('admin-messages')}
                className={`relative px-2 py-1 rounded font-bold whitespace-nowrap flex items-center gap-1 ${activeTab === 'admin-messages' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
              >
                メッセージ
                {adminUnreadMessageCount > 0 && (
                  <span className="px-1 py-0.2 bg-rose-500 text-white text-[9px] rounded-full">
                    {adminUnreadMessageCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsEditTitleModalOpen(true)}
                className="px-2 py-1 rounded font-bold whitespace-nowrap text-indigo-700 bg-indigo-50/80"
              >
                タイトル設定
              </button>
            </>
          )}
        </div>
      </header>

      {/* Edit Title Modal */}
      <EditTitleModal
        isOpen={isEditTitleModalOpen}
        onClose={() => setIsEditTitleModalOpen(false)}
      />
    </>
  );
};
