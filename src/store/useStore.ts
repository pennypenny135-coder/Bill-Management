import { useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AppData, AppSettings, BillItem, BillRecord, Category, PaymentMethod, Workspace, WorkspaceRoot } from '../types';
import { MAX_WORKSPACES } from '../types';
import { useAuth } from '../auth/AuthProvider';
import { useCloudRoot } from './useCloudRoot';

const now = () => new Date().toISOString();
function emptyData(darkMode = true): AppData {
  return { version: '1.0.0', settings: { currency: 'HKD', currencySymbol: 'HK$', darkMode, firstDayOfMonth: 1, defaultView: 'dashboard', language: 'zh-HK' },
    categories: [
      ['cat-utility', '水電煤', '#f59e0b', '⚡'], ['cat-telecom', '通訊', '#3b82f6', '📱'],
      ['cat-net', '網絡', '#06b6d4', '🌐'], ['cat-insurance', '保險', '#10b981', '🛡️'],
      ['cat-credit', '信用卡', '#8b5cf6', '💳'], ['cat-subscription', '訂閱', '#ec4899', '📺'],
      ['cat-mgmt', '管理費', '#64748b', '🏢'], ['cat-other', '其他', '#94a3b8', '📋'],
    ].map(([id, name, color, icon]) => ({ id, name, color, icon, builtIn: true, active: true })),
    paymentMethods: [], billItems: [], billRecords: [] };
}
function workspace(name: string, darkMode = true): Workspace {
  return { id: uuidv4(), name, createdAt: now(), data: emptyData(darkMode) };
}
function initialRoot(): WorkspaceRoot {
  const ws = workspace('主帳戶');
  return { version: '2.0.0', activeWorkspaceId: ws.id, workspaces: [ws] };
}
function patch<T extends { id: string }>(rows: T[], id: string, value: Partial<T>) {
  return rows.map(row => row.id === id ? { ...row, ...value, id: row.id } : row);
}
function reorder<T>(rows: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= rows.length || to >= rows.length) return rows;
  const result = [...rows]; const [row] = result.splice(from, 1); result.splice(to, 0, row); return result;
}
function download(text: string, name: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function shouldGenerate(item: BillItem, period: string) {
  const [yr, mo] = period.split('-').map(Number); const created = new Date(item.createdAt);
  const diff = (yr - created.getFullYear()) * 12 + mo - created.getMonth() - 1;
  if (diff < 0) return false;
  switch (item.recurrenceType) {
    case 'monthly': return true;
    case 'bimonthly': return diff % 2 === 0;
    case 'quarterly': return diff % 3 === 0;
    case 'semi_annual': return diff % 6 === 0;
    case 'annual': return diff % 12 === 0;
    case 'one_time': return diff === 0;
    case 'custom': { const n = item.recurrenceInterval ?? 1; return Number.isInteger(n) && n > 0 && diff % n === 0; }
    default: return false;
  }
}

export function useStore() {
  const { session } = useAuth();
  const cloud = useCloudRoot(session?.user.id || '', initialRoot);
  const { root, setRoot } = cloud;
  const activeWs = root.workspaces.find(w => w.id === root.activeWorkspaceId) || root.workspaces[0];
  const data = activeWs.data;
  useEffect(() => { document.documentElement.classList.toggle('dark', data.settings.darkMode); }, [data.settings.darkMode]);
  const setData = useCallback((change: (d: AppData) => AppData) => {
    setRoot(r => {
      let changed = false;
      const workspaces = r.workspaces.map(w => {
        if (w.id !== r.activeWorkspaceId) return w;
        const next = change(w.data); if (next === w.data) return w; changed = true; return { ...w, data: next };
      });
      return changed ? { ...r, workspaces } : r;
    });
  }, [setRoot]);
  const switchWorkspace = (id: string) => setRoot(r => r.activeWorkspaceId === id || !r.workspaces.some(w => w.id === id) ? r : { ...r, activeWorkspaceId: id });
  const addWorkspace = (name: string) => setRoot(r => {
    if (r.workspaces.length >= MAX_WORKSPACES) return r;
    const ws = workspace(name.trim(), r.workspaces[0].data.settings.darkMode);
    return { ...r, activeWorkspaceId: ws.id, workspaces: [...r.workspaces, ws] };
  });
  const renameWorkspace = (id: string, name: string) => setRoot(r => ({ ...r, workspaces: r.workspaces.map(w => w.id === id ? { ...w, name: name.trim() } : w) }));
  const deleteWorkspace = (id: string) => setRoot(r => {
    if (r.workspaces.length <= 1 || !r.workspaces.some(w => w.id === id)) return r;
    const workspaces = r.workspaces.filter(w => w.id !== id);
    return { ...r, workspaces, activeWorkspaceId: r.activeWorkspaceId === id ? workspaces[0].id : r.activeWorkspaceId };
  });
  const addCategory = (cat: Omit<Category, 'id'>) => setData(d => ({ ...d, categories: [...d.categories, { ...cat, id: uuidv4() }] }));
  const updateCategory = (id: string, value: Partial<Category>) => setData(d => ({ ...d, categories: patch(d.categories, id, value) }));
  const deleteCategory = (id: string) => setData(d => {
    if (d.billItems.some(b => b.categoryId === id)) throw new Error('請先更改使用此分類的賬單分類，再刪除。');
    return { ...d, categories: d.categories.filter(c => c.id !== id) };
  });
  const reorderCategories = (from: number, to: number) => setData(d => ({ ...d, categories: reorder(d.categories, from, to) }));
  const addPaymentMethod = (pm: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>) => {
    const t = now(); setData(d => ({ ...d, paymentMethods: [...d.paymentMethods, { ...pm, id: uuidv4(), createdAt: t, updatedAt: t }] }));
  };
  const updatePaymentMethod = (id: string, value: Partial<PaymentMethod>) => setData(d => ({ ...d, paymentMethods: patch(d.paymentMethods, id, { ...value, updatedAt: now() }) }));
  const deletePaymentMethod = (id: string) => setData(d => {
    if (d.billItems.some(b => b.defaultPaymentMethodId === id) || d.billRecords.some(r => r.paymentMethodId === id)) throw new Error('此付款方式已有賬單或記錄使用，請停用或先更改相關記錄。');
    return { ...d, paymentMethods: d.paymentMethods.filter(p => p.id !== id) };
  });
  const reorderPaymentMethods = (from: number, to: number) => setData(d => ({ ...d, paymentMethods: reorder(d.paymentMethods, from, to) }));
  const addBillItem = (item: Omit<BillItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const t = now(); setData(d => ({ ...d, billItems: [...d.billItems, { ...item, id: uuidv4(), createdAt: t, updatedAt: t }] }));
  };
  const updateBillItem = (id: string, value: Partial<BillItem>) => setData(d => ({ ...d, billItems: patch(d.billItems, id, { ...value, updatedAt: now() }) }));
  const deleteBillItem = (id: string) => setData(d => ({ ...d, billItems: d.billItems.filter(b => b.id !== id), billRecords: d.billRecords.filter(r => r.billItemId !== id) }));
  const addBillRecord = (rec: Omit<BillRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const t = now(); setData(d => ({ ...d, billRecords: [...d.billRecords, { ...rec, id: uuidv4(), createdAt: t, updatedAt: t }] }));
  };
  const updateBillRecord = (id: string, value: Partial<BillRecord>) => setData(d => ({ ...d, billRecords: patch(d.billRecords, id, { ...value, updatedAt: now() }) }));
  const deleteBillRecord = (id: string) => setData(d => ({ ...d, billRecords: d.billRecords.filter(r => r.id !== id) }));
  const markPaid = (id: string, paid: boolean, paymentMethodId?: string) => setData(d => ({ ...d, billRecords: d.billRecords.map(r => r.id === id ? { ...r, paid, paidDate: paid ? now().split('T')[0] : undefined, paymentMethodId: paymentMethodId ?? r.paymentMethodId, updatedAt: now() } : r) }));
  const generateRecordsForPeriod = useCallback((period: string) => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) return;
    setData(d => {
      const [yr, mo] = period.split('-').map(Number);
      const records: BillRecord[] = [];
      for (const b of d.billItems) {
        if (!b.active || !shouldGenerate(b, period) || d.billRecords.some(r => r.billItemId === b.id && r.period === period)) continue;
        const day = Math.max(1, Math.min(b.dueDay ?? 1, new Date(yr, mo, 0).getDate())); const t = now();
        records.push({ id: uuidv4(), billItemId: b.id, period, dueDate: `${period}-${String(day).padStart(2, '0')}`, amount: b.defaultAmount, paid: false, paymentMethodId: b.defaultPaymentMethodId, note: '', createdAt: t, updatedAt: t });
      }
      return records.length ? { ...d, billRecords: [...d.billRecords, ...records] } : d;
    });
  }, [setData]);
  const updateSettings = (value: Partial<AppSettings>) => setData(d => ({ ...d, settings: { ...d.settings, ...value } }));
  const exportJSON = () => download(JSON.stringify(data, null, 2), `billmaster_${activeWs.name}.json`);
  const exportAllJSON = () => download(JSON.stringify(root, null, 2), 'billmaster_ALL.json');
  const exportCSV = () => {
    const rows = data.billRecords.map(r => {
      const b = data.billItems.find(x => x.id === r.billItemId);
      return [b?.name ?? '', data.categories.find(c => c.id === b?.categoryId)?.name ?? '', r.period, r.dueDate ?? '', r.amount ?? '', r.paid ? '是' : '否', r.paidDate ?? '', data.paymentMethods.find(p => p.id === r.paymentMethodId)?.label ?? '', r.note ?? ''];
    });
    const csv = [['帳單名稱', '分類', '期數', '到期日', '金額', '已付款', '付款日期', '付款方法', '備註'], ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    download('\uFEFF' + csv, `billmaster_${activeWs.name}.csv`, 'text/csv;charset=utf-8');
  };
  const importJSON = async (file: File) => {
    try { const next = JSON.parse(await file.text()) as AppData; setData(() => next); }
    catch { alert('匯入失敗：無效的 JSON'); }
  };
  const importAllJSON = async (file: File) => {
    try {
      const next = JSON.parse(await file.text());
      if (Array.isArray(next.workspaces)) setRoot(next as WorkspaceRoot);
      else setData(() => next as AppData);
    } catch { alert('匯入失敗：無效的 JSON'); }
  };
  const resetToSeed = () => setData(d => emptyData(d.settings.darkMode));
  return { data, workspaces: root.workspaces, activeWorkspaceId: root.activeWorkspaceId,
    switchWorkspace, addWorkspace, renameWorkspace, deleteWorkspace,
    addCategory, updateCategory, deleteCategory, reorderCategories,
    addPaymentMethod, updatePaymentMethod, deletePaymentMethod, reorderPaymentMethods,
    addBillItem, updateBillItem, deleteBillItem, addBillRecord, updateBillRecord, deleteBillRecord,
    markPaid, generateRecordsForPeriod, updateSettings, exportJSON, exportCSV, importJSON,
    exportAllJSON, importAllJSON, resetToSeed,
    cloudReady: cloud.ready, cloudStatus: cloud.status, cloudError: cloud.error, retrySave: cloud.retrySave };
}
export type StoreType = ReturnType<typeof useStore>;
