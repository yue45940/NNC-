import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { ProductCatalog } from './components/ProductCatalog';
import { UserInventoryView } from './components/UserInventoryView';
import { AdminProductManagement } from './components/AdminProductManagement';
import { AdminUserManagement } from './components/AdminUserManagement';
import { AdminOrdersView } from './components/AdminOrdersView';
import { AdminUsageHistoryView } from './components/AdminUsageHistoryView';
import { UserOrdersView } from './components/UserOrdersView';
import { UserUsageHistoryView } from './components/UserUsageHistoryView';
import { UserMessagesView } from './components/UserMessagesView';
import { AdminMessagesView } from './components/AdminMessagesView';
import { TeamsListView } from './components/TeamsListView';
import { AdminTeamsView } from './components/AdminTeamsView';
import { TournamentView } from './components/TournamentView';
import { ContactAdminModal } from './components/ContactAdminModal';
import { CartDrawer } from './components/CartDrawer';
import { ToastContainer } from './components/Toast';
import { ShareModal } from './components/ShareModal';
import { Package, Users, History, Shield, ArrowLeft, Utensils, Share2, MessageSquare, Flag, Trophy } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    isAuthenticated,
    logout,
    adminUnreadMessageCount,
    userUnreadReplyCount,
  } = useStore();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // If user is not authenticated, show Login page (ID and PASS wall)
  // "利用者は、IDとPASSを入力しないと購入ページに移行できない"
  if (!isAuthenticated || !currentUser) {
    return (
      <>
        <LoginPage />
        <ToastContainer />
      </>
    );
  }

  const isAdmin = currentUser.role === 'admin';
  const isAdminTab = activeTab.startsWith('admin');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Universal Top Bar */}
      <Header
        onOpenCart={() => setIsCartOpen(true)}
        onOpenShare={isAdmin ? () => setIsShareModalOpen(true) : undefined}
      />

      {/* Admin Subheader Toolbar (only visible for Admin) */}
      {isAdmin && isAdminTab && (
        <aside aria-label="管理者コントロール" className="bg-slate-900 text-white border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-md border border-indigo-800">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                管理者コンソール
              </span>
              <span className="hidden sm:inline text-xs text-slate-400">
                （管理者: {currentUser.name} / ID: {currentUser.loginId}）
              </span>
            </div>

            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('admin-users')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'admin-users'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                参加者・所持金管理
              </button>

              <button
                onClick={() => setActiveTab('admin-teams')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'admin-teams'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Flag className="w-3.5 h-3.5 text-indigo-300" />
                参加チーム作成
              </button>

              <button
                onClick={() => setActiveTab('tournaments')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'tournaments'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                トーナメント表
              </button>

              <button
                onClick={() => setActiveTab('admin-products')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'admin-products'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                商品・在庫管理
              </button>

              <button
                onClick={() => setActiveTab('admin-orders')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'admin-orders'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                全体購入履歴
              </button>

              <button
                onClick={() => setActiveTab('admin-usage')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'admin-usage'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                商品使用履歴
              </button>

              <button
                onClick={() => setActiveTab('admin-messages')}
                className={`relative flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'admin-messages'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                メッセージ管理
                {adminUnreadMessageCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-black rounded-full">
                    {adminUnreadMessageCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors whitespace-nowrap shadow-xs ml-1"
                title="共有用URLを表示・コピー"
              >
                <Share2 className="w-3.5 h-3.5" />
                共有用URL
              </button>
            </div>

            <button
              onClick={() => setActiveTab('catalog')}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>購入ページを確認</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 w-full">
        {/* 購入ページ (Catalog) */}
        {activeTab === 'catalog' && (
          <ProductCatalog
            onOpenCart={() => setIsCartOpen(true)}
          />
        )}

        {/* 所持数ページ (Inventory & Consume items) */}
        {activeTab === 'inventory' && (
          <UserInventoryView onGoToShop={() => setActiveTab('catalog')} />
        )}

        {/* マイ購入履歴ページ (User Orders & Receipts) */}
        {activeTab === 'orders' && (
          <UserOrdersView onOpenCart={() => setIsCartOpen(true)} />
        )}

        {/* マイ商品使用履歴ページ (User Usage History) */}
        {activeTab === 'usage' && <UserUsageHistoryView />}

        {/* 参加チーム閲覧ページ (All users & admin) */}
        {activeTab === 'teams' && <TeamsListView />}

        {/* トーナメント表ページ (All users & admin) */}
        {activeTab === 'tournaments' && <TournamentView />}

        {/* 管理者へメッセージ・問い合わせ (User Messages) */}
        {activeTab === 'messages' && (
          <UserMessagesView onGoToShop={() => setActiveTab('catalog')} />
        )}

        {/* Admin only views */}
        {isAdmin && activeTab === 'admin-users' && <AdminUserManagement />}
        {isAdmin && activeTab === 'admin-teams' && <AdminTeamsView />}
        {isAdmin && activeTab === 'admin-products' && <AdminProductManagement />}
        {isAdmin && activeTab === 'admin-orders' && <AdminOrdersView />}
        {isAdmin && activeTab === 'admin-usage' && <AdminUsageHistoryView />}
        {isAdmin && activeTab === 'admin-messages' && <AdminMessagesView />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">SmartStore</span>
            <span>— 商品購入・所持数管理システム</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-slate-600 font-medium">
              ログイン中: {currentUser.name} (所持金: ¥{currentUser.balance.toLocaleString()})
            </span>
            {isAdmin && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="text-slate-500 hover:text-indigo-600 font-medium transition-colors flex items-center gap-1"
                title="管理者用：共有用URLを表示"
              >
                <Share2 className="w-3.5 h-3.5" />
                共有URL
              </button>
            )}
            <button
              onClick={logout}
              className="text-slate-500 hover:text-rose-600 font-medium transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </footer>

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* Share URL Modal (管理者のみ表示可能・利用者は非表示) */}
      {isAdmin && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {/* Floating Contact Admin Button for Regular Users */}
      {!isAdmin && (
        <aside aria-label="管理者へ連絡" className="fixed bottom-6 right-6 z-30">
          <button
            onClick={() => setIsContactModalOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 group cursor-pointer"
            title="運営管理者へ連絡・メッセージを送信"
          >
            <MessageSquare className="w-4 h-4 text-indigo-200 group-hover:text-white transition-colors" />
            <span>管理者へ連絡</span>
            {userUnreadReplyCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse ring-2 ring-white" />
            )}
          </button>
        </aside>
      )}

      {/* Quick Contact Modal for Users */}
      {!isAdmin && (
        <ContactAdminModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          onNavigateToHistory={() => setActiveTab('messages')}
        />
      )}

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
