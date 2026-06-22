import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, CreditCard, BarChart3,
  Settings, Tag, Menu, X, Plus, Moon, Sun,
} from 'lucide-react';
import { useStoreContext } from '../store/StoreContext';
import { cn } from '../utils/cn';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: '主頁' },
  { path: '/bills', icon: Receipt, label: '帳單列表' },
  { path: '/payment-methods', icon: CreditCard, label: '付款方法' },
  { path: '/categories', icon: Tag, label: '分類' },
  { path: '/reports', icon: BarChart3, label: '統計報表' },
  { path: '/settings', icon: Settings, label: '設定備份' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { data, updateSettings } = useStoreContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const dark = data.settings.darkMode;

  // Apply dark class to html element
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', dark);
  }

  return (
    <div className={cn('min-h-screen flex', dark ? 'dark' : '')}>
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex flex-col w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 fixed h-full z-30">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏦</span>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">帳單管家</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">固定支出管理</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-400">本地離線儲存</span>
          <button
            onClick={() => updateSettings({ darkMode: !dark })}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏦</span>
          <span className="font-bold text-slate-900 dark:text-white text-sm">帳單管家</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateSettings({ darkMode: !dark })}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 shadow-xl flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏦</span>
                <span className="font-bold text-slate-900 dark:text-white">帳單管家</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1 text-slate-500">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
                const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'text-slate-600 dark:text-slate-400'
                    )}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-60 min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="pt-14 lg:pt-0 min-h-screen">
          {children}
        </div>
      </main>

      {/* Mobile FAB */}
      <Link
        to="/bills/add"
        className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
}
