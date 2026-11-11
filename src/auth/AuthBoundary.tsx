import { useState, type ReactNode } from 'react';
import { useAuth } from './AuthProvider';

export default function AuthBoundary({ children }: { children: ReactNode }) {
  const { session, loading, configured, error, signIn, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  if (loading) return <main className="min-h-screen flex items-center justify-center" role="status">正在確認登入狀態…</main>;
  if (!session) return <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
    <section className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 space-y-5">
      <h1 className="text-2xl font-bold">Bill Management</h1>
      <p>使用 Google 帳戶登入，管理自己的賬單。</p>
      {!configured && <p role="alert">尚未設定 Supabase URL 及 publishable key，請先完成環境變數設定。</p>}
      {error && <p role="alert" className="text-red-300">{error}</p>}
      <button type="button" disabled={!configured || busy} className="w-full rounded-lg bg-blue-600 p-3 disabled:opacity-50"
        onClick={async () => { setBusy(true); try { await signIn(); } finally { setBusy(false); } }}>
        {busy ? '正在開啟 Google 登入…' : '使用 Google 登入'}
      </button>
    </section>
  </main>;
  return <>
    <div className="flex items-center justify-between gap-3 bg-slate-900 text-slate-100 px-4 py-2 text-sm">
      <span className="truncate">{session.user.email || '已登入'}</span>
      <button type="button" disabled={busy} onClick={async () => { setBusy(true); try { await signOut(); } finally { setBusy(false); } }}>登出</button>
    </div>
    {error && <p role="alert" className="bg-red-950 text-red-200 p-3">{error}</p>}
    <section key={session.user.id}>{children}</section>
  </>;
}
