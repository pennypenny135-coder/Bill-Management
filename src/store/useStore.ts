import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  AppData,
  Category,
  PaymentMethod,
  BillItem,
  BillRecord,
  AppSettings,
} from '../types';
import { createSeedData } from '../data/seedData';

const STORAGE_KEY = 'billmaster_data';

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load data', e);
  }
  return createSeedData();
}

function saveData(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data', e);
  }
}

export function useStore() {
  const [data, setData] = useState<AppData>(() => loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const now = () => new Date().toISOString();

  // ─── Categories ─────────────────────────────────────────────────────────────
  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    setData((d) => ({
      ...d,
      categories: [...d.categories, { ...cat, id: uuidv4() }],
    }));
  }, []);

  const updateCategory = useCallback((id: string, patch: Partial<Category>) => {
    setData((d) => ({
      ...d,
      categories: d.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      categories: d.categories.filter((c) => c.id !== id),
    }));
  }, []);

  // ─── Payment Methods ─────────────────────────────────────────────────────────
  const addPaymentMethod = useCallback((pm: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>) => {
    const t = now();
    setData((d) => ({
      ...d,
      paymentMethods: [...d.paymentMethods, { ...pm, id: uuidv4(), createdAt: t, updatedAt: t }],
    }));
  }, []);

  const updatePaymentMethod = useCallback((id: string, patch: Partial<PaymentMethod>) => {
    setData((d) => ({
      ...d,
      paymentMethods: d.paymentMethods.map((pm) =>
        pm.id === id ? { ...pm, ...patch, updatedAt: now() } : pm
      ),
    }));
  }, []);

  const deletePaymentMethod = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      paymentMethods: d.paymentMethods.filter((pm) => pm.id !== id),
    }));
  }, []);

  // ─── Bill Items ──────────────────────────────────────────────────────────────
  const addBillItem = useCallback((item: Omit<BillItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const t = now();
    setData((d) => ({
      ...d,
      billItems: [...d.billItems, { ...item, id: uuidv4(), createdAt: t, updatedAt: t }],
    }));
  }, []);

  const updateBillItem = useCallback((id: string, patch: Partial<BillItem>) => {
    setData((d) => ({
      ...d,
      billItems: d.billItems.map((b) => (b.id === id ? { ...b, ...patch, updatedAt: now() } : b)),
    }));
  }, []);

  const deleteBillItem = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      billItems: d.billItems.filter((b) => b.id !== id),
      billRecords: d.billRecords.filter((r) => r.billItemId !== id),
    }));
  }, []);

  // ─── Bill Records ────────────────────────────────────────────────────────────
  const addBillRecord = useCallback((rec: Omit<BillRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const t = now();
    setData((d) => ({
      ...d,
      billRecords: [...d.billRecords, { ...rec, id: uuidv4(), createdAt: t, updatedAt: t }],
    }));
  }, []);

  const updateBillRecord = useCallback((id: string, patch: Partial<BillRecord>) => {
    setData((d) => ({
      ...d,
      billRecords: d.billRecords.map((r) =>
        r.id === id ? { ...r, ...patch, updatedAt: now() } : r
      ),
    }));
  }, []);

  const deleteBillRecord = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      billRecords: d.billRecords.filter((r) => r.id !== id),
    }));
  }, []);

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
  }, []);

  // Generate records for a period
  const generateRecordsForPeriod = useCallback(
    (period: string) => {
      setData((d) => {
        const [yr, mo] = period.split('-').map(Number);
        const newRecords: BillRecord[] = [];

        for (const item of d.billItems) {
          if (!item.active) continue;
          const existing = d.billRecords.find(
            (r) => r.billItemId === item.id && r.period === period
          );
          if (existing) continue;

          // Check recurrence
          const shouldGenerate = shouldGenerateForPeriod(item, period);
          if (!shouldGenerate) continue;

          const day = item.dueDay ?? 1;
          const maxDay = new Date(yr, mo, 0).getDate();
          const dueDate = `${period}-${String(Math.min(day, maxDay)).padStart(2, '0')}`;

          const t = new Date().toISOString();
          newRecords.push({
            id: uuidv4(),
            billItemId: item.id,
            period,
            dueDate,
            amount: item.defaultAmount,
            paid: false,
            paymentMethodId: item.defaultPaymentMethodId,
            note: '',
            createdAt: t,
            updatedAt: t,
          });
        }

        return {
          ...d,
          billRecords: [...d.billRecords, ...newRecords],
        };
      });
    },
    []
  );

  // ─── Settings ────────────────────────────────────────────────────────────────
  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);

  // ─── Import / Export ─────────────────────────────────────────────────────────
  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billmaster_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const exportCSV = useCallback(() => {
    const headers = [
      '帳單名稱', '分類', '期數', '到期日', '金額', '已付款', '付款日期', '付款方法', '備註',
    ];
    const rows = data.billRecords.map((r) => {
      const item = data.billItems.find((b) => b.id === r.billItemId);
      const cat = data.categories.find((c) => c.id === item?.categoryId);
      const pm = data.paymentMethods.find((p) => p.id === r.paymentMethodId);
      return [
        item?.name ?? '',
        cat?.name ?? '',
        r.period,
        r.dueDate ?? '',
        r.amount ?? '',
        r.paid ? '是' : '否',
        r.paidDate ?? '',
        pm?.label ?? '',
        r.note ?? '',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billmaster_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const importJSON = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as AppData;
        setData(parsed);
      } catch (err) {
        alert('匯入失敗：無效的 JSON 格式');
      }
    };
    reader.readAsText(file);
  }, []);

  const resetToSeed = useCallback(() => {
    setData(createSeedData());
  }, []);

  return {
    data,
    // Categories
    addCategory,
    updateCategory,
    deleteCategory,
    // Payment Methods
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    // Bill Items
    addBillItem,
    updateBillItem,
    deleteBillItem,
    // Bill Records
    addBillRecord,
    updateBillRecord,
    deleteBillRecord,
    markPaid,
    generateRecordsForPeriod,
    // Settings
    updateSettings,
    // Import/Export
    exportJSON,
    exportCSV,
    importJSON,
    resetToSeed,
  };
}

