import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Lock, User, Eye, EyeOff, ArrowRight, Store, ShieldCheck, AlertCircle } from 'lucide-react';
import { normalizeLoginId, normalizePassword } from '../utils/credentials';

export const LoginPage: React.FC = () => {
  const { login, settings } = useStore();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanId = normalizeLoginId(loginId);
    const cleanPass = normalizePassword(password);

    if (!cleanId || !cleanPass) {
      setErrorMessage('IDとパスワードを入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(cleanId, cleanPass);
      if (!result.success) {
        setErrorMessage(result.error || 'ログインに失敗しました。IDとパスワードをご確認ください。');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'ログイン通信中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background visual ambience */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/hero_cafe_store_1792325094927.jpg"
          alt="SmartStore Background"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-20 filter blur-xs"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-900/90" />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {settings.appTitle}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            イベント専用商品購入・参加者決済システム
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-white/20">
          <div className="mb-6">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg w-fit mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>イベント認証登録者専用</span>
            </div>
            <h2 className="text-base font-bold text-slate-900">イベントログイン認証</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              運営管理者が発行した参加者IDとパスワードを入力してください。<br />
              （※付与されたイベント所持金でフードやグッズ・チケットの購入が可能です）
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-in fade-in leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p>{errorMessage}</p>
                <p className="mt-1 text-[11px] text-rose-500 font-normal">
                  ※ 全角/半角、大文字/小文字、不要なスペースの有無をご確認ください。不明な場合は運営管理者へお問い合わせください。
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ログインID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="管理者から付与されたIDを入力（例: admin, sato）"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                パスワード
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="パスワードを入力"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示する'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                💡 全角英数字（ａｄｍｉｎ等）や余分なスペースも自動で半角に変換されます
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                '認証照合中...'
              ) : (
                <>
                  <span>ログインして購入ページへ進む</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>



          <div className="mt-5 pt-4 border-t border-slate-200 text-center">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ※ ID・パスワードの発行および所持金の設定は管理者が行います。<br />
              （新規利用者の登録・変更は管理者コンソールから行われます）
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
