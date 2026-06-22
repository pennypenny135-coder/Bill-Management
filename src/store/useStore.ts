import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  AppData,
  Category,
  PaymentMethod,
  BillItem,
  BillRecord,
  AppSettings,
  Workspace,
  WorkspaceRoot,
} from '../types';
import { MAX_WORKSPACES } from '../types';

const STORAGE_KEY = 'billmaster_v2';

// ─── Empty data factory (no seed, dark mode default) ─────────────────────────
function createEmptyAppData(darkMode = true): AppData {
  return {
    version: '1.0.0',
    settings: {
      currency: 'HKD',
      currencySymbol: 'HK$',
      darkMode,
      firstDayOfMonth: 1,
      defaultView: 'dashboard',
      language: 'zh-HK',
    },
    categories: [
      { id: 'cat-utility',      name: '水電煤',  color: '#f59e0b', icon: '⚡',  builtIn: true, active: true },
      { id: 'cat-telecom',      name: '通訊',    color: '#3b82f6', icon: '📱',  builtIn: true, active: true },
      { id: 'cat-net',          name: '網絡',    color: '#06b6d4', icon: '🌐',  builtIn: true, active: true },
      { id: 'cat-insurance',    name: '保險',    color: '#10b981', icon: '🛡️', builtIn: true, active: true },
      { id: 'cat-credit',       name: '信用卡',  color: '#8b5cf6', icon: '💳',  builtIn: true, active: true },
      { id: 'cat-subscription', name: '訂閱',    color: '#ec4899', icon: '📺',  builtIn: true, active: true },
      { id: 'cat-mgmt',         name: '管理費',  color: '#64748b', icon: '🏢',  builtIn: true, active: true },
      { id: 'cat-other',        name: '其他',    color: '#94a3b8', icon: '📋',  builtIn: true, active: true },
    ],
    paymentMethods: [],
    billItems: [],
    billRecords: [],
  };
}

function createWorkspace(name: string, darkMode = true): Workspace {
  return {
    id: uuidv4(),
    name,
    createdAt: new Date().toISOString(),
    data: createEmptyAppData(darkMode),
  };
}

function createInitialRoot(): WorkspaceRoot {
  const ws = createWorkspace('主帳戶', true);
  return { version: '2.0.0', activeWorkspaceId: ws.id, workspaces: [ws] };
}

// ─── Load / Save ──────────────────────────────────────────────────────────────
function loadRoot(): WorkspaceRoot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.workspaces && parsed.activeWorkspaceId) return parsed as WorkspaceRoot;
    }
  } catch (e) {
    console.error('Failed to load data', e);
  }
  return createInitialRoot();
}

