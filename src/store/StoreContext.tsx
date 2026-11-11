import { createContext, useContext, type ReactNode } from 'react';
import { useStore, type StoreType } from './useStore';

const StoreContext = createContext<StoreType | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  if (store.cloudError) return <main className="p-6 space-y-4">
    <h1>雲端資料未能同步</h1>
    <p role="alert">{store.cloudError}</p>
    <p>尚未儲存的變更只保留於此頁記憶體。請先匯出備份，勿直接關閉或登出。</p>
    {store.cloudReady && <><button onClick={store.exportAllJSON}>匯出目前資料備份</button><button onClick={store.retrySave}>重試儲存</button></>}
    <button onClick={() => { if (window.confirm('重新載入會放棄此頁未儲存的變更。已匯出備份並確定繼續？')) window.location.reload(); }}>重新載入雲端資料</button>
  </main>;
  if (!store.cloudReady) return <main className="p-6" role="status">正在載入你的賬單…</main>;
  return <StoreContext.Provider value={store}>
    <div className="px-4 py-1 text-xs bg-slate-100 text-slate-700" role="status">{store.cloudStatus}</div>
    {children}
  </StoreContext.Provider>;
}
export function useStoreContext() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStoreContext must be used inside StoreProvider');
  return ctx;
}
