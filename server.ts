import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  INITIAL_PRODUCTS,
  INITIAL_USERS,
  INITIAL_ORDERS,
  INITIAL_BALANCE_LOGS,
  INITIAL_INVENTORIES,
  INITIAL_USAGE_LOGS,
  INITIAL_MESSAGES,
  INITIAL_TEAMS,
  INITIAL_TOURNAMENTS,
} from './src/data/seedData.ts';
import { DEFAULT_APP_SETTINGS } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Port 3000 is required by AI Studio dev environment; Cloud Run sets process.env.PORT (e.g. 8080)
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DB_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DB_DIR, 'store_db.json');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

interface StoreDatabase {
  products: any[];
  users: any[];
  orders: any[];
  balanceLogs: any[];
  inventories: any[];
  usageLogs: any[];
  messages: any[];
  teams: any[];
  tournaments: any[];
  settings: any;
  lastModified?: number;
}

function getInitialDatabase(): StoreDatabase {
  return {
    products: INITIAL_PRODUCTS,
    users: INITIAL_USERS,
    orders: INITIAL_ORDERS,
    balanceLogs: INITIAL_BALANCE_LOGS,
    inventories: INITIAL_INVENTORIES,
    usageLogs: INITIAL_USAGE_LOGS,
    messages: INITIAL_MESSAGES,
    teams: INITIAL_TEAMS,
    tournaments: INITIAL_TOURNAMENTS,
    settings: DEFAULT_APP_SETTINGS,
    lastModified: 0,
  };
}

let lastLoadedMtime = 0;
// Initialize dbMemory first with default database so it is never accessed before initialization (TDZ)
let dbMemory: StoreDatabase = getInitialDatabase();

function loadDatabase(forceDisk = false): StoreDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const stat = fs.statSync(DB_FILE);
      if (!forceDisk && dbMemory && stat.mtimeMs === lastLoadedMtime) {
        return dbMemory;
      }
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (!parsed.settings) parsed.settings = DEFAULT_APP_SETTINGS;
        if (!Array.isArray(parsed.products)) parsed.products = INITIAL_PRODUCTS;
        if (!Array.isArray(parsed.users)) parsed.users = INITIAL_USERS;
        if (!Array.isArray(parsed.orders)) parsed.orders = [];
        if (!Array.isArray(parsed.balanceLogs)) parsed.balanceLogs = [];
        if (!Array.isArray(parsed.inventories)) parsed.inventories = [];
        if (!Array.isArray(parsed.usageLogs)) parsed.usageLogs = [];
        if (!Array.isArray(parsed.messages)) parsed.messages = INITIAL_MESSAGES;
        if (!Array.isArray(parsed.teams)) parsed.teams = INITIAL_TEAMS;
        if (!Array.isArray(parsed.tournaments)) parsed.tournaments = INITIAL_TOURNAMENTS;
        if (typeof parsed.lastModified !== 'number') parsed.lastModified = 0;
        lastLoadedMtime = stat.mtimeMs;
        dbMemory = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.error('[Server DB] Failed to load database from file, using initial data:', err);
  }
  const initial = getInitialDatabase();
  saveDatabase(initial, 0);
  return initial;
}

// Perform initial database load from disk
dbMemory = loadDatabase();

function saveDatabase(data: StoreDatabase, overrideLastModified?: number) {
  try {
    data.lastModified = typeof overrideLastModified === 'number' ? overrideLastModified : Date.now();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    try {
      const stat = fs.statSync(DB_FILE);
      lastLoadedMtime = stat.mtimeMs;
    } catch {}
    dbMemory = data;
  } catch (err) {
    console.error('[Server DB] Failed to save database to file:', err);
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      dbMemory = data;
    } catch {}
  }
}

