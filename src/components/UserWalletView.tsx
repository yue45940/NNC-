import React from 'react';
import { useStore } from '../context/StoreContext';
import { Wallet, ArrowDownRight, ArrowUpRight, Clock, ShieldCheck } from 'lucide-react';

export const UserWalletView: React.FC = () => {
  const { currentUser, balanceLogs } = useStore();

  if (!currentUser) return null;

  const userLogs = balanceLogs.filter((log) => log.userId === currentUser.id);

  const totalCharged = userLogs
    .filter((l) => l.amount > 0)
    .reduce((sum, l) => sum + l.amount, 0);

  const totalDeducted = userLogs
    .filter((l) => l.amount < 0)
    .reduce((sum, l) => sum + Math.abs(l.amount), 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Wallet Balance Hero Card */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <Wallet className="w-4 h-4" />
              <span>マイウォレット・所持金明細</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              {currentUser.name} さんのアカウント
            </h1>
            <p className="text-xs text-indigo-200 mt-1">
              所属: {currentUser.department} · {currentUser.email}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 min-w-[240px]">
            <span className="text-xs text-indigo-200 block">現在の利用可能残高</span>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-300 tabular-nums mt-1">
              ¥{currentUser.balance.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-300 mt-2 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              管理者承認済み残高
            </p>
          </div>
        </div>

        {/* Aggregate mini-stats */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-indigo-300 block text-[11px]">これまでの累計付与・チャージ額</span>
            <span className="text-lg font-bold font-mono text-white tabular-nums">
              +¥{totalCharged.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-indigo-300 block text-[11px]">これまでの累計利用・購入額</span>
            <span className="text-lg font-bold font-mono text-rose-300 tabular-nums">
              -¥{totalDeducted.toLocaleString()}
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-indigo-300 block text-[11px]">取引明細件数</span>
            <span className="text-lg font-bold font-mono text-white tabular-nums">
              {userLogs.length} 件
            </span>
          </div>
        </div>
      </div>

      {/* Charge instructions callout */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">所持金のチャージ・残高設定について</span>
          <p className="mt-0.5 text-amber-800 leading-relaxed">
            所持金の追加や調整は、ストア管理者が「管理者メニュー ＞ 利用者・所持金管理」から直接指定またはチャージを行います。現金納付や福利厚生ポイント付与などの手続きは管理者へお問い合わせください。
          </p>
        </div>
      </div>

      {/* Balance Transaction Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">所持金・取引履歴ログ</h2>
          <span className="text-xs text-slate-400">{userLogs.length} 件の記録</span>
        </div>

        {userLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            取引履歴がまだありません。
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {userLogs.map((log) => {
              const isPositive = log.amount > 0;

              return (
                <div key={log.id} className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-rose-500" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{log.reason}</span>
                        <span className="text-[10px] text-slate-400 font-medium">({log.operator})</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {new Date(log.createdAt).toLocaleString('ja-JP', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-bold font-mono tabular-nums ${
                        isPositive ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {isPositive ? `+¥${log.amount.toLocaleString()}` : `-¥${Math.abs(log.amount).toLocaleString()}`}
                    </span>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      残高: ¥{log.balanceAfter.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