function shouldGenerateForPeriod(item: BillItem, period: string): boolean {
  const [yr, mo] = period.split('-').map(Number); // mo is 1-indexed
  const createdDate = new Date(item.createdAt);
  const createdPeriod = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;

  switch (item.recurrenceType) {
    case 'monthly':
      return true;
    case 'bimonthly': {
      const [cYr, cMo] = createdPeriod.split('-').map(Number);
      const monthsDiff = (yr - cYr) * 12 + (mo - cMo);
      return monthsDiff % 2 === 0;
    }
    case 'quarterly': {
      const [cYr, cMo] = createdPeriod.split('-').map(Number);
      const monthsDiff = (yr - cYr) * 12 + (mo - cMo);
      return monthsDiff % 3 === 0;
    }
    case 'semi_annual': {
      const [cYr, cMo] = createdPeriod.split('-').map(Number);
      const monthsDiff = (yr - cYr) * 12 + (mo - cMo);
      return monthsDiff % 6 === 0;
    }
    case 'annual': {
      const createdMo = createdDate.getMonth() + 1;
      return mo === createdMo;
    }
    case 'one_time':
      return period === createdPeriod;
    case 'custom': {
      const interval = item.recurrenceInterval ?? 1;
      const [cYr, cMo] = createdPeriod.split('-').map(Number);
      const monthsDiff = (yr - cYr) * 12 + (mo - cMo);
      return monthsDiff >= 0 && monthsDiff % interval === 0;
    }
    default:
      return false;
  }
}

export type StoreType = ReturnType<typeof useStore>;
