export interface Product {
  id: string;
  name: string;
  price: number;
  stock?: number;
  description: string;
  image?: string;
  badge?: string;
  spellSpeed?: number | string; // スペルスピード (例: 1, 2, 3, または "1", "2", "3")
  enableUsageMemo?: boolean; // 商品使用時にメモ機能を使うかどうか (true: 使う, false: 使わない, デフォルト: true)
  isPublished?: boolean; // 購入ページへの表示・公開設定 (true: 表示, false: 非表示, デフォルト: true)
  createdAt: string;
}

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  loginId: string; // ログインID (管理者設定可能)
  password: string; // ログインパスワード (管理者設定可能)
  name: string;
  email: string;
  role: UserRole;
  balance: number; // 所持金 (円) - 管理者のみ変更可能
  department: string;
  avatarColor: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface UserInventoryItem {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number; // 現在の所持数
  image?: string;
  totalAcquired: number; // 累計購入・獲得数
  totalUsed: number; // 累計使用数
  spellSpeed?: number | string; // スペルスピード (例: 1, 2, 3)
  enableUsageMemo?: boolean; // メモ機能を使うかどうか
  updatedAt: string;
}

export interface TeamCharacter {
  id: string;
  slotNumber: number; // 1, 2, 3, 4
  name: string; // キャラクター名
  image?: string; // ローカルから挿入した画像 (Base64 Data URL または 画像URL)
  note?: string; // 補足（任意）
}

export interface TeamMember {
  id: string;
  name: string; // メンバー名
  userId?: string; // 紐付くユーザーID (任意)
  isLeader?: boolean; // 代表リーダーフラグ
  roleTitle?: string; // ロール・肩書（例: リーダー, アタッカー）
  characters: TeamCharacter[]; // 各メンバーの使用キャラクター (4キャラ)
}

export interface Team {
  id: string;
  name: string; // チーム名
  leaderName: string; // 代表者・リーダー名
  leaderUserId?: string; // 紐付くユーザーID (任意)
  department?: string; // 部署・ブロック・カテゴリー
  description: string; // チーム紹介・スローガン・意気込み
  color: string; // チームカラー (indigo, emerald, rose, amber, violet, cyan, orange, blue)
  icon?: string; // アイコン識別子 (Flag, Trophy, Flame, Rocket, Star, Users, Shield, Zap)
  members: TeamMember[]; // メンバー一覧（各メンバーに4キャラを保持）
  totalScore?: number; // イベント獲得スコア・ポイント (任意)
  createdAt: string;
  updatedAt?: string;
}

export interface ItemUsageLog {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  productName: string;
  quantity: number;
  image?: string;
  usedAt: string;
  note?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
  image?: string;
  spellSpeed?: number | string; // スペルスピード
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  totalAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: 'completed' | 'cancelled';
  createdAt: string;
  note?: string;
}

export type BalanceLogType = 'charge' | 'adjustment' | 'purchase' | 'refund';

export interface BalanceLog {
  id: string;
  userId: string;
  userName: string;
  type: BalanceLogType;
  amount: number; // + or -
  balanceAfter: number;
  reason: string;
  operator: string;
  createdAt: string;
}

// 利用者と管理者間のメッセージ送受信 (雙方向: 利用者→管理者 / 管理者→利用者)
export type MessageCategory = 'balance' | 'product' | 'usage' | 'tournament' | 'question' | 'announcement' | 'other';

export interface AdminMessage {
  id: string;
  userId: string; // 送信者のユーザーID (管理者が送信した場合は管理者のID)
  userName: string;
  userLoginId?: string;
  userDepartment?: string;
  category: MessageCategory;
  subject: string;
  content: string;
  createdAt: string;
  status: 'unread' | 'read' | 'replied';
  // 送信元と送信先の種別 (管理者→利用者連絡対応)
  senderType?: 'user' | 'admin'; // 'user'=利用者が送信, 'admin'=管理者が送信
  recipientType?: 'single' | 'all'; // 'single'=個別利用者宛, 'all'=全参加者一斉配信
  recipientUserId?: string; // 宛先ユーザーID (全員の場合は 'all')
  recipientUserName?: string; // 宛先名 (例: '佐藤 健太' または '全参加者')
  // 返信情報
  adminReply?: {
    content: string;
    repliedAt: string;
    adminName: string;
  };
  userReply?: {
    content: string;
    repliedAt: string;
    userName: string;
  };
  userReadReply?: boolean; // 利用者が管理者からの返信を既読にしたか
  userReadMessage?: boolean; // 管理者からの直接連絡を利用者が既読にしたか
}

