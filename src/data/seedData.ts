import { v4 as uuidv4 } from 'uuid';
import type { AppData } from '../types';

const now = new Date().toISOString();

// Fixed IDs for seed data references
const CAT_UTILITY = 'cat-utility';
const CAT_TELECOM = 'cat-telecom';
const CAT_NET = 'cat-net';
const CAT_INSURANCE = 'cat-insurance';
const CAT_CREDIT = 'cat-credit';
const CAT_SUBSCRIPTION = 'cat-subscription';
const CAT_MGMT = 'cat-mgmt';
const CAT_OTHER = 'cat-other';

const PM_CASH = 'pm-cash';
const PM_HSBC_RED = 'pm-hsbc-red';
const PM_HSB_VISA = 'pm-hsb-visa';
const PM_PC_MASTER = 'pm-pc-master';
const PM_ALIPAY = 'pm-alipay';
const PM_FPS = 'pm-fps';
const PM_BOC_AUTOPAY = 'pm-boc-autopay';

const BILL_WATER = 'bill-water';
const BILL_ELEC = 'bill-elec';
const BILL_GAS = 'bill-gas';
const BILL_PHONE = 'bill-phone';
const BILL_NET = 'bill-net';
const BILL_MGMT = 'bill-mgmt';
const BILL_NETFLIX = 'bill-netflix';

