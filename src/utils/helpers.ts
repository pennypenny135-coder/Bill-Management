import type { BillRecord, PaymentMethod, RecurrenceType, PaymentMethodType } from '../types';

export function formatCurrency(amount: number | undefined, symbol = 'HK$'): string {
  if (amount === undefined || amount === null) return '—';
  return `${symbol}${amount.toLocaleString('zh-HK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function formatPeriod(period: string): string {
  const [yr, mo] = period.split('-');
  return `${yr}年${parseInt(mo)}月`;
}

export function getCurrentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getPeriodDate(period: string): Date {
  const [yr, mo] = period.split('-').map(Number);
  return new Date(yr, mo - 1, 1);
}

export function addMonths(period: string, n: number): string {
  const [yr, mo] = period.split('-').map(Number);
  const d = new Date(yr, mo - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function isOverdue(record: BillRecord): boolean {
  if (record.paid) return false;
  if (!record.dueDate) return false;
  return new Date(record.dueDate) < new Date(new Date().toDateString());
}

export function isDueSoon(record: BillRecord, daysThreshold = 7): boolean {
  if (record.paid) return false;
  if (!record.dueDate) return false;
  const due = new Date(record.dueDate);
  const today = new Date(new Date().toDateString());
  const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= daysThreshold;
}

export function getRecordStatus(record: BillRecord): 'paid' | 'overdue' | 'due_soon' | 'pending' {
  if (record.paid) return 'paid';
  if (isOverdue(record)) return 'overdue';
  if (isDueSoon(record)) return 'due_soon';
  return 'pending';
}

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  monthly: '每月',
  bimonthly: '雙月',
  quarterly: '每季',
  semi_annual: '每半年',
  annual: '每年',
  one_time: '一次性',
  custom: '自訂',
};

export const PAYMENT_TYPE_LABELS: Record<PaymentMethodType, string> = {
  cash: '現金',
  credit_card: '信用卡',
  alipay: 'Alipay',
  fps: '轉數快 FPS',
  bank_transfer: '銀行轉賬',
  autopay: '自動轉賬',
  other: '其他',
};

export const PAYMENT_TYPE_ICONS: Record<PaymentMethodType, string> = {
  cash: '💵',
  credit_card: '💳',
  alipay: '🟦',
  fps: '⚡',
  bank_transfer: '🏦',
  autopay: '🔄',
  other: '💰',
};

export const BANK_LABELS: Record<string, string> = {
  hsbc: 'HSBC',
  hsb: 'Hang Seng Bank',
  pc: 'PrimeCredit',
  boc: '中國銀行 BOC',
  other: '其他銀行',
};

export function getPaymentMethodDisplay(pm: PaymentMethod | undefined): string {
  if (!pm) return '—';
  return pm.label + (pm.last4 ? ` (${pm.last4})` : '') + (pm.autopayEnabled ? ' [AutoPay]' : '');
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'paid': return 'text-emerald-600 dark:text-emerald-400';
    case 'overdue': return 'text-red-600 dark:text-red-400';
    case 'due_soon': return 'text-amber-600 dark:text-amber-400';
    default: return 'text-slate-500 dark:text-slate-400';
  }
}

export function getStatusBg(status: string): string {
  switch (status) {
    case 'paid': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'due_soon': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'paid': return '已付款';
    case 'overdue': return '逾期';
    case 'due_soon': return '即將到期';
    default: return '未付款';
  }
}

export function getLast6Periods(): string[] {
  const periods: string[] = [];
  for (let i = 5; i >= 0; i--) {
    periods.push(addMonths(getCurrentPeriod(), -i));
  }
  return periods;
}

export function getLast12Periods(): string[] {
  const periods: string[] = [];
  for (let i = 11; i >= 0; i--) {
    periods.push(addMonths(getCurrentPeriod(), -i));
  }
  return periods;
}

export function calcTotalForPeriod(records: BillRecord[]): number {
  return records.reduce((sum, r) => sum + (r.amount ?? 0), 0);
}

export function calcPaidForPeriod(records: BillRecord[]): number {
  return records.filter((r) => r.paid).reduce((sum, r) => sum + (r.amount ?? 0), 0);
}

export function calcUnpaidForPeriod(records: BillRecord[]): number {
  return records.filter((r) => !r.paid).reduce((sum, r) => sum + (r.amount ?? 0), 0);
}

export const CATEGORY_COLORS = [
  '#f59e0b', '#3b82f6', '#06b6d4', '#10b981', '#8b5cf6',
  '#ec4899', '#64748b', '#94a3b8', '#ef4444', '#f97316',
  '#84cc16', '#14b8a6',
];

export const CATEGORY_ICONS = [
  '⚡', '📱', '🌐', '🛡️', '💳', '📺', '🏢', '📋',
  '🚗', '🏥', '📚', '🎮', '🏠', '✈️', '🍽️', '💊',
];