// Convert Zenkaku (全角) to Hankaku (半角) and trim whitespace
export function toHalfWidth(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\uff01-\uff5e]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, '')
    .trim();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // API Route: Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      usersCount: dbMemory.users.length,
      time: new Date().toISOString(),
    });
  });

  // API Route: Get complete shared store data (Sync across all devices)
  app.get('/api/store/data', (req, res) => {
    dbMemory = loadDatabase();
    const since = req.query.since ? parseInt(req.query.since as string, 10) : 0;
    const currentLastMod = dbMemory.lastModified || 0;

    // Lightweight 304/notModified response to avoid re-serializing whole database
    if (since > 0 && currentLastMod > 0 && currentLastMod <= since) {
      res.json({
        success: true,
        notModified: true,
        lastModified: currentLastMod,
      });
      return;
    }

    res.json({
      success: true,
      notModified: false,
      data: dbMemory,
    });
  });

  // API Route: Save complete or partial shared store data
  app.post('/api/store/data', (req, res) => {
    const incoming = req.body;
    if (!incoming || typeof incoming !== 'object') {
      res.status(400).json({ success: false, error: 'Invalid data format' });
      return;
    }

    dbMemory = loadDatabase();

    // Deduplicate products if provided
    let products = dbMemory.products;
    if (Array.isArray(incoming.products)) {
      const pMap = new Map();
      incoming.products.forEach((p: any) => {
        if (p && p.id && !pMap.has(p.id)) pMap.set(p.id, p);
      });
      products = Array.from(pMap.values());
    }

    // Deduplicate teams if provided
    let teams = dbMemory.teams;
    if (Array.isArray(incoming.teams)) {
      const tMap = new Map();
      incoming.teams.forEach((t: any) => {
        if (t && t.id && !tMap.has(t.id)) tMap.set(t.id, t);
      });
      teams = Array.from(tMap.values());
    }

    // Deduplicate users if provided
    let users = dbMemory.users;
    if (Array.isArray(incoming.users)) {
      const uMap = new Map();
      incoming.users.forEach((u: any) => {
        if (u && u.id && !uMap.has(u.id)) uMap.set(u.id, u);
      });
      users = Array.from(uMap.values());
    }

    // Deduplicate tournaments if provided
    let tournaments = dbMemory.tournaments;
    if (Array.isArray(incoming.tournaments)) {
      const trnMap = new Map();
      incoming.tournaments.forEach((t: any) => {
        if (t && t.id && !trnMap.has(t.id)) trnMap.set(t.id, t);
      });
      tournaments = Array.from(trnMap.values());
    }

    const targetLastModified = (typeof incoming.lastModified === 'number' && incoming.lastModified > 0)
      ? Math.max(incoming.lastModified, Date.now())
      : Date.now();

    dbMemory = {
      products,
      users,
      teams,
      tournaments,
      orders: Array.isArray(incoming.orders) ? incoming.orders : dbMemory.orders,
      balanceLogs: Array.isArray(incoming.balanceLogs) ? incoming.balanceLogs : dbMemory.balanceLogs,
      inventories: Array.isArray(incoming.inventories) ? incoming.inventories : dbMemory.inventories,
      usageLogs: Array.isArray(incoming.usageLogs) ? incoming.usageLogs : dbMemory.usageLogs,
      messages: Array.isArray(incoming.messages) ? incoming.messages : dbMemory.messages,
      settings: incoming.settings ? { ...dbMemory.settings, ...incoming.settings } : dbMemory.settings,
      lastModified: targetLastModified,
    };

    saveDatabase(dbMemory, targetLastModified);
    res.json({ success: true, message: 'Saved successfully', data: dbMemory });
  });

  // Direct Teams API
  app.get('/api/teams', (_req, res) => {
    dbMemory = loadDatabase();
    res.json({ success: true, teams: dbMemory.teams || [], lastModified: dbMemory.lastModified });
  });

  app.post('/api/teams', (req, res) => {
    const team = req.body;
    if (!team || !team.name) {
      res.status(400).json({ success: false, error: 'チーム名は必須です' });
      return;
    }
    dbMemory = loadDatabase();
    if (!Array.isArray(dbMemory.teams)) dbMemory.teams = [];

    const newTeam = {
      ...team,
      id: team.id || `team-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: team.createdAt || new Date().toISOString(),
    };

    // Deduplicate by id
    const existingIdx = dbMemory.teams.findIndex((t: any) => t.id === newTeam.id);
    if (existingIdx >= 0) {
      dbMemory.teams[existingIdx] = { ...dbMemory.teams[existingIdx], ...newTeam };
    } else {
      dbMemory.teams.push(newTeam);
    }
    saveDatabase(dbMemory);
    res.json({ success: true, team: newTeam });
  });

  app.put('/api/teams/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body || {};
    dbMemory = loadDatabase();
    if (!Array.isArray(dbMemory.teams)) dbMemory.teams = [];

    const idx = dbMemory.teams.findIndex((t: any) => t.id === id);
    if (idx === -1) {
      // Upsert to ensure team is never lost
      const newTeam = {
        ...updates,
        id,
        createdAt: updates.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dbMemory.teams.push(newTeam);
      saveDatabase(dbMemory);
      res.json({ success: true, team: newTeam });
      return;
    }

    dbMemory.teams[idx] = {
      ...dbMemory.teams[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveDatabase(dbMemory);
    res.json({ success: true, team: dbMemory.teams[idx] });
  });

  app.delete('/api/teams/:id', (req, res) => {
    const { id } = req.params;
    dbMemory = loadDatabase();
    if (Array.isArray(dbMemory.teams)) {
      dbMemory.teams = dbMemory.teams.filter((t: any) => t.id !== id);
      saveDatabase(dbMemory);
    }
    res.json({ success: true });
  });

  // Direct Tournaments API (トーナメント表管理)
  app.get('/api/tournaments', (_req, res) => {
    dbMemory = loadDatabase();
    res.json({ success: true, tournaments: dbMemory.tournaments || [] });
  });

  app.post('/api/tournaments', (req, res) => {
    const tournament = req.body;
    if (!tournament || !tournament.name) {
      res.status(400).json({ success: false, error: 'トーナメント名は必須です' });
      return;
    }
    dbMemory = loadDatabase();
    if (!Array.isArray(dbMemory.tournaments)) dbMemory.tournaments = [];

    const newTourn = {
      ...tournament,
      id: tournament.id || `tourn-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: tournament.createdAt || new Date().toISOString(),
    };

    dbMemory.tournaments.push(newTourn);
    saveDatabase(dbMemory);
    res.json({ success: true, tournament: newTourn });
  });

  app.put('/api/tournaments/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body || {};
    dbMemory = loadDatabase();
    if (!Array.isArray(dbMemory.tournaments)) dbMemory.tournaments = [];

    const idx = dbMemory.tournaments.findIndex((t: any) => t.id === id);
    if (idx === -1) {
      res.status(404).json({ success: false, error: 'トーナメントが見つかりません' });
      return;
    }

    dbMemory.tournaments[idx] = {
      ...dbMemory.tournaments[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveDatabase(dbMemory);
    res.json({ success: true, tournament: dbMemory.tournaments[idx] });
  });

  app.delete('/api/tournaments/:id', (req, res) => {
    const { id } = req.params;
    dbMemory = loadDatabase();
    if (Array.isArray(dbMemory.tournaments)) {
      dbMemory.tournaments = dbMemory.tournaments.filter((t: any) => t.id !== id);
      saveDatabase(dbMemory);
    }
    res.json({ success: true });
  });

  // Direct Product API (with deduplication)
  app.post('/api/products', (req, res) => {
    const prod = req.body;
    if (!prod || !prod.name) {
      res.status(400).json({ success: false, error: '商品名は必須です' });
      return;
    }
    dbMemory = loadDatabase();
    const newProd = {
      ...prod,
      id: prod.id || `prod-${Date.now().toString(36)}`,
      createdAt: prod.createdAt || new Date().toISOString(),
    };
    const existingIdx = dbMemory.products.findIndex((p) => p.id === newProd.id);
    if (existingIdx >= 0) {
      dbMemory.products[existingIdx] = { ...dbMemory.products[existingIdx], ...newProd };
    } else {
      dbMemory.products.unshift(newProd);
    }
    saveDatabase(dbMemory);
    res.json({ success: true, product: newProd });
  });

  app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body || {};
    dbMemory = loadDatabase();
    const idx = dbMemory.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      const newProd = {
        ...updates,
        id,
        createdAt: updates.createdAt || new Date().toISOString(),
      };
      dbMemory.products.push(newProd);
      saveDatabase(dbMemory);
      res.json({ success: true, product: newProd });
      return;
    }

    dbMemory.products[idx] = {
      ...dbMemory.products[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveDatabase(dbMemory);
    res.json({ success: true, product: dbMemory.products[idx] });
  });

  app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    dbMemory = loadDatabase();
    dbMemory.products = dbMemory.products.filter((p) => p.id !== id);
    saveDatabase(dbMemory);
    res.json({ success: true });
  });

  // Direct Order Cancellation / Refund API (所持金の返金および所持数の回収)
  app.post('/api/orders/:id/cancel', (req, res) => {
    const { id } = req.params;
    const { reason, operator } = req.body || {};
    dbMemory = loadDatabase();
    const orderIdx = dbMemory.orders.findIndex((o) => o.id === id);
    if (orderIdx === -1) {
      res.status(404).json({ success: false, error: '注文が見つかりません' });
      return;
    }

    const order = dbMemory.orders[orderIdx];
    if (order.status === 'cancelled') {
      res.json({ success: true, message: '既にキャンセル済みです', order });
      return;
    }

    order.status = 'cancelled';
    dbMemory.orders[orderIdx] = order;

    // Refund user balance
    const userIdx = dbMemory.users.findIndex((u) => u.id === order.userId);
    if (userIdx >= 0) {
      const user = dbMemory.users[userIdx];
      const newBalance = user.balance + order.totalAmount;
      user.balance = newBalance;
      dbMemory.users[userIdx] = user;

      dbMemory.balanceLogs.unshift({
        id: `log-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        type: 'refund',
        amount: order.totalAmount,
        balanceAfter: newBalance,
        reason: `${reason || '管理者による返金処理'} (${id})`,
        operator: operator || '管理者 (返金処理)',
        createdAt: new Date().toISOString(),
      });
    }

    // Revert user inventory
    if (Array.isArray(order.items) && Array.isArray(dbMemory.inventories)) {
      for (const item of order.items) {
        const invIdx = dbMemory.inventories.findIndex(
          (inv: any) => inv.userId === order.userId && inv.productId === item.productId
        );
        if (invIdx >= 0) {
          const inv = dbMemory.inventories[invIdx];
          const newQty = Math.max(0, (inv.quantity || 0) - item.quantity);
          const newAcquired = Math.max(
            inv.totalUsed || 0,
            (inv.totalAcquired || inv.quantity || 0) - item.quantity
          );
          dbMemory.inventories[invIdx] = {
            ...inv,
            quantity: newQty,
            totalAcquired: newAcquired,
            updatedAt: new Date().toISOString(),
          };
        }
      }
      dbMemory.inventories = dbMemory.inventories.filter(
        (inv: any) => inv.quantity > 0 || (inv.totalUsed || 0) > 0 || (inv.totalAcquired || 0) > 0
      );
    }

    saveDatabase(dbMemory);
    res.json({
      success: true,
      message: '返金および所持数の回収を完了しました',
      order,
      inventories: dbMemory.inventories,
      users: dbMemory.users,
    });
  });

  // Direct Orders API (Deletion)
  app.delete('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    dbMemory = loadDatabase();
    dbMemory.orders = dbMemory.orders.filter((o) => o.id !== id);
    saveDatabase(dbMemory);
    res.json({ success: true });
  });

  app.delete('/api/orders', (_req, res) => {
    dbMemory = loadDatabase();
    dbMemory.orders = [];
    saveDatabase(dbMemory);
    res.json({ success: true });
  });

  // Direct Usage Logs API (Deletion)
  app.delete('/api/usage-logs/:id', (req, res) => {
    const { id } = req.params;
    dbMemory = loadDatabase();
    dbMemory.usageLogs = dbMemory.usageLogs.filter((l) => l.id !== id);
    saveDatabase(dbMemory);
    res.json({ success: true });
  });

  app.delete('/api/usage-logs', (_req, res) => {
    dbMemory = loadDatabase();
    dbMemory.usageLogs = [];
    saveDatabase(dbMemory);
    res.json({ success: true });
  });

  // Direct Messages API (Send, Reply, Read, Delete)
  app.post('/api/messages', (req, res) => {
    const msg = req.body;
    if (!msg || !msg.content || !msg.userId) {
      res.status(400).json({ success: false, error: 'メッセージ内容と送信者情報は必須です' });
      return;
    }
    dbMemory = loadDatabase();
    const newMsg = {
      id: msg.id || `msg-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      userId: msg.userId,
      userName: msg.userName || '利用者',
      userLoginId: msg.userLoginId || '',
      userDepartment: msg.userDepartment || '',
      category: msg.category || 'question',
      subject: msg.subject || '管理者へのお問い合わせ',
      content: msg.content,
      createdAt: msg.createdAt || new Date().toISOString(),
      status: 'unread',
    };
    dbMemory.messages.unshift(newMsg);
    saveDatabase(dbMemory);
    res.json({ success: true, message: newMsg });
  });

  app.put('/api/messages/:id/reply', (req, res) => {
    const { id } = req.params;
    const { replyContent, adminName } = req.body || {};
    if (!replyContent) {
      res.status(400).json({ success: false, error: '返信内容は必須です' });
      return;
    }
    dbMemory = loadDatabase();
    const idx = dbMemory.messages.findIndex((m) => m.id === id);
    if (idx === -1) {
      res.status(404).json({ success: false, error: 'メッセージが見つかりません' });
      return;
    }
    dbMemory.messages[idx] = {
      ...dbMemory.messages[idx],
      status: 'replied',
      adminReply: {
        content: replyContent,
        repliedAt: new Date().toISOString(),
        adminName: adminName || '管理者',
      },
      userReadReply: false,
    };
    saveDatabase(dbMemory);
    res.json({ success: true, message: dbMemory.messages[idx] });
  });

  app.put('/api/messages/:id/read', (req, res) => {
    const { id } = req.params;
    const { userReadReply } = req.body || {};
    dbMemory = loadDatabase();
    const idx = dbMemory.messages.findIndex((m) => m.id === id);
    if (idx >= 0) {
      if (userReadReply) {
        dbMemory.messages[idx].userReadReply = true;
      } else if (dbMemory.messages[idx].status === 'unread') {
        dbMemory.messages[idx].status = 'read';
      }
      saveDatabase(dbMemory);
    }
    res.json({ success: true });
  });

  app.delete('/api/messages/:id', (req, res) => {
    const { id } = req.params;
    dbMemory = loadDatabase();
    dbMemory.messages = dbMemory.messages.filter((m) => m.id !== id);
    saveDatabase(dbMemory);
    res.json({ success: true });
  });

  app.delete('/api/messages', (_req, res) => {
    dbMemory = loadDatabase();
    dbMemory.messages = [];
    saveDatabase(dbMemory);
    res.json({ success: true });
  });

  // API Route: Direct Add User (Ensures newly created user is instantly and permanently saved)
  app.post('/api/users', (req, res) => {
    const userData = req.body;
    if (!userData || !userData.loginId || !userData.password) {
      res.status(400).json({ success: false, error: 'ログインIDとパスワードは必須です' });
      return;
    }

    dbMemory = loadDatabase();

    const cleanLoginId = toHalfWidth(userData.loginId);
    const cleanPassword = toHalfWidth(userData.password);

    // Duplicate check
    const existingIndex = dbMemory.users.findIndex(
      (u) => toHalfWidth(u.loginId || '').toLowerCase() === cleanLoginId.toLowerCase()
    );

    const newUserId = userData.id || `usr-${Date.now().toString(36)}`;
    const newUser = {
      ...userData,
      id: newUserId,
      loginId: cleanLoginId,
      password: cleanPassword,
      balance: typeof userData.balance === 'number' ? userData.balance : 5000,
      createdAt: userData.createdAt || new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      // Overwrite/update existing
      dbMemory.users[existingIndex] = newUser;
    } else {
      dbMemory.users.push(newUser);
    }

    // Add initial balance log if new user has balance
    if (newUser.balance > 0 && existingIndex < 0) {
      dbMemory.balanceLogs.unshift({
        id: `log-${Date.now()}`,
        userId: newUserId,
        userName: newUser.name,
        type: 'charge',
        amount: newUser.balance,
        balanceAfter: newUser.balance,
        reason: '管理者による初期所持金付与',
        operator: '管理者',
        createdAt: new Date().toISOString(),
      });
    }

    saveDatabase(dbMemory);
    console.log(`[Server] User created/updated successfully: ID=${cleanLoginId}, Name=${newUser.name}`);
    res.json({ success: true, user: newUser, totalUsers: dbMemory.users.length });
  });

  // API Route: Direct Update User
  app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body || {};

    dbMemory = loadDatabase();
    const idx = dbMemory.users.findIndex((u) => u.id === id);
    if (idx === -1) {
      res.status(404).json({ success: false, error: '利用者が見つかりません' });
      return;
    }

    if (updates.loginId) updates.loginId = toHalfWidth(updates.loginId);
    if (updates.password) updates.password = toHalfWidth(updates.password);

    dbMemory.users[idx] = {
      ...dbMemory.users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    saveDatabase(dbMemory);
    res.json({ success: true, user: dbMemory.users[idx] });
  });

  // API Route: Direct Update User Balance (所持金直接設定・チャージ)
  app.put('/api/users/:id/balance', (req, res) => {
    const { id } = req.params;
    const { newBalance, diff, reason, type, operator, logId } = req.body || {};

    if (typeof newBalance !== 'number') {
      res.status(400).json({ success: false, error: '有効な金額を指定してください' });
      return;
    }

    dbMemory = loadDatabase();
    const idx = dbMemory.users.findIndex((u) => u.id === id);
    if (idx === -1) {
      res.status(404).json({ success: false, error: '利用者が見つかりません' });
      return;
    }

    const user = dbMemory.users[idx];
    user.balance = Math.max(0, newBalance);
    user.updatedAt = new Date().toISOString();
    dbMemory.users[idx] = user;

    if (!Array.isArray(dbMemory.balanceLogs)) {
      dbMemory.balanceLogs = [];
    }

    const newLog = {
      id: logId || `log-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      type: type || 'adjustment',
      amount: typeof diff === 'number' ? diff : 0,
      balanceAfter: user.balance,
      reason: reason || '管理者による所持金設定',
      operator: operator || '管理者',
      createdAt: new Date().toISOString(),
    };

    dbMemory.balanceLogs.unshift(newLog);
    saveDatabase(dbMemory);
    res.json({ success: true, user, log: newLog });
  });

  // API Route: Direct Delete User
  app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    dbMemory = loadDatabase();
    dbMemory.users = dbMemory.users.filter((u) => u.id !== id);
    saveDatabase(dbMemory);
    res.json({ success: true });
  });

  // API Route: Server-side Login Verification
  app.post('/api/auth/login', (req, res) => {
    const { loginId, password } = req.body || {};
    if (!loginId || !password) {
      res.status(400).json({ success: false, error: 'IDとパスワードを入力してください' });
      return;
    }

    const cleanInputId = toHalfWidth(loginId).toLowerCase();
    const cleanInputPass = toHalfWidth(password);

    // Reload latest database from disk to ensure freshest state across processes
    dbMemory = loadDatabase();

    const targetUser = dbMemory.users.find((u) => {
      const uLoginId = toHalfWidth(u.loginId || '').toLowerCase();
      return uLoginId === cleanInputId;
    });

    if (!targetUser) {
      res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        error: `ログインID「${loginId}」は登録されていません。管理者が登録したIDをご確認ください。`,
      });
      return;
    }

    const uPassword = toHalfWidth(targetUser.password || '');
    if (uPassword !== cleanInputPass) {
      res.status(401).json({
        success: false,
        code: 'INVALID_PASSWORD',
        error: `ログインID「${loginId}」のパスワードが正しくありません。登録時のパスワードを入力してください。`,
      });
      return;
    }

    if (targetUser.status === 'suspended') {
      res.status(403).json({
        success: false,
        code: 'SUSPENDED',
        error: 'このアカウントは現在利用停止されています。',
      });
      return;
    }

    res.json({
      success: true,
      user: targetUser,
    });
  });

  // Setup frontend serving
  const isProduction = process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'));
  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SmartStore Full-Stack] Server running on http://0.0.0.0:${PORT} (Users: ${dbMemory.users.length})`);
  });
}

startServer().catch((err) => {
  console.error('[SmartStore Full-Stack] Server failed to start:', err);
  process.exit(1);
});