function getPeriod(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getPrevPeriod(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return getPeriod(d);
}

function getDueDate(year: number, month: number, day: number) {
  const d = new Date(year, month, Math.min(day, new Date(year, month + 1, 0).getDate()));
  return d.toISOString().split('T')[0];
}

export function createSeedData(): AppData {
  const today = new Date();
  const currentPeriod = getPeriod(today);
  const prevPeriod = getPrevPeriod(today);
  const yr = today.getFullYear();
  const mo = today.getMonth(); // 0-indexed

  return {
    version: '1.0.0',
    settings: {
      currency: 'HKD',
      currencySymbol: 'HK$',
      darkMode: false,
      firstDayOfMonth: 1,
      defaultView: 'dashboard',
      language: 'zh-HK',
    },
    categories: [
      { id: CAT_UTILITY, name: '水電煤', color: '#f59e0b', icon: '⚡', builtIn: true, active: true },
      { id: CAT_TELECOM, name: '通訊', color: '#3b82f6', icon: '📱', builtIn: true, active: true },
      { id: CAT_NET, name: '網絡', color: '#06b6d4', icon: '🌐', builtIn: true, active: true },
      { id: CAT_INSURANCE, name: '保險', color: '#10b981', icon: '🛡️', builtIn: true, active: true },
      { id: CAT_CREDIT, name: '信用卡', color: '#8b5cf6', icon: '💳', builtIn: true, active: true },
      { id: CAT_SUBSCRIPTION, name: '訂閱', color: '#ec4899', icon: '📺', builtIn: true, active: true },
      { id: CAT_MGMT, name: '管理費', color: '#64748b', icon: '🏢', builtIn: true, active: true },
      { id: CAT_OTHER, name: '其他', color: '#94a3b8', icon: '📋', builtIn: true, active: true },
    ],
    paymentMethods: [
      {
        id: PM_CASH,
        type: 'cash',
        label: '現金',
        autopayEnabled: false,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: PM_HSBC_RED,
        type: 'credit_card',
        bankCode: 'hsbc',
        bankName: 'HSBC',
        label: 'HSBC Red Card',
        last4: '1234',
        autopayEnabled: false,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: PM_HSB_VISA,
        type: 'credit_card',
        bankCode: 'hsb',
        bankName: 'Hang Seng Bank',
        label: 'HSB Visa',
        last4: '5678',
        autopayEnabled: false,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: PM_PC_MASTER,
        type: 'credit_card',
        bankCode: 'pc',
        bankName: 'PrimeCredit',
        label: 'PC Master',
        last4: '9012',
        autopayEnabled: false,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: PM_ALIPAY,
        type: 'alipay',
        label: 'AlipayHK',
        autopayEnabled: false,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: PM_FPS,
        type: 'fps',
        label: '轉數快 FPS',
        autopayEnabled: false,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: PM_BOC_AUTOPAY,
        type: 'bank_transfer',
        bankCode: 'boc',
        bankName: '中國銀行',
        label: '中銀戶口 AutoPay',
        autopayEnabled: true,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
    billItems: [
      {
        id: BILL_WATER,
        name: '水費',
        categoryId: CAT_UTILITY,
        recurrenceType: 'bimonthly',
        dueDay: 20,
        defaultAmount: 180,
        defaultPaymentMethodId: PM_FPS,
        note: '水務署兩月一期',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: BILL_ELEC,
        name: '電費',
        categoryId: CAT_UTILITY,
        recurrenceType: 'monthly',
        dueDay: 15,
        defaultAmount: 650,
        defaultPaymentMethodId: PM_BOC_AUTOPAY,
        note: '中電每月',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: BILL_GAS,
        name: '煤氣費',
        categoryId: CAT_UTILITY,
        recurrenceType: 'monthly',
        dueDay: 18,
        defaultAmount: 280,
        defaultPaymentMethodId: PM_BOC_AUTOPAY,
        note: '香港煤氣每月',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: BILL_PHONE,
        name: '電話費',
        categoryId: CAT_TELECOM,
        recurrenceType: 'monthly',
        dueDay: 10,
        defaultAmount: 198,
        defaultPaymentMethodId: PM_HSBC_RED,
        note: 'CMHK 月費',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: BILL_NET,
        name: '網費',
        categoryId: CAT_NET,
        recurrenceType: 'monthly',
        dueDay: 5,
        defaultAmount: 158,
        defaultPaymentMethodId: PM_HSB_VISA,
        note: '網上行寬頻',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: BILL_MGMT,
        name: '管理費',
        categoryId: CAT_MGMT,
        recurrenceType: 'monthly',
        dueDay: 1,
        defaultAmount: 850,
        defaultPaymentMethodId: PM_BOC_AUTOPAY,
        note: '大廈管理費',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: BILL_NETFLIX,
        name: 'Netflix',
        categoryId: CAT_SUBSCRIPTION,
        recurrenceType: 'monthly',
        dueDay: 22,
        defaultAmount: 93,
        defaultPaymentMethodId: PM_PC_MASTER,
        note: '標準方案',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
    billRecords: [
      // Previous month - all paid
      {
        id: uuidv4(),
        billItemId: BILL_ELEC,
        period: prevPeriod,
        dueDate: getDueDate(yr, mo - 1, 15),
        amount: 620,
        paid: true,
        paidDate: getDueDate(yr, mo - 1, 14),
        paymentMethodId: PM_BOC_AUTOPAY,
        note: '',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        billItemId: BILL_GAS,
        period: prevPeriod,
        dueDate: getDueDate(yr, mo - 1, 18),
        amount: 265,
        paid: true,
        paidDate: getDueDate(yr, mo - 1, 17),
        paymentMethodId: PM_BOC_AUTOPAY,
        note: '',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        billItemId: BILL_PHONE,
        period: prevPeriod,
        dueDate: getDueDate(yr, mo - 1, 10),
        amount: 198,
        paid: true,
        paidDate: getDueDate(yr, mo - 1, 9),
        paymentMethodId: PM_HSBC_RED,
        note: '',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        billItemId: BILL_NET,
        period: prevPeriod,
        dueDate: getDueDate(yr, mo - 1, 5),
        amount: 158,
        paid: true,
        paidDate: getDueDate(yr, mo - 1, 5),
        paymentMethodId: PM_HSB_VISA,
        note: '',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        billItemId: BILL_MGMT,
        period: prevPeriod,
        dueDate: getDueDate(yr, mo - 1, 1),
        amount: 850,
        paid: true,
        paidDate: getDueDate(yr, mo - 1, 1),
        paymentMethodId: PM_BOC_AUTOPAY,
        note: '',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        billItemId: BILL_NETFLIX,
        period: prevPeriod,
        dueDate: getDueDate(yr, mo - 1, 22),
        amount: 93,
        paid: true,
        paidDate: getDueDate(yr, mo - 1, 22),
        paymentMethodId: PM_PC_MASTER,
        note: '',
        createdAt: now,
        updatedAt: now,
      },
      // Current month - some paid, some not
      {
        id: uuidv4(),
        billItemId: BILL_ELEC,
        period: currentPeriod,
        dueDate: getDueDate(yr, mo, 15),
        amount: 680,
        paid: today.getDate() > 15,
        paidDate: today.getDate() > 15 ? getDueDate(yr, mo, 15) : undefined,
        paymentMethodId: PM_BOC_AUTOPAY,
        note: '',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        billItemId: BILL_GAS,
        period: currentPeriod,
        dueDate: getDueDate(yr, mo, 18),
        amount: 295,
        paid: today.getDate() > 18,
        paidDate: today.getDate() > 18 ? getDueDate(yr, mo, 18) : undefined,
        paymentMethodId: PM_BOC_AUTOPAY,
        note: '',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        billItemId: BILL_PHONE,
        period: currentPeriod,
        dueDate: getDueDate(yr, mo, 10),
        amount: 198,
        paid: today.getDate() > 10,
        paidDate: today.getDate() > 10 ? getDueDate(yr, mo, 10) : undefined,
        paymentMethodId: PM_HSBC_RED,
        note: '',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        billItemId: BILL_NET,
        period: currentPeriod,
        dueDate: getDueDate(yr, mo, 5),
        amount: 158,
        paid: today.getDate() > 5,
        paidDate: today.getDate() > 5 ? getDueDate(yr, mo, 5) : undefined,
        paymentMethodId: PM_HSB_VISA,
        note: '',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        billItemId: BILL_MGMT,
        period: currentPeriod,
        dueDate: getDueDate(yr, mo, 1),
        amount: 850,
        paid: true,
        paidDate: getDueDate(yr, mo, 1),
        paymentMethodId: PM_BOC_AUTOPAY,
        note: '',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        billItemId: BILL_NETFLIX,
        period: currentPeriod,
        dueDate: getDueDate(yr, mo, 22),
        amount: 93,
        paid: today.getDate() > 22,
        paidDate: today.getDate() > 22 ? getDueDate(yr, mo, 22) : undefined,
        paymentMethodId: PM_PC_MASTER,
        note: '',
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}
