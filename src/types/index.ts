// ─── Categories ───────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  builtIn: boolean;
  active: boolean;
}

// ─── Payment Methods ─────────────────────────────────────────────────────────
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

// ─── Bill Items ───────────────────────────────────────────────────────────────
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
  recurrenceInterval?: number;
  dueDay?: number;
  defaultAmount?: number;
  defaultPaymentMethodId?: string;
  note?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Bill Records ─────────────────────────────────────────────────────────────
export interface BillRecord {
  id: string;
  billItemId: string;
  period: string;
  dueDate?: string;
  amount?: number;
  paid: boolean;
  paidDate?: string;
  paymentMethodId?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── App Settings ─────────────────────────────────────────────────────────────
export interface AppSettings {
  currency: string;
  currencySymbol: string;
  darkMode: boolean;
  firstDayOfMonth: number;
  defaultView: 'dashboard' | 'bills';
  language: 'zh-HK' | 'en';
}

// ─── App Data (per workspace) ─────────────────────────────────────────────────
export interface AppData {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  billItems: BillItem[];
  billRecords: BillRecord[];
  settings: AppSettings;
  version: string;
}

// ─── Multi-Workspace ──────────────────────────────────────────────────────────
export const MAX_WORKSPACES = 3;

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  data: AppData;
}

export interface WorkspaceRoot {
  version: string;
  activeWorkspaceId: string;
  workspaces: Workspace[];
}