function saveRoot(root: WorkspaceRoot) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
  } catch (e) {
    console.error('Failed to save data', e);
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useStore() {
  const [root, setRoot] = useState<WorkspaceRoot>(() => loadRoot());

  useEffect(() => { saveRoot(root); }, [root]);

  // Active workspace
  const activeWs =
    root.workspaces.find((w) => w.id === root.activeWorkspaceId) ?? root.workspaces[0];
  const data = activeWs.data;

  // Apply dark mode to <html> element
  useEffect(() => {
    document.documentElement.classList.toggle('dark', data.settings.darkMode);
  }, [data.settings.darkMode]);

  const setData = useCallback((updater: (d: AppData) => AppData) => {
    setRoot((r) => ({
      ...r,
      workspaces: r.workspaces.map((w) =>
        w.id === r.activeWorkspaceId ? { ...w, data: updater(w.data) } : w
      ),
    }));
  }, []);

  const now = () => new Date().toISOString();

  // ─── Workspace management ─────────────────────────────────────────────────
  const workspaces = root.workspaces;
  const activeWorkspaceId = root.activeWorkspaceId;

  const switchWorkspace = useCallback((id: string) => {
    setRoot((r) => ({ ...r, activeWorkspaceId: id }));
  }, []);

  const addWorkspace = useCallback((name: string) => {
    setRoot((r) => {
      if (r.workspaces.length >= MAX_WORKSPACES) return r;
      const darkMode = r.workspaces[0]?.data.settings.darkMode ?? true;
      const ws = createWorkspace(name, darkMode);
      return { ...r, activeWorkspaceId: ws.id, workspaces: [...r.workspaces, ws] };
    });
  }, []);

  const renameWorkspace = useCallback((id: string, name: string) => {
    setRoot((r) => ({
      ...r,
      workspaces: r.workspaces.map((w) => (w.id === id ? { ...w, name } : w)),
    }));
  }, []);

  const deleteWorkspace = useCallback((id: string) => {
    setRoot((r) => {
      if (r.workspaces.length <= 1) return r;
      const remaining = r.workspaces.filter((w) => w.id !== id);
      const newActive =
        r.activeWorkspaceId === id ? remaining[0].id : r.activeWorkspaceId;
      return { ...r, activeWorkspaceId: newActive, workspaces: remaining };
    });
  }, []);

  // ─── Categories ───────────────────────────────────────────────────────────
  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    setData((d) => ({ ...d, categories: [...d.categories, { ...cat, id: uuidv4() }] }));
  }, [setData]);

  const updateCategory = useCallback((id: string, patch: Partial<Category>) => {
    setData((d) => ({ ...d, categories: d.categories.map((c) => c.id === id ? { ...c, ...patch } : c) }));
  }, [setData]);

  const deleteCategory = useCallback((id: string) => {
    setData((d) => ({ ...d, categories: d.categories.filter((c) => c.id !== id) }));
  }, [setData]);

  // ─── Payment Methods ──────────────────────────────────────────────────────
  const addPaymentMethod = useCallback((pm: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>) => {
    const t = now();
    setData((d) => ({
      ...d,
      paymentMethods: [...d.paymentMethods, { ...pm, id: uuidv4(), createdAt: t, updatedAt: t }],
    }));
  }, [setData]);

  const updatePaymentMethod = useCallback((id: string, patch: Partial<PaymentMethod>) => {
    setData((d) => ({
      ...d,
      paymentMethods: d.paymentMethods.map((pm) =>
        pm.id === id ? { ...pm, ...patch, updatedAt: now() } : pm
      ),
    }));
  }, [setData]);

  const deletePaymentMethod = useCallback((id: string) => {
    setData((d) => ({ ...d, paymentMethods: d.paymentMethods.filter((pm) => pm.id !== id) }));
  }, [setData]);

  // ─── Bill Items ───────────────────────────────────────────────────────────
  const addBillItem = useCallback((item: Omit<BillItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const t = now();
    setData((d) => ({
      ...d,
      billItems: [...d.billItems, { ...item, id: uuidv4(), createdAt: t, updatedAt: t }],
    }));
  }, [setData]);

  const updateBillItem = useCallback((id: string, patch: Partial<BillItem>) => {
    setData((d) => ({
      ...d,
      billItems: d.billItems.map((b) => b.id === id ? { ...b, ...patch, updatedAt: now() } : b),
    }));
  }, [setData]);

  const deleteBillItem = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      billItems: d.billItems.filter((b) => b.id !== id),
      billRecords: d.billRecords.filter((r) => r.billItemId !== id),
    }));
  }, [setData]);

  // ─── Bill Records ─────────────────────────────────────────────────────────
  const addBillRecord = useCallback((rec: Omit<BillRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const t = now();
    setData((d) => ({
      ...d,
      billRecords: [...d.billRecords, { ...rec, id: uuidv4(), createdAt: t, updatedAt: t }],
    }));
  }, [setData]);

  const updateBillRecord = useCallback((id: string, patch: Partial<BillRecord>) => {
    setData((d) => ({
      ...d,
      billRecords: d.billRecords.map((r) =>
        r.id === id ? { ...r, ...patch, updatedAt: now() } : r
      ),
    }));
  }, [setData]);

  const deleteBillRecord = useCallback((id: string) => {
    setData((d) => ({ ...d, billRecords: d.billRecords.filter((r) => r.id !== id) }));
  }, [setData]);

  const markPaid = useCallback((id: string, paid: boolean, paymentMethodId?: string) => {
    setData((d) => ({
      ...d,
      billRecords: d.billRecords.map((r) =>
        r.id === id
          ? {
              ...r,
              paid,
              paidDate: paid ? new Date().toISOString().split('T')[0] : undefined,
              paymentMethodId: paymentMethodId ?? r.paymentMethodId,
              updatedAt: now(),
            }
          : r
      ),
    }));
  }, [setData]);

  const generateRecordsForPeriod = useCallback((period: string) => {
    setData((d) => {
      const [yr, mo] = period.split('-').map(Number);
      const newRecords: BillRecord[] = [];
      for (const item of d.billItems) {
        if (!item.active) continue;
        if (d.billRecords.find((r) => r.billItemId === item.id && r.period === period)) continue;
        if (!shouldGenerateForPeriod(item, period)) continue;
        const day = item.dueDay ?? 1;
        const maxDay = new Date(yr, mo, 0).getDate();
        const dueDate = `${period}-${String(Math.min(day, maxDay)).padStart(2, '0')}`;
        const t = new Date().toISOString();
        newRecords.push({
          id: uuidv4(), billItemId: item.id, period, dueDate,
          amount: item.defaultAmount, paid: false,
          paymentMethodId: item.defaultPaymentMethodId,
          note: '', createdAt: t, updatedAt: t,
        });
      }
      return { ...d, billRecords: [...d.billRecords, ...newRecords] };
    });
  }, [setData]);

  // ─── Settings ─────────────────────────────────────────────────────────────
  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, [setData]);

  // ─── Export (current workspace) ───────────────────────────────────────────
  const exportJSON = useCallback(() => {
    const ws = root.workspaces.find((w) => w.id === root.activeWorkspaceId) ?? root.workspaces[0];
    const blob = new Blob([JSON.stringify(ws.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billmaster_${ws.name}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [root]);

  const exportCSV = useCallback(() => {
    const ws = root.workspaces.find((w) => w.id === root.activeWorkspaceId) ?? root.workspaces[0];
    const d = ws.data;
    const headers = ['帳單名稱', '分類', '期數', '到期日', '金額', '已付款', '付款日期', '付款方法', '備註'];
    const rows = d.billRecords.map((r) => {
      const item = d.billItems.find((b) => b.id === r.billItemId);
      const cat = d.categories.find((c) => c.id === item?.categoryId);
      const pm = d.paymentMethods.find((p) => p.id === r.paymentMethodId);
      return [
        item?.name ?? '', cat?.name ?? '', r.period, r.dueDate ?? '',
        r.amount ?? '', r.paid ? '是' : '否', r.paidDate ?? '', pm?.label ?? '', r.note ?? '',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billmaster_${ws.name}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [root]);

  // ─── Import (into current workspace) ─────────────────────────────────────
  const importJSON = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as AppData;
        setData(() => parsed);
      } catch (_) {
        alert('匯入失敗：無效的 JSON 格式');
      }
    };
    reader.readAsText(file);
  }, [setData]);

  // ─── Export ALL workspaces ────────────────────────────────────────────────
  const exportAllJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(root, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billmaster_ALL_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [root]);

  // ─── Import ALL workspaces ────────────────────────────────────────────────
  const importAllJSON = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.workspaces && parsed.activeWorkspaceId) {
          setRoot(parsed as WorkspaceRoot);
        } else if (parsed.billItems !== undefined) {
          setData(() => parsed as AppData);
        } else {
          alert('匯入失敗：無法識別的格式');
        }
      } catch (_) {
        alert('匯入失敗：無效的 JSON 格式');
      }
    };
    reader.readAsText(file);
  }, [setData]);

  const resetToSeed = useCallback(() => {
    setData(() => createEmptyAppData(data.settings.darkMode));
  }, [setData, data.settings.darkMode]);

  return {
    data,
    // Workspace
    workspaces,
    activeWorkspaceId,
    switchWorkspace,
    addWorkspace,
    renameWorkspace,
    deleteWorkspace,
    // Categories
    addCategory, updateCategory, deleteCategory,
    // Payment Methods
    addPaymentMethod, updatePaymentMethod, deletePaymentMethod,
    // Bill Items
    addBillItem, updateBillItem, deleteBillItem,
    // Bill Records
    addBillRecord, updateBillRecord, deleteBillRecord,
    markPaid, generateRecordsForPeriod,
    // Settings
    updateSettings,
    // Export/Import (current workspace)
    exportJSON, exportCSV, importJSON,
    // Export/Import (all workspaces)
    exportAllJSON, importAllJSON,
    resetToSeed,
  };
}

function shouldGenerateForPeriod(item: BillItem, period: string): boolean {
  const [yr, mo] = period.split('-').map(Number);
  const createdDate = new Date(item.createdAt);
  const createdPeriod = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
  switch (item.recurrenceType) {
    case 'monthly': return true;
    case 'bimonthly': { const [cYr, cMo] = createdPeriod.split('-').map(Number); return ((yr - cYr) * 12 + (mo - cMo)) % 2 === 0; }
    case 'quarterly': { const [cYr, cMo] = createdPeriod.split('-').map(Number); return ((yr - cYr) * 12 + (mo - cMo)) % 3 === 0; }
    case 'semi_annual': { const [cYr, cMo] = createdPeriod.split('-').map(Number); return ((yr - cYr) * 12 + (mo - cMo)) % 6 === 0; }
    case 'annual': return mo === createdDate.getMonth() + 1;
    case 'one_time': return period === createdPeriod;
    case 'custom': { const interval = item.recurrenceInterval ?? 1; const [cYr, cMo] = createdPeriod.split('-').map(Number); const diff = (yr - cYr) * 12 + (mo - cMo); return diff >= 0 && diff % interval === 0; }
    default: return false;
  }
}

export type StoreType = ReturnType<typeof useStore>;
