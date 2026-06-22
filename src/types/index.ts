// ─── Categories ───────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  builtIn: boolean;
  active: boolean;
}

// ─── Payment Methods ───────────────────────────────────────────────────────────
export type PaymentMethodType =
  | 'cash'
  | 'credit_card'
  | 'alipay'
  | 'fps'
  | 'bank_transfer'
  | 'autopay'
  | 'other';

export type BankCode = 'hsbc' | 'hsb' | 'pc' | 'boc' | 'other';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  bankCode?: BankCode | null;
  bankName?: string;
  label: string;
  last4?: string;
  autopayEnabled: boolean;
  note?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Bill Items ────────────────────────────────────────────────────────────────
export type RecurrenceType =
  | 'monthly'
  | 'bimonthly'
  | 'quarterly'
  | 'semi_annual'
  | 'annual'
  | 'one_time'
  | 'custom';

export interface BillItem {
  id: string;
  name: string;
  categoryId: string;
  recurrenceType: RecurrenceType;
  recurrenceInterval?: number; // for custom, in months
  dueDay?: number; // day of month, 1-31
  defaultAmount?: number;
  defaultPaymentMethodId?: string;
  note?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Bill Records ──────────────────────────────────────────────────────────────
export interface BillRecord {
  id: string;
  billItemId: string;
  period: string; // e.g. "2026-06"
  dueDate?: string; // ISO date string
  amount?: number;
  paid: boolean;
  paidDate?: string;
  paymentMethodId?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── App Settings ──────────────────────────────────────────────────────────────
export interface AppSettings {
  currency: string;
  currencySymbol: string;
  darkMode: boolean;
  firstDayOfMonth: number;
  defaultView: 'dashboard' | 'bills';
  language: 'zh-HK' | 'en';
}

// ─── App Store ─────────────────────────────────────────────────────────────────
export interface AppData {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  billItems: BillItem[];
  billRecords: BillRecord[];
  settings: AppSettings;
  version: string;
}