// トーナメント対戦試合
export interface TournamentMatch {
  id: string; // 一意な試合ID (例: 'm-1-1')
  round: number; // 回戦番号 (1: 1回戦/準決勝, 2: 決勝など)
  matchNumber: number; // そのラウンド内の試合番号 (1, 2, ...)
  team1Id?: string | null;
  team1Name?: string | null;
  team1Score?: number;
  team2Id?: string | null;
  team2Name?: string | null;
  team2Score?: number;
  winnerId?: string | null;
  winnerName?: string | null;
  status: 'scheduled' | 'in_progress' | 'completed';
  scheduledTime?: string;
  note?: string;
  nextMatchId?: string | null; // 勝者が進出する次の試合ID
  nextMatchSlot?: 1 | 2; // 次の試合におけるスロット1または2
  isSeedMatch?: boolean; // シード枠（不戦勝）試合フラグ
}

// トーナメント各ラウンド (1回戦、準々決勝、準決勝、決勝など)
export interface TournamentRound {
  round: number;
  name: string; // 例: "1回戦", "準決勝", "決勝戦"
  matches: TournamentMatch[];
}

// トーナメント表データ
export interface Tournament {
  id: string;
  name: string; // トーナメント名 (例: "第1回 メイントーナメント杯")
  description?: string; // 大会概要・ルール
  teamCount: number; // 参加チーム数 (4, 8, 16等)
  participatingTeamIds: string[]; // エントリーチームID配列
  rounds: TournamentRound[]; // 全ラウンド・試合ツリー
  championTeamId?: string | null; // 優勝チームID
  championTeamName?: string | null; // 優勝チーム名
  status: 'in_progress' | 'completed';
  seedCount?: number; // シード枠数（奇数・不均衡チーム時の不戦勝枠数）
  createdAt: string;
  updatedAt?: string;
}

// 利用者は「購入ページ(catalog)」「所持数ページ(inventory)」「購入履歴(orders)」「使用履歴(usage)」「参加チーム一覧(teams)」「トーナメント表(tournaments)」「管理者連絡(messages)」を閲覧可能
// 管理者はユーザー管理、参加チーム作成(admin-teams)、トーナメント作成管理(tournaments)、商品管理、全体購入履歴、商品使用履歴、メッセージ管理を閲覧・操作可能
export type ActiveTab =
  | 'catalog'
  | 'inventory'
  | 'orders'
  | 'usage'
  | 'teams'
  | 'tournaments'
  | 'messages'
  | 'admin-users'
  | 'admin-teams'
  | 'admin-products'
  | 'admin-orders'
  | 'admin-usage'
  | 'admin-messages';

export interface AppSettings {
  appTitle: string; // アプリ・イベント名 (例: SmartStore, 社内サマーフェス 2026)
  heroBadge: string; // バッジ・タグ (例: イベント専用スマート決済アプリ)
  heroTitle: string; // メイン見出し (例: イベント限定フード・ドリンク・グッズを所持金でキャッシュレス決済)
  heroDescription: string; // ルール説明 (イベントルールや注意事項、利用手順。改行対応)
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  appTitle: 'イベント用アプリ',
  heroBadge: '管理者：ゆゑ',
  heroTitle: '○○杯',
  heroDescription:
    '購入ルール\n・1試合ごとに１商品の購入・１商品の使用を行うこと\n・権利券無効に権利券無効を重ねることはできない\n・試合終了後に所持金を追加　勝ち：+3,000-　負け：+2,000-\n・MAP指定券・相手1名など、指定を行うものは、使用時にメモ機能に内容を記入すること\n　※MAP：採掘施設　　相手1名：○○さん\n・スペルスピードは、優先度を示す　数字が大きいものが優先度が高い\n・管理者からのメッセージの通知があるので、その際はメッセージにて返信を行うこと',
};

