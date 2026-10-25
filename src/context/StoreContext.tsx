import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Product, User, Order, BalanceLog, CartItem, ActiveTab, UserInventoryItem, ItemUsageLog, AppSettings, DEFAULT_APP_SETTINGS, AdminMessage, MessageCategory, Team, Tournament } from '../types';
import { INITIAL_PRODUCTS, INITIAL_USERS, INITIAL_ORDERS, INITIAL_BALANCE_LOGS, INITIAL_INVENTORIES, INITIAL_USAGE_LOGS, INITIAL_MESSAGES, INITIAL_TEAMS, INITIAL_TOURNAMENTS } from '../data/seedData';
import { normalizeLoginId, normalizePassword } from '../utils/credentials';
import { normalizeTeam } from '../utils/teamUtils';
import { generateTournament, randomizeTournamentMatchups as randomizeMatchupsUtil, recordMatchOutcome, resetMatchOutcome } from '../utils/tournamentUtils';

interface ToastInfo {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface StoreContextType {
  products: Product[];
  users: User[];
  orders: Order[];
  balanceLogs: BalanceLog[];
  inventories: UserInventoryItem[];
  usageLogs: ItemUsageLog[];
  messages: AdminMessage[];
  teams: Team[];
  tournaments: Tournament[];
  adminUnreadMessageCount: number;
  userUnreadReplyCount: number;
  currentUser: User | null;
  isAuthenticated: boolean;
  cart: CartItem[];
  activeTab: ActiveTab;
  toasts: ToastInfo[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
  // Auth
  login: (loginId: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  switchUserById: (userId: string) => void;
  // Team actions (閲覧は全員・作成編集は管理者)
  addTeam: (teamData: Omit<Team, 'id' | 'createdAt'>) => Promise<Team | null>;
  updateTeam: (id: string, updates: Partial<Team>) => Promise<boolean>;
  deleteTeam: (id: string) => Promise<boolean>;
  // Tournament actions (閲覧は全員・作成編集・ランダム抽選は管理者)
  addTournament: (params: { name: string; description?: string; selectedTeamIds: string[]; randomShuffle?: boolean }) => Promise<Tournament | null>;
  updateTournament: (id: string, updates: Partial<Tournament>) => Promise<boolean>;
  deleteTournament: (id: string) => Promise<boolean>;
  randomizeTournamentMatchups: (id: string) => Promise<boolean>;
  recordMatchResult: (tournamentId: string, matchId: string, winnerId: string, team1Score?: number, team2Score?: number) => Promise<boolean>;
  resetMatchResult: (tournamentId: string, matchId: string) => Promise<boolean>;
  // Product actions (Admin only)
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void> | void;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void> | void;
  batchUpdateProducts: (ids: string[], updates: Partial<Product>) => Promise<void> | void;
  deleteProduct: (id: string) => Promise<void> | void;
  // User actions (Admin sets ID, PASS, and Balance)
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void> | void;
  updateUser: (id: string, user: Partial<User>) => Promise<void> | void;
  updateUserBalance: (userId: string, newBalance: number, reason: string, type?: 'charge' | 'adjustment') => Promise<boolean> | boolean;
  deleteUser: (id: string) => Promise<void> | void;
  // Inventory action (所持商品の使用)
  useItem: (productId: string, quantity?: number, note?: string) => Promise<boolean> | boolean;
  getUserInventory: (userId: string) => UserInventoryItem[];
  // Cart & Checkout
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  checkout: () => Promise<{ success: boolean; error?: string; order?: Order }>;
  // Order actions
  cancelOrder: (orderId: string, reason?: string) => Promise<boolean> | boolean;
  deleteOrder: (orderId: string) => Promise<boolean> | boolean;
  deleteOrders: (orderIds: string[]) => Promise<boolean> | boolean;
  clearAllOrders: () => Promise<boolean> | boolean;
  // Usage Log actions (Admin only: 使用履歴の削除)
  deleteUsageLog: (logId: string) => Promise<boolean> | boolean;
  deleteUsageLogs: (logIds: string[]) => Promise<boolean> | boolean;
  clearAllUsageLogs: () => Promise<boolean> | boolean;
  // Message actions (双方向: 利用者↔管理者)
  sendMessage: (content: string, subject?: string, category?: MessageCategory) => Promise<boolean>;
  sendAdminMessage: (params: { recipientUserId: string; content: string; subject?: string; category?: MessageCategory }) => Promise<boolean>;
  replyMessage: (messageId: string, replyContent: string) => Promise<boolean>;
  userReplyToAdminMessage: (messageId: string, replyContent: string) => Promise<boolean>;
  markMessageAsRead: (messageId: string) => Promise<boolean>;
  markReplyAsRead: (messageId: string) => Promise<boolean>;
  markAdminMessageAsReadByUser: (messageId: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  clearAllMessages: () => Promise<boolean>;
  // Settings (Admin title & event customizations: タイトル変更)
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  // Utilities
  resetDemoData: () => void;
}

const STORAGE_KEY = 'smartstore_app_v3_secure';

export const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`[LocalStorage] Failed to set item for key "${key}":`, e);
  }
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_products`);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_users`);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_orders`);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [balanceLogs, setBalanceLogs] = useState<BalanceLog[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_logs`);
      return saved ? JSON.parse(saved) : INITIAL_BALANCE_LOGS;
    } catch {
      return INITIAL_BALANCE_LOGS;
    }
  });

  const [inventories, setInventories] = useState<UserInventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_inventories`);
      return saved ? JSON.parse(saved) : INITIAL_INVENTORIES;
    } catch {
      return INITIAL_INVENTORIES;
    }
  });

  const [usageLogs, setUsageLogs] = useState<ItemUsageLog[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_usage_logs`);
      return saved ? JSON.parse(saved) : INITIAL_USAGE_LOGS;
    } catch {
      return INITIAL_USAGE_LOGS;
    }
  });

  const [messages, setMessages] = useState<AdminMessage[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_messages`);
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  const [teams, setTeams] = useState<Team[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_teams`);
      return saved ? JSON.parse(saved).map(normalizeTeam) : INITIAL_TEAMS.map(normalizeTeam);
    } catch {
      return INITIAL_TEAMS.map(normalizeTeam);
    }
  });

  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_tournaments`);
      return saved ? JSON.parse(saved) : INITIAL_TOURNAMENTS;
    } catch {
      return INITIAL_TOURNAMENTS;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`${STORAGE_KEY}_current_user_id`);
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`${STORAGE_KEY}_is_authenticated`) === 'true';
    } catch {
      return false;
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_cart`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTabState] = useState<ActiveTab>('catalog');
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  // App & Event Title Settings (Admin customizable)
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
      return saved ? { ...DEFAULT_APP_SETTINGS, ...JSON.parse(saved) } : DEFAULT_APP_SETTINGS;
    } catch {
      return DEFAULT_APP_SETTINGS;
    }
  });

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
    document.title = `${settings.appTitle} - イベント決済システム`;
  }, [settings]);

  const isSyncingRef = useRef(false);
  // Timestamp to protect local mutations from being overwritten by in-flight/polling sync
  const lastLocalMutationTimeRef = useRef<number>(0);

  const latestStateRef = useRef({
    products,
    users,
    teams,
    tournaments,
    settings,
    orders,
    inventories,
    balanceLogs,
    usageLogs,
    messages,
  });

  useEffect(() => {
    latestStateRef.current = {
      products,
      users,
      teams,
      tournaments,
      settings,
      orders,
      inventories,
      balanceLogs,
      usageLogs,
      messages,
    };
  }, [products, users, teams, tournaments, settings, orders, inventories, balanceLogs, usageLogs, messages]);

  const getLocalLastModified = (): number => {
    try {
      return parseInt(localStorage.getItem(`${STORAGE_KEY}_last_modified`) || '0', 10);
    } catch {
      return 0;
    }
  };

  const recordLocalMutation = () => {
    const now = Date.now();
    lastLocalMutationTimeRef.current = now;
    safeSetItem(`${STORAGE_KEY}_last_modified`, now.toString());
  };

  // Sync complete or partial data to server
  const syncToServer = async (payload: Record<string, any>) => {
    recordLocalMutation();
    try {
      const res = await fetch('/api/store/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, lastModified: getLocalLastModified() }),
      });
      if (!res.ok) {
        console.warn('[StoreContext] syncToServer returned non-OK status:', res.status);
      }
    } catch (e) {
      console.warn('[StoreContext] syncToServer network error:', e);
    }
  };

  // Sync latest store data from server across all devices
  const syncFromServer = async () => {
    if (isSyncingRef.current) return;
    // Skip polling overwrite if a local edit occurred within the last 6.5 seconds
    if (Date.now() - lastLocalMutationTimeRef.current < 6500) return;
    try {
      isSyncingRef.current = true;
      const localModified = getLocalLastModified();
      const query = localModified > 0 ? `?since=${localModified}` : '';
      const res = await fetch(`/api/store/data${query}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          // If server confirmed no modification since localModified, skip all processing
          if (json.notModified) {
            return;
          }

          if (Date.now() - lastLocalMutationTimeRef.current < 6500) return;
          const s = json.data;
          if (!s) return;
          const serverModified = typeof s.lastModified === 'number' ? s.lastModified : 0;

          // If local data is newer than server data (e.g. server restarted or autoscaled a fresh instance),
          // push local data to the server to warm up the new instance and prevent wiping local data!
          if (localModified > 0 && (serverModified === 0 || localModified > serverModified + 1000)) {
            console.log('[StoreContext] Autoscaled/fresh server instance detected or local changes are newer, syncing local data to server...');
            const cur = latestStateRef.current;
            await syncToServer({
              products: cur.products,
              users: cur.users,
              teams: cur.teams,
              tournaments: cur.tournaments,
              settings: cur.settings,
              orders: cur.orders,
              inventories: cur.inventories,
              balanceLogs: cur.balanceLogs,
              usageLogs: cur.usageLogs,
              messages: cur.messages,
              lastModified: localModified,
            });
            return;
          }

          if (Array.isArray(s.users) && s.users.length > 0) {
            setUsers(s.users);
            safeSetItem(`${STORAGE_KEY}_users`, JSON.stringify(s.users));
          }
          if (Array.isArray(s.products)) {
            const pMap = new Map<string, Product>();
            s.products.forEach((p: Product) => {
              if (p && p.id && !pMap.has(p.id)) pMap.set(p.id, p);
            });
            const prods = Array.from(pMap.values());
            setProducts(prods);
            safeSetItem(`${STORAGE_KEY}_products`, JSON.stringify(prods));
          }
          if (Array.isArray(s.orders)) {
            setOrders(s.orders);
            safeSetItem(`${STORAGE_KEY}_orders`, JSON.stringify(s.orders));
          }
          if (Array.isArray(s.balanceLogs)) {
            setBalanceLogs(s.balanceLogs);
            safeSetItem(`${STORAGE_KEY}_logs`, JSON.stringify(s.balanceLogs));
          }
          if (Array.isArray(s.inventories)) {
            setInventories(s.inventories);
            safeSetItem(`${STORAGE_KEY}_inventories`, JSON.stringify(s.inventories));
          }
          if (Array.isArray(s.usageLogs)) {
            setUsageLogs(s.usageLogs);
            safeSetItem(`${STORAGE_KEY}_usage_logs`, JSON.stringify(s.usageLogs));
          }
          if (Array.isArray(s.messages)) {
            setMessages(s.messages);
            safeSetItem(`${STORAGE_KEY}_messages`, JSON.stringify(s.messages));
          }
          if (Array.isArray(s.teams)) {
            const normTeams = s.teams.map(normalizeTeam);
            setTeams(normTeams);
            safeSetItem(`${STORAGE_KEY}_teams`, JSON.stringify(normTeams));
          }
          if (Array.isArray(s.tournaments)) {
            setTournaments(s.tournaments);
            safeSetItem(`${STORAGE_KEY}_tournaments`, JSON.stringify(s.tournaments));
          }
          if (s.settings) {
            setSettings((prev) => {
              const updated = { ...prev, ...s.settings };
              safeSetItem(`${STORAGE_KEY}_settings`, JSON.stringify(updated));
              return updated;
            });
          }
          if (serverModified > 0) {
            safeSetItem(`${STORAGE_KEY}_last_modified`, serverModified.toString());
          }
        }
      }
    } catch {
      // offline fallback
    } finally {
      isSyncingRef.current = false;
    }
  };

  // Gentle polling: only poll when tab is visible, and immediately on tab focus/visibility change
  useEffect(() => {
    syncFromServer();

    const interval = setInterval(() => {
      // Avoid polling in hidden/minimized tabs to minimize CPU, network, and autoscaling triggers
      if (document.hidden) return;
      syncFromServer();
    }, 10000);

    const onVisible = () => {
      if (!document.hidden) {
        syncFromServer();
      }
    };

    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    lastLocalMutationTimeRef.current = Date.now();
    const nextSettings = { ...settings, ...newSettings };
    setSettings(nextSettings);
    safeSetItem(`${STORAGE_KEY}_settings`, JSON.stringify(nextSettings));
    syncToServer({ settings: nextSettings });
    showToast('タイトル・イベント表示設定を保存しました', 'success');
  };

  // Safe sync to local storage
  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_products`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_orders`, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_logs`, JSON.stringify(balanceLogs));
  }, [balanceLogs]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_inventories`, JSON.stringify(inventories));
  }, [inventories]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_usage_logs`, JSON.stringify(usageLogs));
  }, [usageLogs]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_messages`, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_teams`, JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_tournaments`, JSON.stringify(tournaments));
  }, [tournaments]);

  useEffect(() => {
    if (currentUserId) {
      safeSetItem(`${STORAGE_KEY}_current_user_id`, currentUserId);
    } else {
      try {
        localStorage.removeItem(`${STORAGE_KEY}_current_user_id`);
      } catch {}
    }
  }, [currentUserId]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_is_authenticated`, isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_cart`, JSON.stringify(cart));
  }, [cart]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Find active user
  const currentUser = users.find((u) => u.id === currentUserId) || null;

  // Enforce role-based tab restriction:
  // "利用者は、購入ページと所持数ページのみを閲覧可能"
  const setActiveTab = (tab: ActiveTab) => {
    if (!currentUser || currentUser.role !== 'admin') {
      if (tab.startsWith('admin')) {
        showToast('管理者専用ページにはアクセスできません', 'error');
        setActiveTabState('catalog');
        return;
      }
    }
    setActiveTabState(tab);
  };

  // Login handler with server validation and full-width/half-width normalization
  const login = async (
    loginId: string,
    pass: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    const cleanId = normalizeLoginId(loginId);
    const cleanPass = normalizePassword(pass);

    if (!cleanId || !cleanPass) {
      const err = 'IDとパスワードを入力してください';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    // 1. Try server-side authentication first to guarantee cross-device consistency
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId: cleanId, password: cleanPass }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success && data?.user) {
        const authUser: User = data.user;
        setUsers((prev) => {
          const exists = prev.some((u) => u.id === authUser.id);
          return exists ? prev.map((u) => (u.id === authUser.id ? authUser : u)) : [...prev, authUser];
        });
        setCurrentUserId(authUser.id);
        setIsAuthenticated(true);
        showToast(`${authUser.name} さん、ログインしました`, 'success');
        if (authUser.role === 'admin') {
          setActiveTabState('admin-users');
        } else {
          setActiveTabState('catalog');
        }
        return { success: true, user: authUser };
      } else if (data?.error) {
        showToast(data.error, 'error');
        return { success: false, error: data.error };
      }
    } catch (netErr) {
      console.warn('[StoreContext] Server login offline, checking local storage:', netErr);
    }

    // 2. Offline fallback: local memory check with normalized credentials
    const target = users.find((u) => {
      const uId = normalizeLoginId(u.loginId);
      const uPass = normalizePassword(u.password);
      return uId === cleanId && uPass === cleanPass;
    });

    if (!target) {
      const idExists = users.some((u) => normalizeLoginId(u.loginId) === cleanId);
      const errorMsg = idExists
        ? 'パスワードが正しくありません。半角・大文字小文字をご確認ください。'
        : `ログインID「${loginId}」は登録されていません。管理者が発行したIDをご確認ください。`;
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }

    if (target.status === 'suspended') {
      const err = 'このアカウントは現在利用停止されています';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    setCurrentUserId(target.id);
    setIsAuthenticated(true);
    showToast(`${target.name} さん、ログインしました`, 'success');

    if (target.role === 'admin') {
      setActiveTabState('admin-users');
    } else {
      setActiveTabState('catalog');
    }

    return { success: true, user: target };
  };

  // Logout handler
  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUserId(null);
    setCart([]);
    setActiveTabState('catalog');
    showToast('ログアウトしました', 'info');
  };

  // Switch user by ID (for testing)
  const switchUserById = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUserId(target.id);
      setIsAuthenticated(true);
      showToast(`${target.name} に切り替えました`, 'info');
      if (target.role === 'admin') {
        setActiveTabState('admin-users');
      } else {
        setActiveTabState('catalog');
      }
    }
  };

  // Product Management (Admin)
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>) => {
    lastLocalMutationTimeRef.current = Date.now();
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    // Deduplicate against existing products
    const filtered = products.filter(
      (p) => p.name.trim() !== newProduct.name.trim() && p.id !== newProduct.id
    );
    const nextProducts = [newProduct, ...filtered];
    setProducts(nextProducts);
    safeSetItem(`${STORAGE_KEY}_products`, JSON.stringify(nextProducts));

    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
    } catch (e) {
      console.warn('Failed to post product directly to server API:', e);
    }
    await syncToServer({ products: nextProducts });

    showToast(`新商品「${newProduct.name}」を追加しました`, 'success');
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    lastLocalMutationTimeRef.current = Date.now();
    const nextProducts = products.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setProducts(nextProducts);
    safeSetItem(`${STORAGE_KEY}_products`, JSON.stringify(nextProducts));

    try {
      await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.warn('Failed to update product directly on server API:', e);
    }
    await syncToServer({ products: nextProducts });

    showToast('商品情報を更新しました', 'success');
  };

  const batchUpdateProducts = async (ids: string[], updates: Partial<Product>) => {
    if (!ids || ids.length === 0) return;
    lastLocalMutationTimeRef.current = Date.now();
    const idSet = new Set(ids);
    const nextProducts = products.map((p) => (idSet.has(p.id) ? { ...p, ...updates } : p));
    setProducts(nextProducts);
    safeSetItem(`${STORAGE_KEY}_products`, JSON.stringify(nextProducts));

    await syncToServer({ products: nextProducts });
  };

  const deleteProduct = async (id: string) => {
    lastLocalMutationTimeRef.current = Date.now();
    const target = products.find((p) => p.id === id);
    const nextProducts = products.filter((p) => p.id !== id);
    setProducts(nextProducts);
    setCart((prev) => prev.filter((item) => item.product.id !== id));
    safeSetItem(`${STORAGE_KEY}_products`, JSON.stringify(nextProducts));

    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Failed to delete product directly on server API:', e);
    }
    await syncToServer({ products: nextProducts });

    showToast(`商品「${target?.name || ''}」を削除しました`, 'info');
  };

  // User Management (Admin sets ID, PASS, Balance)
  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    lastLocalMutationTimeRef.current = Date.now();
    const cleanLoginId = normalizeLoginId(userData.loginId);
    const cleanPassword = normalizePassword(userData.password);

    const newUserId = `usr-${Date.now().toString(36)}`;
    const newUser: User = {
      ...userData,
      id: newUserId,
      loginId: cleanLoginId,
      password: cleanPassword,
      createdAt: new Date().toISOString(),
    };

    // 1. Immediately update local state
    const filtered = users.filter((u) => normalizeLoginId(u.loginId) !== cleanLoginId);
    const nextUsers = [...filtered, newUser];
    setUsers(nextUsers);
    safeSetItem(`${STORAGE_KEY}_users`, JSON.stringify(nextUsers));

    let nextLogs = balanceLogs;
    if (newUser.balance > 0) {
      const log: BalanceLog = {
        id: `log-${Date.now()}`,
        userId: newUserId,
        userName: newUser.name,
        type: 'charge',
        amount: newUser.balance,
        balanceAfter: newUser.balance,
        reason: '管理者による初期所持金付与',
        operator: currentUser?.role === 'admin' ? currentUser.name : '管理者',
        createdAt: new Date().toISOString(),
      };
      nextLogs = [log, ...balanceLogs];
      setBalanceLogs(nextLogs);
      safeSetItem(`${STORAGE_KEY}_logs`, JSON.stringify(nextLogs));
    }

    // 2. Persist to server database via API immediately
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      console.log('[StoreContext] Successfully registered & synced user:', cleanLoginId);
    } catch (err) {
      console.error('[StoreContext] Failed to send user to server API:', err);
    }
    await syncToServer({ users: nextUsers, balanceLogs: nextLogs });

    showToast(`利用者を登録しました（ID: ${newUser.loginId} / 所持金: ¥${newUser.balance.toLocaleString()}）`, 'success');
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    lastLocalMutationTimeRef.current = Date.now();
    const cleanUpdates = { ...updates };
    if (cleanUpdates.loginId) cleanUpdates.loginId = normalizeLoginId(cleanUpdates.loginId);
    if (cleanUpdates.password) cleanUpdates.password = normalizePassword(cleanUpdates.password);

    const nextUsers = users.map((u) => (u.id === id ? { ...u, ...cleanUpdates } : u));
    setUsers(nextUsers);
    safeSetItem(`${STORAGE_KEY}_users`, JSON.stringify(nextUsers));

    try {
      await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanUpdates),
      });
    } catch (e) {
      console.warn('Failed to update user on server:', e);
    }
    await syncToServer({ users: nextUsers });

    showToast('利用者情報（ID/PASS/所属等）を更新しました', 'success');
  };

  // Update User Balance - Only Admin can change balance
  const updateUserBalance = async (
    userId: string,
    newBalance: number,
    reason: string,
    type: 'charge' | 'adjustment' = 'adjustment'
  ): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin') {
      showToast('所持金の変更は管理者のみ行えます', 'error');
      return false;
    }

    const target = users.find((u) => u.id === userId);
    if (!target) {
      showToast('対象の利用者が見つかりませんでした', 'error');
      return false;
    }

    const currentBalance = target.balance;
    const diff = newBalance - currentBalance;

    if (diff === 0) {
      showToast('所持金に変更はありません', 'info');
      return true;
    }

    lastLocalMutationTimeRef.current = Date.now();
    const nextUsers = users.map((u) => (u.id === userId ? { ...u, balance: newBalance } : u));
    setUsers(nextUsers);
    safeSetItem(`${STORAGE_KEY}_users`, JSON.stringify(nextUsers));

    const log: BalanceLog = {
      id: `log-${Date.now()}`,
      userId: target.id,
      userName: target.name,
      type: type,
      amount: diff,
      balanceAfter: newBalance,
      reason: reason.trim() || (diff > 0 ? '管理者による残高チャージ' : '管理者による所持金直接指定'),
      operator: `${currentUser.name} (管理者)`,
      createdAt: new Date().toISOString(),
    };

    const nextLogs = [log, ...balanceLogs];
    setBalanceLogs(nextLogs);
    safeSetItem(`${STORAGE_KEY}_logs`, JSON.stringify(nextLogs));

    try {
      await fetch(`/api/users/${userId}/balance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newBalance,
          diff,
          reason: log.reason,
          type,
          operator: log.operator,
          logId: log.id,
        }),
      });
    } catch (e) {
      console.warn('Failed to update user balance on server:', e);
    }
    await syncToServer({ users: nextUsers, balanceLogs: nextLogs });

    showToast(
      `${target.name} の所持金を ¥${newBalance.toLocaleString()} に変更しました（${diff > 0 ? '+' : ''}¥${diff.toLocaleString()}）`,
      'success'
    );
    return true;
  };

  const deleteUser = async (id: string) => {
    if (currentUser && id === currentUser.id) {
      showToast('現在ログイン中の利用者は削除できません', 'error');
      return;
    }
    lastLocalMutationTimeRef.current = Date.now();
    const target = users.find((u) => u.id === id);
    const nextUsers = users.filter((u) => u.id !== id);
    setUsers(nextUsers);
    safeSetItem(`${STORAGE_KEY}_users`, JSON.stringify(nextUsers));

    try {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Failed to delete user on server:', e);
    }
    await syncToServer({ users: nextUsers });

    showToast(`利用者「${target?.name || ''}」を削除しました`, 'info');
  };

  // Inventory: Get owned items for a user
  const getUserInventory = (userId: string) => {
    return inventories.filter((inv) => inv.userId === userId);
  };

  // Inventory: 使用する (Use / Consume item)
  const useItem = async (productId: string, quantityToUse = 1, note?: string): Promise<boolean> => {
    if (!currentUser) return false;
    recordLocalMutation();

    const userInventory = inventories.find(
      (inv) => inv.userId === currentUser.id && inv.productId === productId
    );

    if (!userInventory || userInventory.quantity < quantityToUse) {
      showToast('所持数が不足しているため使用できません', 'error');
      return false;
    }

    const newQuantity = userInventory.quantity - quantityToUse;
    const newTotalUsed = userInventory.totalUsed + quantityToUse;

    // Update inventory
    const nextInventories = inventories.map((inv) =>
      inv.id === userInventory.id
        ? {
            ...inv,
            quantity: newQuantity,
            totalUsed: newTotalUsed,
            updatedAt: new Date().toISOString(),
          }
        : inv
    );
    setInventories(nextInventories);

    // Record usage log
    const usageLog: ItemUsageLog = {
      id: `use-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      productId: userInventory.productId,
      productName: userInventory.productName,
      quantity: quantityToUse,
      image: userInventory.image,
      usedAt: new Date().toISOString(),
      note: note || '所持数ページからの商品使用',
    };

    const nextUsageLogs = [usageLog, ...usageLogs];
    setUsageLogs(nextUsageLogs);

    await syncToServer({
      inventories: nextInventories,
      usageLogs: nextUsageLogs,
    });

    showToast(
      `「${userInventory.productName}」を ${quantityToUse}点 使用しました（残り所持数: ${newQuantity}点）`,
      'success'
    );
    return true;
  };

  // Cart Management
  const addToCart = (product: Product, quantity = 1) => {
    if (currentUser?.role !== 'admin' && product.isPublished === false) {
      showToast('この商品は現在非公開のためカートに追加できません', 'error');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const nextQty = existing.quantity + quantity;
        showToast(`「${product.name}」の数量を ${nextQty} に増やしました`, 'success');
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: nextQty } : item
        );
      } else {
        showToast(`「${product.name}」をカートに追加しました`, 'success');
        return [...prev, { product, quantity }];
      }
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('カートから商品を削除しました', 'info');
  };

  const clearCart = () => {
    setCart([]);
  };

  // Checkout process: Deducts balance and adds to User Inventory!
  const checkout = async (): Promise<{ success: boolean; error?: string; order?: Order }> => {
    recordLocalMutation();
    if (cart.length === 0) {
      return { success: false, error: 'カートが空です' };
    }

    if (!currentUser) {
      return { success: false, error: 'ログインが必要です' };
    }

    const currentCustomer = users.find((u) => u.id === currentUser.id);
    if (!currentCustomer) {
      return { success: false, error: '利用者が特定できません' };
    }

    const totalAmount = cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    if (currentCustomer.balance < totalAmount) {
      const deficit = totalAmount - currentCustomer.balance;
      const errorMsg = `所持金が不足しています（不足額: ¥${deficit.toLocaleString()}）。管理者に所持金の設定・チャージを依頼してください。`;
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }

    const balanceBefore = currentCustomer.balance;
    const balanceAfter = balanceBefore - totalAmount;

    // 1. Update user balance
    const nextUsers = users.map((u) =>
      u.id === currentCustomer.id ? { ...u, balance: balanceAfter } : u
    );
    setUsers(nextUsers);

    // 2. Add purchased items to User Inventory (所持数に加算)
    const nextInventories = [...inventories];
    for (const cartItem of cart) {
      const existingIdx = nextInventories.findIndex(
        (inv) => inv.userId === currentCustomer.id && inv.productId === cartItem.product.id
      );

      if (existingIdx >= 0) {
        nextInventories[existingIdx] = {
          ...nextInventories[existingIdx],
          quantity: nextInventories[existingIdx].quantity + cartItem.quantity,
          totalAcquired: nextInventories[existingIdx].totalAcquired + cartItem.quantity,
          spellSpeed: cartItem.product.spellSpeed,
          enableUsageMemo: cartItem.product.enableUsageMemo,
          updatedAt: new Date().toISOString(),
        };
      } else {
        nextInventories.push({
          id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          userId: currentCustomer.id,
          productId: cartItem.product.id,
          productName: cartItem.product.name,
          price: cartItem.product.price,
          quantity: cartItem.quantity,
          image: cartItem.product.image,
          totalAcquired: cartItem.quantity,
          totalUsed: 0,
          spellSpeed: cartItem.product.spellSpeed,
          enableUsageMemo: cartItem.product.enableUsageMemo,
          updatedAt: new Date().toISOString(),
        });
      }
    }
    setInventories(nextInventories);

    // 3. Create Order record
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randStr = Math.floor(100 + Math.random() * 900);
    const newOrder: Order = {
      id: `ORD-${dateStr}-${randStr}`,
      userId: currentCustomer.id,
      userName: currentCustomer.name,
      userEmail: currentCustomer.email,
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
        image: item.product.image,
        spellSpeed: item.product.spellSpeed,
      })),
      totalAmount,
      balanceBefore,
      balanceAfter,
      status: 'completed',
      createdAt: new Date().toISOString(),
      note: 'キオスク自動精算（商品所持数へ反映）',
    };
    const nextOrders = [newOrder, ...orders];
    setOrders(nextOrders);

    // 4. Log balance deduction
    const balanceLog: BalanceLog = {
      id: `log-${Date.now()}`,
      userId: currentCustomer.id,
      userName: currentCustomer.name,
      type: 'purchase',
      amount: -totalAmount,
      balanceAfter,
      reason: `商品購入精算 (${newOrder.id})`,
      operator: '購入決済',
      createdAt: new Date().toISOString(),
    };
    const nextLogs = [balanceLog, ...balanceLogs];
    setBalanceLogs(nextLogs);

    // 5. Clear cart
    clearCart();

    // 6. Persist to server IMMEDIATELY so balance and orders NEVER revert
    await syncToServer({
      users: nextUsers,
      orders: nextOrders,
      balanceLogs: nextLogs,
      inventories: nextInventories,
    });

    showToast(`購入完了！ ¥${totalAmount.toLocaleString()} を決済し、所持品に追加されました`, 'success');

    return { success: true, order: newOrder };
  };

  // Cancel / Refund Order (Admin capability: 返金時に所持数も減算・回収)
  const cancelOrder = async (orderId: string, reason = '管理者による注文取消・返金'): Promise<boolean> => {
    recordLocalMutation();
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      showToast('対象の注文が見つかりません', 'error');
      return false;
    }
    if (targetOrder.status === 'cancelled') {
      showToast('この注文は既にキャンセル済みです', 'info');
      return false;
    }

    const nextOrders = orders.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' as const } : o));
    setOrders(nextOrders);

    // 1. Refund Balance
    const targetUser = users.find((u) => u.id === targetOrder.userId);
    let nextUsers = users;
    let nextBalanceLogs = balanceLogs;

    if (targetUser) {
      const newBalance = targetUser.balance + targetOrder.totalAmount;
      nextUsers = users.map((u) => (u.id === targetUser.id ? { ...u, balance: newBalance } : u));
      setUsers(nextUsers);

      const refundLog: BalanceLog = {
        id: `log-${Date.now()}`,
        userId: targetUser.id,
        userName: targetUser.name,
        type: 'refund',
        amount: targetOrder.totalAmount,
        balanceAfter: newBalance,
        reason: `${reason} (${orderId})`,
        operator: `${currentUser?.name || '管理者'} (返金処理)`,
        createdAt: new Date().toISOString(),
      };
      nextBalanceLogs = [refundLog, ...balanceLogs];
      setBalanceLogs(nextBalanceLogs);
    }

    // 2. Revert / Deduct User Inventory (返金時に所持数を減算・回収)
    let nextInventories = inventories.map((inv) => ({ ...inv }));
    for (const orderItem of targetOrder.items) {
      const invIdx = nextInventories.findIndex(
        (inv) => inv.userId === targetOrder.userId && inv.productId === orderItem.productId
      );
      if (invIdx >= 0) {
        const currentInv = nextInventories[invIdx];
        const newQuantity = Math.max(0, currentInv.quantity - orderItem.quantity);
        const newTotalAcquired = Math.max(
          currentInv.totalUsed || 0,
          (currentInv.totalAcquired || currentInv.quantity) - orderItem.quantity
        );

        nextInventories[invIdx] = {
          ...currentInv,
          quantity: newQuantity,
          totalAcquired: newTotalAcquired,
          updatedAt: new Date().toISOString(),
        };
      }
    }

    // Keep active items or items with usage history
    nextInventories = nextInventories.filter(
      (inv) => inv.quantity > 0 || (inv.totalUsed || 0) > 0 || (inv.totalAcquired || 0) > 0
    );
    setInventories(nextInventories);

    // 3. Immediately persist to localStorage
    try {
      localStorage.setItem(`${STORAGE_KEY}_orders`, JSON.stringify(nextOrders));
      localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(nextUsers));
      localStorage.setItem(`${STORAGE_KEY}_logs`, JSON.stringify(nextBalanceLogs));
      localStorage.setItem(`${STORAGE_KEY}_inventories`, JSON.stringify(nextInventories));
    } catch (e) {
      console.warn('Failed to save to localStorage during refund:', e);
    }

    // 4. Try dedicated server API
    try {
      await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          operator: `${currentUser?.name || '管理者'} (返金処理)`,
        }),
      });
    } catch {
      // offline fallback
    }

    // 5. Persist complete updated state to server
    await syncToServer({
      orders: nextOrders,
      users: nextUsers,
      balanceLogs: nextBalanceLogs,
      inventories: nextInventories,
    });

    const itemsSummary = targetOrder.items.map((i) => `${i.productName}×${i.quantity}`).join(', ');
    showToast(`注文 ${orderId} をキャンセルし、¥${targetOrder.totalAmount.toLocaleString()} を返金しました（所持数: ${itemsSummary} を回収）`, 'success');
    return true;
  };

  // Delete single Order record (Admin capability: 購入履歴の削除)
  const deleteOrder = async (orderId: string): Promise<boolean> => {
    recordLocalMutation();
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      showToast('対象の購入履歴が見つかりません', 'error');
      return false;
    }

    const nextOrders = orders.filter((o) => o.id !== orderId);
    setOrders(nextOrders);
    safeSetItem(`${STORAGE_KEY}_orders`, JSON.stringify(nextOrders));
    await syncToServer({ orders: nextOrders });

    showToast(`購入履歴「${orderId}」を削除しました`, 'success');
    return true;
  };

  // Delete multiple Order records (Admin capability: 選択した購入履歴の一括削除)
  const deleteOrders = async (orderIds: string[]): Promise<boolean> => {
    recordLocalMutation();
    if (!orderIds.length) return false;
    const nextOrders = orders.filter((o) => !orderIds.includes(o.id));
    setOrders(nextOrders);
    safeSetItem(`${STORAGE_KEY}_orders`, JSON.stringify(nextOrders));
    await syncToServer({ orders: nextOrders });

    showToast(`${orderIds.length}件の購入履歴を削除しました`, 'success');
    return true;
  };

  // Clear all Order records (Admin capability: 全購入履歴の一括削除)
  const clearAllOrders = async (): Promise<boolean> => {
    recordLocalMutation();
    const count = orders.length;
    if (count === 0) {
      showToast('削除可能な購入履歴がありません', 'info');
      return false;
    }
    setOrders([]);
    safeSetItem(`${STORAGE_KEY}_orders`, JSON.stringify([]));
    await syncToServer({ orders: [] });

    showToast(`すべての購入履歴（${count}件）を完全に削除しました`, 'success');
    return true;
  };

  // Delete single Usage Log record (Admin capability: 使用履歴の削除)
  const deleteUsageLog = async (logId: string): Promise<boolean> => {
    recordLocalMutation();
    const targetLog = usageLogs.find((l) => l.id === logId);
    if (!targetLog) {
      showToast('対象の使用履歴が見つかりません', 'error');
      return false;
    }

    const nextLogs = usageLogs.filter((l) => l.id !== logId);
    setUsageLogs(nextLogs);
    safeSetItem(`${STORAGE_KEY}_usage_logs`, JSON.stringify(nextLogs));
    await syncToServer({ usageLogs: nextLogs });

    showToast(`使用履歴「${targetLog.productName} (${targetLog.userName})」を削除しました`, 'success');
    return true;
  };

  // Delete multiple Usage Log records (Admin capability: 選択した使用履歴の一括削除)
  const deleteUsageLogs = async (logIds: string[]): Promise<boolean> => {
    recordLocalMutation();
    if (!logIds.length) return false;
    const nextLogs = usageLogs.filter((l) => !logIds.includes(l.id));
    setUsageLogs(nextLogs);
    safeSetItem(`${STORAGE_KEY}_usage_logs`, JSON.stringify(nextLogs));
    await syncToServer({ usageLogs: nextLogs });

    showToast(`${logIds.length}件の使用履歴を削除しました`, 'success');
    return true;
  };

  // Clear all Usage Log records (Admin capability: 全使用履歴の一括削除)
  const clearAllUsageLogs = async (): Promise<boolean> => {
    recordLocalMutation();
    const count = usageLogs.length;
    if (count === 0) {
      showToast('削除可能な使用履歴がありません', 'info');
      return false;
    }
    setUsageLogs([]);
    safeSetItem(`${STORAGE_KEY}_usage_logs`, JSON.stringify([]));
    await syncToServer({ usageLogs: [] });

    showToast(`すべての商品使用履歴（${count}件）を完全に削除しました`, 'success');
    return true;
  };

  // Message unread counts (双方向対応)
  const adminUnreadMessageCount = messages.filter(
    (m) => m.status === 'unread' && (!m.senderType || m.senderType === 'user')
  ).length;

  const userUnreadReplyCount = currentUser
    ? messages.filter((m) => {
        // 1. 利用者が送った問い合わせに対する管理者の返信が未読
        if (m.userId === currentUser.id && m.status === 'replied' && !m.userReadReply) {
          return true;
        }
        // 2. 管理者から直接利用者（または全体）へ送信された連絡が未読
        if (m.senderType === 'admin') {
          const isTarget = m.recipientUserId === currentUser.id || m.recipientUserId === 'all';
          if (isTarget && !m.userReadMessage) {
            return true;
          }
        }
        return false;
      }).length
    : 0;

  // Send message from user to administrator
  const sendMessage = async (
    content: string,
    subject?: string,
    category: MessageCategory = 'other'
  ): Promise<boolean> => {
    if (!currentUser) {
      showToast('ログインしてください', 'error');
      return false;
    }
    if (!currentUser) {
      showToast('メッセージを送信するにはログインが必要です', 'error');
      return false;
    }
    if (!content.trim()) {
      showToast('メッセージ内容を入力してください', 'error');
      return false;
    }
    recordLocalMutation();

    const firstLine = content.trim().split('\n')[0].trim();
    const autoSubject = subject?.trim() || (firstLine.length > 25 ? `${firstLine.substring(0, 25)}...` : firstLine) || '管理者へのメッセージ';

    const newMsg: AdminMessage = {
      id: `msg-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userLoginId: currentUser.loginId,
      userDepartment: currentUser.department,
      category,
      subject: autoSubject,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      status: 'unread',
      senderType: 'user',
    };

    const nextMessages = [newMsg, ...messages];
    setMessages(nextMessages);
    safeSetItem(`${STORAGE_KEY}_messages`, JSON.stringify(nextMessages));

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg),
      });
    } catch {
      // fallback offline
    }
    await syncToServer({ messages: nextMessages });

    showToast('管理者へメッセージを送信しました', 'success');
    return true;
  };

  // Send message from administrator to user(s) (「管理者から利用者へのメッセージ連絡」)
  const sendAdminMessage = async (params: {
    recipientUserId: string; // 'all' or specific user ID
    content: string;
    subject?: string;
    category?: MessageCategory;
  }): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin') {
      showToast('管理者権限が必要です', 'error');
      return false;
    }
    if (!params.content.trim()) {
      showToast('メッセージ内容を入力してください', 'error');
      return false;
    }
    recordLocalMutation();

    const isAll = params.recipientUserId === 'all';
    let recipientName = '全参加者（一斉配信）';
    if (!isAll) {
      const targetUser = users.find((u) => u.id === params.recipientUserId);
      if (targetUser) {
        recipientName = targetUser.name;
      }
    }

    const firstLine = params.content.trim().split('\n')[0].trim();
    const autoSubject = params.subject?.trim() || (firstLine.length > 25 ? `${firstLine.substring(0, 25)}...` : firstLine) || '運営本部からの連絡';

    const newMsg: AdminMessage = {
      id: `msg-adm-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userLoginId: currentUser.loginId,
      userDepartment: currentUser.department,
      category: params.category || 'announcement',
      subject: autoSubject,
      content: params.content.trim(),
      createdAt: new Date().toISOString(),
      status: 'read', // already read by admin
      senderType: 'admin',
      recipientType: isAll ? 'all' : 'single',
      recipientUserId: params.recipientUserId,
      recipientUserName: recipientName,
      userReadMessage: false,
    };

    const nextMessages = [newMsg, ...messages];
    setMessages(nextMessages);

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg),
      });
    } catch {
      // fallback offline
    }
    await syncToServer({ messages: nextMessages });

    showToast(`${recipientName}へメッセージを送信しました`, 'success');
    return true;
  };

  // User reply to admin's direct message
  const userReplyToAdminMessage = async (messageId: string, replyContent: string): Promise<boolean> => {
    if (!replyContent.trim()) {
      showToast('返信内容を入力してください', 'error');
      return false;
    }
    const userName = currentUser?.name || '参加者';
    const nextMessages = messages.map((m) =>
      m.id === messageId
        ? {
            ...m,
            userReply: {
              content: replyContent.trim(),
              repliedAt: new Date().toISOString(),
              userName,
            },
            status: 'unread' as const, // Admin should see this as needing attention
          }
        : m
    );
    setMessages(nextMessages);
    await syncToServer({ messages: nextMessages });
    showToast('返信を管理者に送信しました', 'success');
    return true;
  };

  // Mark admin message as read by user
  const markAdminMessageAsReadByUser = async (messageId: string): Promise<boolean> => {
    const nextMessages = messages.map((m) =>
      m.id === messageId ? { ...m, userReadMessage: true } : m
    );
    setMessages(nextMessages);
    await syncToServer({ messages: nextMessages });
    return true;
  };

  // Admin reply to user message
  const replyMessage = async (messageId: string, replyContent: string): Promise<boolean> => {
    if (!replyContent.trim()) {
      showToast('返信内容を入力してください', 'error');
      return false;
    }
    recordLocalMutation();
    const adminName = currentUser?.name || '運営本部管理者';
    const nextMessages = messages.map((m) =>
      m.id === messageId
        ? {
            ...m,
            status: 'replied' as const,
            adminReply: {
              content: replyContent.trim(),
              repliedAt: new Date().toISOString(),
              adminName,
            },
            userReadReply: false,
          }
        : m
    );
    setMessages(nextMessages);
    safeSetItem(`${STORAGE_KEY}_messages`, JSON.stringify(nextMessages));

    try {
      await fetch(`/api/messages/${messageId}/reply`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyContent: replyContent.trim(), adminName }),
      });
    } catch {
      // fallback offline
    }
    await syncToServer({ messages: nextMessages });

    showToast('返信を送信しました', 'success');
    return true;
  };

  // Mark user message as read by admin
  const markMessageAsRead = async (messageId: string): Promise<boolean> => {
    recordLocalMutation();
    const nextMessages = messages.map((m) =>
      m.id === messageId && m.status === 'unread' ? { ...m, status: 'read' as const } : m
    );
    setMessages(nextMessages);
    safeSetItem(`${STORAGE_KEY}_messages`, JSON.stringify(nextMessages));

    try {
      await fetch(`/api/messages/${messageId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userReadReply: false }),
      });
    } catch {
      // fallback offline
    }
    await syncToServer({ messages: nextMessages });
    return true;
  };

  // Mark admin reply as read by user
  const markReplyAsRead = async (messageId: string): Promise<boolean> => {
    recordLocalMutation();
    const nextMessages = messages.map((m) =>
      m.id === messageId ? { ...m, userReadReply: true } : m
    );
    setMessages(nextMessages);
    safeSetItem(`${STORAGE_KEY}_messages`, JSON.stringify(nextMessages));

    try {
      await fetch(`/api/messages/${messageId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userReadReply: true }),
      });
    } catch {
      // fallback offline
    }
    await syncToServer({ messages: nextMessages });
    return true;
  };

  // Delete single message
  const deleteMessage = async (messageId: string): Promise<boolean> => {
    recordLocalMutation();
    const nextMessages = messages.filter((m) => m.id !== messageId);
    setMessages(nextMessages);
    safeSetItem(`${STORAGE_KEY}_messages`, JSON.stringify(nextMessages));

    try {
      await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });
    } catch {
      // fallback offline
    }
    await syncToServer({ messages: nextMessages });
    showToast('メッセージを削除しました', 'info');
    return true;
  };

  // Clear all messages
  const clearAllMessages = async (): Promise<boolean> => {
    recordLocalMutation();
    const count = messages.length;
    if (count === 0) {
      showToast('削除可能なメッセージがありません', 'info');
      return false;
    }
    setMessages([]);
    safeSetItem(`${STORAGE_KEY}_messages`, JSON.stringify([]));

    try {
      await fetch('/api/messages', {
        method: 'DELETE',
      });
    } catch {
      // fallback offline
    }
    await syncToServer({ messages: [] });
    showToast(`すべてのメッセージ（${count}件）を削除しました`, 'success');
    return true;
  };

  // Team Actions (閲覧は全員・作成編集削除は管理者のみ)
  const addTeam = async (teamData: Omit<Team, 'id' | 'createdAt'>): Promise<Team | null> => {
    recordLocalMutation();
    const rawNewTeam = {
      ...teamData,
      id: `team-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    const newTeam = normalizeTeam(rawNewTeam);
    const nextTeams = [...teams.filter((t) => t.id !== newTeam.id), newTeam];
    setTeams(nextTeams);
    safeSetItem(`${STORAGE_KEY}_teams`, JSON.stringify(nextTeams));

    try {
      await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeam),
      });
    } catch {
      // offline fallback
    }
    await syncToServer({ teams: nextTeams });
    showToast(`参加チーム「${newTeam.name}」を作成・登録しました`, 'success');
    return newTeam;
  };

  const updateTeam = async (id: string, updates: Partial<Team>): Promise<boolean> => {
    recordLocalMutation();
    const nextTeams = teams.map((t) =>
      t.id === id ? normalizeTeam({ ...t, ...updates, updatedAt: new Date().toISOString() }) : t
    );
    setTeams(nextTeams);
    safeSetItem(`${STORAGE_KEY}_teams`, JSON.stringify(nextTeams));

    try {
      await fetch(`/api/teams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch {
      // offline fallback
    }
    await syncToServer({ teams: nextTeams });
    showToast('チーム情報を更新しました', 'success');
    return true;
  };

  const deleteTeam = async (id: string): Promise<boolean> => {
    recordLocalMutation();
    const target = teams.find((t) => t.id === id);
    const nextTeams = teams.filter((t) => t.id !== id);
    setTeams(nextTeams);
    safeSetItem(`${STORAGE_KEY}_teams`, JSON.stringify(nextTeams));

    try {
      await fetch(`/api/teams/${id}`, {
        method: 'DELETE',
      });
    } catch {
      // offline fallback
    }
    await syncToServer({ teams: nextTeams });
    showToast(`チーム「${target?.name || ''}」を削除しました`, 'info');
    return true;
  };

  // Tournament Actions (閲覧は全員・作成編集・ランダム抽選は管理者)
  const addTournament = async (params: {
    name: string;
    description?: string;
    selectedTeamIds: string[];
    randomShuffle?: boolean;
  }): Promise<Tournament | null> => {
    recordLocalMutation();
    const participantTeams = teams.filter((t) => params.selectedTeamIds.includes(t.id));
    if (participantTeams.length < 2) {
      showToast('トーナメントには最低2チーム以上が必要です', 'error');
      return null;
    }

    const newTourn = generateTournament({
      name: params.name,
      description: params.description,
      teams: participantTeams,
      randomShuffle: params.randomShuffle ?? true,
    });

    const nextTournaments = [newTourn, ...tournaments];
    setTournaments(nextTournaments);
    safeSetItem(`${STORAGE_KEY}_tournaments`, JSON.stringify(nextTournaments));

    try {
      await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTourn),
      });
    } catch {}
    await syncToServer({ tournaments: nextTournaments });

    showToast(`トーナメント「${newTourn.name}」を作成しました`, 'success');
    return newTourn;
  };

  const randomizeTournamentMatchups = async (id: string): Promise<boolean> => {
    recordLocalMutation();
    const target = tournaments.find((t) => t.id === id);
    if (!target) return false;

    const updated = randomizeMatchupsUtil(target, teams);
    const nextTournaments = tournaments.map((t) => (t.id === id ? updated : t));
    setTournaments(nextTournaments);
    safeSetItem(`${STORAGE_KEY}_tournaments`, JSON.stringify(nextTournaments));

    try {
      await fetch(`/api/tournaments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {}
    await syncToServer({ tournaments: nextTournaments });

    showToast('🎲 対戦相手をランダムにシャッフルして再設定しました', 'success');
    return true;
  };

  const recordMatchResult = async (
    tournamentId: string,
    matchId: string,
    winnerId: string,
    team1Score?: number,
    team2Score?: number
  ): Promise<boolean> => {
    recordLocalMutation();
    const target = tournaments.find((t) => t.id === tournamentId);
    if (!target) return false;

    const updated = recordMatchOutcome(target, matchId, winnerId, team1Score, team2Score);
    const nextTournaments = tournaments.map((t) => (t.id === tournamentId ? updated : t));
    setTournaments(nextTournaments);
    safeSetItem(`${STORAGE_KEY}_tournaments`, JSON.stringify(nextTournaments));

    try {
      await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {}
    await syncToServer({ tournaments: nextTournaments });

    if (updated.status === 'completed' && updated.championTeamName) {
      showToast(`🏆 決勝戦終了！優勝は「${updated.championTeamName}」！`, 'success');
    } else {
      showToast('試合結果を記録し、勝者を次戦へ進出させました', 'success');
    }
    return true;
  };

  const resetMatchResult = async (tournamentId: string, matchId: string): Promise<boolean> => {
    recordLocalMutation();
    const target = tournaments.find((t) => t.id === tournamentId);
    if (!target) return false;

    const updated = resetMatchOutcome(target, matchId);
    const nextTournaments = tournaments.map((t) => (t.id === tournamentId ? updated : t));
    setTournaments(nextTournaments);
    safeSetItem(`${STORAGE_KEY}_tournaments`, JSON.stringify(nextTournaments));

    try {
      await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {}
    await syncToServer({ tournaments: nextTournaments });

    showToast('試合結果をリセットしました', 'info');
    return true;
  };

  const updateTournament = async (id: string, updates: Partial<Tournament>): Promise<boolean> => {
    recordLocalMutation();
    const nextTournaments = tournaments.map((t) => (t.id === id ? { ...t, ...updates } : t));
    setTournaments(nextTournaments);
    safeSetItem(`${STORAGE_KEY}_tournaments`, JSON.stringify(nextTournaments));

    try {
      await fetch(`/api/tournaments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch {}
    await syncToServer({ tournaments: nextTournaments });

    showToast('トーナメント情報を更新しました', 'success');
    return true;
  };

  const deleteTournament = async (id: string): Promise<boolean> => {
    recordLocalMutation();
    const target = tournaments.find((t) => t.id === id);
    const nextTournaments = tournaments.filter((t) => t.id !== id);
    setTournaments(nextTournaments);
    safeSetItem(`${STORAGE_KEY}_tournaments`, JSON.stringify(nextTournaments));

    try {
      await fetch(`/api/tournaments/${id}`, {
        method: 'DELETE',
      });
    } catch {}
    await syncToServer({ tournaments: nextTournaments });

    showToast(`トーナメント「${target?.name || ''}」を削除しました`, 'info');
    return true;
  };

  const resetDemoData = () => {
    setProducts(INITIAL_PRODUCTS);
    setUsers(INITIAL_USERS);
    setOrders(INITIAL_ORDERS);
    setBalanceLogs(INITIAL_BALANCE_LOGS);
    setInventories(INITIAL_INVENTORIES);
    setUsageLogs(INITIAL_USAGE_LOGS);
    setMessages(INITIAL_MESSAGES);
    setTeams(INITIAL_TEAMS);
    setTournaments(INITIAL_TOURNAMENTS);
    setSettings(DEFAULT_APP_SETTINGS);
    setCart([]);
    setCurrentUserId('usr-01');
    setIsAuthenticated(true);
    setActiveTabState('catalog');
    showToast('サンプルデータを初期状態にリセットしました', 'info');
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        users,
        orders,
        balanceLogs,
        inventories,
        usageLogs,
        messages,
        teams,
        tournaments,
        adminUnreadMessageCount,
        userUnreadReplyCount,
        settings,
        updateSettings,
        currentUser,
        isAuthenticated,
        cart,
        activeTab,
        toasts,
        showToast,
        removeToast,
        setActiveTab,
        login,
        logout,
        switchUserById,
        addTeam,
        updateTeam,
        deleteTeam,
        addTournament,
        updateTournament,
        deleteTournament,
        randomizeTournamentMatchups,
        recordMatchResult,
        resetMatchResult,
        addProduct,
        updateProduct,
        batchUpdateProducts,
        deleteProduct,
        addUser,
        updateUser,
        updateUserBalance,
        deleteUser,
        useItem,
        getUserInventory,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        checkout,
        cancelOrder,
        deleteOrder,
        deleteOrders,
        clearAllOrders,
        deleteUsageLog,
        deleteUsageLogs,
        clearAllUsageLogs,
        sendMessage,
        sendAdminMessage,
        replyMessage,
        userReplyToAdminMessage,
        markMessageAsRead,
        markReplyAsRead,
        markAdminMessageAsReadByUser,
        deleteMessage,
        clearAllMessages,
        resetDemoData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
