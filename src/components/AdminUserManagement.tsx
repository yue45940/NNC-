import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { User } from '../types';
import { UserPlus, Wallet, Search, Edit3, Trash2, KeyRound, Eye, EyeOff, ShieldCheck, X, History, Copy, Package } from 'lucide-react';
import { normalizeLoginId, normalizePassword } from '../utils/credentials';

export const AdminUserManagement: React.FC = () => {
  const { users, orders, balanceLogs, addUser, updateUser, updateUserBalance, deleteUser, currentUser, showToast, getUserInventory, inventories } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Password visibility map for table
  const [visiblePasswords, setVisiblePasswords] = useState<{ [userId: string]: boolean }>({});

  // Balance Adjustment Modal State
  const [balanceTargetUser, setBalanceTargetUser] = useState<User | null>(null);
  const [balanceMode, setBalanceMode] = useState<'set_exact' | 'quick_charge'>('set_exact');
  const [exactBalanceInput, setExactBalanceInput] = useState<string>('0');
  const [chargeAmountInput, setChargeAmountInput] = useState<string>('3000');
  const [balanceReason, setBalanceReason] = useState<string>('管理者による所持金設定');

  // User History Modal State
  const [historyTargetUser, setHistoryTargetUser] = useState<User | null>(null);

  // User Purchased Inventory Modal State (管理者が利用者の所持数を確認)
  const [inventoryTargetUser, setInventoryTargetUser] = useState<User | null>(null);

  // User to delete confirmation modal
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Form State for Add User
  const [name, setName] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('pass123');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('営業部');
  const [initialBalance, setInitialBalance] = useState('5000');
  const [role, setRole] = useState<'user' | 'admin'>('user');

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    return (
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.loginId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleCopyUserCredentials = (u: User) => {
    const sharedUrl = window.location.origin;
    const text = `【SmartStore ログイン招待情報】\nアプリURL: ${sharedUrl}\n氏名: ${u.name}\nログインID: ${u.loginId}\nパスワード: ${u.password}\n初期所持金: ¥${u.balance.toLocaleString()}\n※上記URLにアクセスし、IDとパスワードを入力してログインしてください（全角入力は自動で半角に変換されます）。`;
    navigator.clipboard.writeText(text);
    showToast(`${u.name} さんのログイン招待情報（URL・ID・PASS）をコピーしました`, 'success');
  };

  // Open Balance Modal
  const openBalanceModal = (user: User) => {
    setBalanceTargetUser(user);
    setExactBalanceInput(user.balance.toString());
    setChargeAmountInput('3000');
    setBalanceMode('set_exact');
    setBalanceReason('管理者による所持金設定');
  };

  const handleApplyBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceTargetUser) return;

    let targetNewBalance = balanceTargetUser.balance;

    if (balanceMode === 'set_exact') {
      targetNewBalance = Math.max(0, parseInt(exactBalanceInput, 10) || 0);
    } else {
      const charge = parseInt(chargeAmountInput, 10) || 0;
      targetNewBalance = Math.max(0, balanceTargetUser.balance + charge);
    }

    const type = balanceMode === 'quick_charge' ? 'charge' : 'adjustment';
    await updateUserBalance(balanceTargetUser.id, targetNewBalance, balanceReason, type);
    setBalanceTargetUser(null);
  };

  // Open Add Modal
  const openAddModal = () => {
    setName('');
    setLoginId('');
    setPassword('pass123');
    setEmail('');
    setDepartment('開発部');
    setInitialBalance('5000');
    setRole('user');
    setIsAddUserModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = normalizeLoginId(loginId);
    const cleanPass = normalizePassword(password);

    if (!name.trim() || !cleanId || !cleanPass) {
      showToast('氏名、ログインID、パスワードをすべて入力してください。', 'error');
      return;
    }

    // Check duplicate loginId
    if (users.some((u) => normalizeLoginId(u.loginId) === cleanId)) {
      showToast(`ログインID「${cleanId}」は既に使用されています。別のIDを指定してください。`, 'error');
      return;
    }

    const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-blue-600', 'bg-purple-600', 'bg-rose-600', 'bg-amber-600', 'bg-teal-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    await addUser({
      name: name.trim(),
      loginId: cleanId,
      password: cleanPass,
      email: email.trim() || `${cleanId}@example.com`,
      department: department.trim() || '一般',
      balance: Math.max(0, parseInt(initialBalance, 10) || 0),
      role,
      avatarColor: randomColor,
      status: 'active',
    });

    setIsAddUserModalOpen(false);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const cleanId = normalizeLoginId(editingUser.loginId);
    const cleanPass = normalizePassword(editingUser.password);

    if (!editingUser.name.trim() || !cleanId || !cleanPass) {
      showToast('氏名、ログインID、パスワードをすべて入力してください。', 'error');
      return;
    }

    // Check duplicate loginId against others
    if (users.some((u) => u.id !== editingUser.id && normalizeLoginId(u.loginId) === cleanId)) {
      showToast(`ログインID「${cleanId}」は既に他の利用者に使用されています。`, 'error');
      return;
    }

    await updateUser(editingUser.id, {
      name: editingUser.name.trim(),
      loginId: cleanId,
      password: cleanPass,
      email: editingUser.email.trim(),
      department: editingUser.department.trim(),
      role: editingUser.role,
      status: editingUser.status,
    });

    setEditingUser(null);
  };

  const getUserStats = (userId: string) => {
    const userOrders = orders.filter((o) => o.userId === userId && o.status === 'completed');
    const spent = userOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    return { orderCount: userOrders.length, totalSpent: spent };
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Action */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <KeyRound className="w-4 h-4" />
            <span>利用者管理・ID/PASS設定・所持金管理</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            利用者の登録・ID/PASS発行・所持金設定
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            管理者は利用者のログインIDとパスワードの発行・変更、および所持金（残高）の指定を行えます
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          新規利用者・ID/PASS登録
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">総登録利用者数</span>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums mt-1">
            {users.length} 名
          </div>
          <p className="text-[11px] text-slate-400 mt-1">管理者発行・承認済みアカウント</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">全所持金残高総額</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 tabular-nums mt-1">
            ¥{users.reduce((sum, u) => sum + u.balance, 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">※管理者のみが変更・チャージ可能</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">平均所持金</span>
          <div className="text-2xl font-bold font-mono text-indigo-600 tabular-nums mt-1">
            ¥{users.length > 0 ? Math.round(users.reduce((sum, u) => sum + u.balance, 0) / users.length).toLocaleString() : 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">1ユーザーあたりの平均保有残高</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>全社 手元所持品数</span>
            <Package className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-600 tabular-nums mt-1">
            {inventories.reduce((sum, item) => sum + item.quantity, 0)} 点
          </div>
          <p className="text-[11px] text-slate-400 mt-1">利用者が現在保有中の商品合計</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="氏名・ログインID・所属で検索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <span className="text-xs text-slate-500">
          {filteredUsers.length} 名表示中
        </span>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">氏名 / 所属</th>
                <th className="px-4 py-3.5">ログインID</th>
                <th className="px-4 py-3.5">パスワード (管理者確認)</th>
                <th className="px-4 py-3.5">所持金（管理者指定）</th>
                <th className="px-4 py-3.5">購入商品の所持数</th>
                <th className="px-4 py-3.5">権限</th>
                <th className="px-6 py-3.5 text-right">所持数・ID/PASS・所持金操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isAdmin = u.role === 'admin';
                const isPasswordVisible = visiblePasswords[u.id];

                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    {/* User info */}
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${u.avatarColor}`}>
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">{u.name}</span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">{u.department} · {u.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Login ID */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                        {u.loginId}
                      </span>
                    </td>

                    {/* Password */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded">
                          {isPasswordVisible ? u.password : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(u.id)}
                          className="text-slate-400 hover:text-slate-600 p-0.5"
                          title={isPasswordVisible ? '隠す' : '表示する'}
                        >
                          {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* Balance */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-emerald-700 tabular-nums">
                          ¥{u.balance.toLocaleString()}
                        </span>
                        <button
                          onClick={() => openBalanceModal(u)}
                          className="px-2 py-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors"
                          title="所持金を変更またはチャージ"
                        >
                          所持金設定
                        </button>
                      </div>
                    </td>

                    {/* Owned products count (管理者が利用者の所持数を確認) */}
                    <td className="px-4 py-3.5">
                      {(() => {
                        const userInv = getUserInventory(u.id);
                        const totalOwned = userInv.reduce((sum, item) => sum + item.quantity, 0);
                        const distinctTypes = userInv.filter((item) => item.quantity > 0).length;

                        return (
                          <button
                            onClick={() => setInventoryTargetUser(u)}
                            className="group inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50 hover:bg-indigo-50/70 transition-all text-left"
                            title={`${u.name} さんの購入商品の所持数明細を確認`}
                          >
                            <Package className="w-4 h-4 text-indigo-600 shrink-0 group-hover:scale-110 transition-transform" />
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-indigo-600">
                                  {totalOwned} 点
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">所持</span>
                              </div>
                              <span className="text-[10px] text-slate-400 block -mt-0.5">
                                {distinctTypes > 0 ? `${distinctTypes}種の商品` : '所持なし'}
                              </span>
                            </div>
                          </button>
                        );
                      })()}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-medium ${
                          isAdmin
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isAdmin ? '管理者' : '一般利用者'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setInventoryTargetUser(u)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="購入商品の所持数明細を確認"
                        >
                          <Package className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setHistoryTargetUser(u)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="所持金取引履歴を見る"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleCopyUserCredentials(u)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="ログイン招待情報（URL・ID・PASS）をコピー"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setEditingUser(u)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="ID・パスワード・ユーザー情報の編集"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setUserToDelete(u)}
                          disabled={currentUser?.id === u.id}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Modal: 所持金指定・チャージモーダル */}
      {balanceTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">利用者の所持金設定（管理者専用）</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  対象: <strong className="text-slate-800">{balanceTargetUser.name}</strong> 
                  （現在残高: ¥{balanceTargetUser.balance.toLocaleString()}）
                </p>
              </div>
              <button
                onClick={() => setBalanceTargetUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyBalance} className="p-6 space-y-4">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setBalanceMode('set_exact')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    balanceMode === 'set_exact' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  所持金を直接指定
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceMode('quick_charge')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    balanceMode === 'quick_charge' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  金額を追加チャージ
                </button>
              </div>

              {balanceMode === 'set_exact' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    指定する所持金の総額 (円) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={exactBalanceInput}
                    onChange={(e) => setExactBalanceInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    {[0, 3000, 5000, 10000, 20000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setExactBalanceInput(preset.toString())}
                        className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded font-mono text-slate-700"
                      >
                        ¥{preset.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    チャージ金額 (円) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={chargeAmountInput}
                    onChange={(e) => setChargeAmountInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    {[1000, 3000, 5000, 10000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setChargeAmountInput(preset.toString())}
                        className="text-[11px] px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-mono font-medium"
                      >
                        +¥{preset.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  設定・チャージ理由（履歴に記録されます）
                </label>
                <input
                  type="text"
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  placeholder="例: 管理者による所持金直接指定 / 現金受取チャージ / 福利厚生"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>変更前所持金:</span>
                  <span className="font-mono">¥{balanceTargetUser.balance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold">
                  <span>変更後所持金:</span>
                  <span className="font-mono text-emerald-600">
                    ¥
                    {(balanceMode === 'set_exact'
                      ? Math.max(0, parseInt(exactBalanceInput, 10) || 0)
                      : Math.max(0, balanceTargetUser.balance + (parseInt(chargeAmountInput, 10) || 0))
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBalanceTargetUser(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  所持金を確定・更新する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: 新規利用者登録 (管理者によるID・PASS・所持金設定) */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">新規利用者・ID/PASS登録</h2>
                <p className="text-xs text-slate-500 mt-0.5">管理者が利用者のログイン情報と所持金を設定します</p>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  氏名 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="例: 田中 雅人"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-indigo-700 mb-1">
                    ログインID (ID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例: tanaka"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-indigo-700 mb-1">
                    パスワード (PASS) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例: pass123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    所属部署
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    初期所持金 (円) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  権限
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="user">一般利用者（購入ページ・所持数ページのみ閲覧可能）</option>
                  <option value="admin">管理者（商品追加・ユーザー管理・ID/PASS設定・所持金変更権限）</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  登録を完了する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: 利用者・ID/PASS編集 */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">利用者ID・PASS・情報の変更</h2>
                <p className="text-xs text-slate-500 mt-0.5">管理者はログインIDとパスワードをいつでも再設定できます</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">氏名</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-indigo-700 mb-1">ログインID (ID) *</label>
                  <input
                    type="text"
                    required
                    value={editingUser.loginId}
                    onChange={(e) => setEditingUser({ ...editingUser, loginId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-indigo-700 mb-1">パスワード (PASS) *</label>
                  <input
                    type="text"
                    required
                    value={editingUser.password}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">所属部署</label>
                  <input
                    type="text"
                    value={editingUser.department}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">権限</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'user' | 'admin' })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="user">一般利用者</option>
                    <option value="admin">管理者</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  変更を保存する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: 所持金取引ログ */}
      {historyTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {historyTargetUser.name} さんの所持金変動履歴
                </h2>
                <p className="text-xs text-slate-500">
                  現在の残高: <strong className="font-mono text-emerald-600">¥{historyTargetUser.balance.toLocaleString()}</strong>
                </p>
              </div>
              <button
                onClick={() => setHistoryTargetUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {balanceLogs.filter((l) => l.userId === historyTargetUser.id).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">履歴がありません</p>
              ) : (
                balanceLogs
                  .filter((l) => l.userId === historyTargetUser.id)
                  .map((log) => {
                    const isPositive = log.amount > 0;
                    return (
                      <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-slate-800">{log.reason}</div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {new Date(log.createdAt).toLocaleString('ja-JP')} · 操作者: {log.operator}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`font-mono font-bold ${isPositive ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {isPositive ? `+¥${log.amount.toLocaleString()}` : `-¥${Math.abs(log.amount).toLocaleString()}`}
                          </span>
                          <span className="block text-[11px] text-slate-400 font-mono">
                            残高: ¥{log.balanceAfter.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setHistoryTargetUser(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: 購入した商品の所持数確認 (管理者は利用者の購入した物の所持数を確認できる) */}
      {inventoryTargetUser && (() => {
        const userInventory = getUserInventory(inventoryTargetUser.id);
        const totalOwned = userInventory.reduce((sum, item) => sum + item.quantity, 0);
        const totalAcquired = userInventory.reduce((sum, item) => sum + item.totalAcquired, 0);
        const totalUsed = userInventory.reduce((sum, item) => sum + item.totalUsed, 0);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="fixed inset-0" onClick={() => setInventoryTargetUser(null)} aria-hidden="true" />

            <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] z-10">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">
                        {inventoryTargetUser.name} さんの所持商品・所持数明細
                      </h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                        管理者確認
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ログインID: <span className="font-mono font-semibold text-slate-700">{inventoryTargetUser.loginId}</span> · 部署: {inventoryTargetUser.department} · 現在の所持金: <span className="font-mono font-bold text-emerald-600">¥{inventoryTargetUser.balance.toLocaleString()}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setInventoryTargetUser(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50/80 border-b border-slate-100">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-center">
                  <span className="text-[11px] font-medium text-slate-500 block">現在の手元所持総数</span>
                  <span className="text-xl font-bold font-mono text-emerald-600 tabular-nums">
                    {totalOwned} 点
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">手元で使用可能</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-center">
                  <span className="text-[11px] font-medium text-slate-500 block">累計購入総数</span>
                  <span className="text-xl font-bold font-mono text-indigo-600 tabular-nums">
                    {totalAcquired} 点
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">購入履歴累計</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-center">
                  <span className="text-[11px] font-medium text-slate-500 block">累計使用済み数</span>
                  <span className="text-xl font-bold font-mono text-amber-600 tabular-nums">
                    {totalUsed} 点
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">消費済みアイテム</span>
                </div>
              </div>

              {/* Items List */}
              <div className="p-6 overflow-y-auto space-y-3 flex-1">
                {userInventory.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                    <p className="text-xs font-semibold text-slate-600">まだ商品を購入していません</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">利用者が購入ページで商品を購入すると、ここに所持数としてリアルタイムに反映されます</p>
                  </div>
                ) : (
                  userInventory.map((item) => {
                    const isOutOfStock = item.quantity === 0;

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                          isOutOfStock
                            ? 'bg-slate-50 border-slate-200 opacity-60'
                            : 'bg-white border-slate-200 shadow-2xs hover:border-indigo-200'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <img
                            src={item.image}
                            alt={item.productName}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200/80"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {item.productName}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500">
                              <span>単価: ¥{item.price.toLocaleString()}</span>
                              <span>累計購入: {item.totalAcquired}点</span>
                              <span>使用済み: {item.totalUsed}点</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              最終更新: {new Date(item.updatedAt).toLocaleString('ja-JP')}
                            </span>
                          </div>
                        </div>

                        {/* Current owned quantity badge */}
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 block mb-0.5">現在所持数</span>
                          <span
                            className={`inline-flex items-center font-mono font-bold text-sm px-3 py-1 rounded-lg border tabular-nums ${
                              item.quantity > 0
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {item.quantity > 0 ? `${item.quantity} 点` : '0 点 (使用済)'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  ※利用者は「所持数ページ」からこれらの所持商品を使用（消費）できます
                </span>
                <button
                  onClick={() => setInventoryTargetUser(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 5. Modal: 利用者削除確認モーダル */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">利用者の削除確認</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                利用者「<span className="font-bold text-slate-900">{userToDelete.name}</span>」（ログインID: <span className="font-mono font-bold text-slate-800">{userToDelete.loginId}</span>）を削除しますか？<br />
                この操作は取り消せません。
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await deleteUser(userToDelete.id);
                    setUserToDelete(null);
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  削除する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
