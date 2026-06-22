import { useState } from 'react';
import { Plus, Edit3, Trash2, ToggleRight } from 'lucide-react';
import { useStoreContext } from '../store/StoreContext';
import { Card, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FormField, Input, Select, TextArea } from '../components/ui/FormField';
import {
  PAYMENT_TYPE_LABELS, PAYMENT_TYPE_ICONS, BANK_LABELS,
} from '../utils/helpers';
import type { PaymentMethod, PaymentMethodType, BankCode } from '../types';

const BANK_OPTIONS: { code: BankCode; name: string }[] = [
  { code: 'hsbc', name: 'HSBC' },
  { code: 'hsb', name: 'Hang Seng Bank (恒生)' },
  { code: 'pc', name: 'PrimeCredit' },
  { code: 'boc', name: '中國銀行 BOC' },
  { code: 'other', name: '其他銀行' },
];

const EMPTY_FORM = {
  type: 'credit_card' as PaymentMethodType,
  bankCode: 'hsbc' as BankCode,
  bankName: '',
  label: '',
  last4: '',
  autopayEnabled: false,
  note: '',
  active: true,
};

export default function PaymentMethods() {
  const { data, addPaymentMethod, updatePaymentMethod, deletePaymentMethod } = useStoreContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openAdd = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (pm: PaymentMethod) => {
    setForm({
      type: pm.type,
      bankCode: (pm.bankCode as BankCode) ?? 'hsbc',
      bankName: pm.bankName ?? '',
      label: pm.label,
      last4: pm.last4 ?? '',
      autopayEnabled: pm.autopayEnabled,
      note: pm.note ?? '',
      active: pm.active,
    });
    setEditingId(pm.id);
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.label.trim()) errs.label = '請輸入顯示名稱';
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const needsBank = form.type === 'credit_card' || form.type === 'bank_transfer';
    const data_to_save = {
      type: form.type,
      bankCode: needsBank ? form.bankCode : null,
      bankName: needsBank ? (form.bankCode === 'other' ? form.bankName : BANK_LABELS[form.bankCode]) : undefined,
      label: form.label.trim(),
      last4: form.type === 'credit_card' && form.last4 ? form.last4 : undefined,
      autopayEnabled: form.autopayEnabled,
      note: form.note.trim(),
      active: form.active,
    };

    if (editingId) {
      updatePaymentMethod(editingId, data_to_save);
    } else {
      addPaymentMethod(data_to_save);
    }
    setModalOpen(false);
  };

  const handleDelete = (pm: PaymentMethod) => {
    if (confirm(`確定要刪除「${pm.label}」付款方法？`)) {
      deletePaymentMethod(pm.id);
    }
  };

  const activeMethods = data.paymentMethods.filter((p) => p.active);
  const inactiveMethods = data.paymentMethods.filter((p) => !p.active);

  // Stats: how many bills use each method
  const getUsageCount = (pmId: string) =>
    data.billItems.filter((b) => b.defaultPaymentMethodId === pmId && b.active).length;

  const getPaidAmountThisMonth = (pmId: string) => {
    const currentPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    return data.billRecords
      .filter((r) => r.period === currentPeriod && r.paid && r.paymentMethodId === pmId)
      .reduce((s, r) => s + (r.amount ?? 0), 0);
  };

  const sym = data.settings.currencySymbol;

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">付款方法</h1>
        <Button size="sm" onClick={openAdd}>
          <Plus size={14} /> 新增
        </Button>
      </div>

      {/* Active methods */}
      <div className="space-y-3">
        {activeMethods.map((pm) => {
          const usage = getUsageCount(pm.id);
          const paidAmt = getPaidAmountThisMonth(pm.id);
          return (
            <Card key={pm.id}>
              <CardBody>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0">
                    {PAYMENT_TYPE_ICONS[pm.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 dark:text-white">{pm.label}</p>
                      {pm.last4 && (
                        <span className="text-xs text-slate-400 font-mono">···· {pm.last4}</span>
                      )}
                      {pm.autopayEnabled && <Badge variant="info">AutoPay</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
                      <span>{PAYMENT_TYPE_LABELS[pm.type]}</span>
                      {pm.bankName && <span>· {pm.bankName}</span>}
                      <span>· {usage} 項帳單</span>
                      {paidAmt > 0 && <span className="text-emerald-600">· 本月已付 {sym}{paidAmt.toLocaleString()}</span>}
                    </div>
                    {pm.note && <p className="text-xs text-slate-400 mt-1">{pm.note}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updatePaymentMethod(pm.id, { active: false })}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                      title="停用"
                    >
                      <ToggleRight size={18} className="text-indigo-600" />
                    </button>
                    <button
                      onClick={() => openEdit(pm)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(pm)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Inactive */}
      {inactiveMethods.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 mb-2">已停用</p>
          <div className="space-y-2">
            {inactiveMethods.map((pm) => (
              <div key={pm.id} className="flex items-center gap-3 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl opacity-60">
                <span className="text-lg">{PAYMENT_TYPE_ICONS[pm.type]}</span>
                <span className="text-sm text-slate-500 flex-1">{pm.label}</span>
                <button
                  onClick={() => updatePaymentMethod(pm.id, { active: true })}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  重新啟用
                </button>
                <button onClick={() => handleDelete(pm)} className="text-red-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Method Form Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? '編輯付款方法' : '新增付款方法'}
      >
        <div className="space-y-4">
          <FormField label="付款類型" required>
            <Select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as PaymentMethodType })}
            >
              {Object.entries(PAYMENT_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {PAYMENT_TYPE_ICONS[k as PaymentMethodType]} {v}
                </option>
              ))}
            </Select>
          </FormField>

          {(form.type === 'credit_card' || form.type === 'bank_transfer') && (
            <FormField label="銀行">
              <Select
                value={form.bankCode}
                onChange={(e) => setForm({ ...form, bankCode: e.target.value as BankCode })}
              >
                {BANK_OPTIONS.map((b) => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </Select>
            </FormField>
          )}

          {(form.type === 'credit_card' || form.type === 'bank_transfer') && form.bankCode === 'other' && (
            <FormField label="銀行名稱">
              <Input
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                placeholder="請輸入銀行名稱"
              />
            </FormField>
          )}

          <FormField label="顯示名稱" required error={errors.label}>
            <Input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="例如：HSBC Red、轉數快、現金"
              error={!!errors.label}
            />
          </FormField>

          {form.type === 'credit_card' && (
            <FormField label="最後四位數字" hint="可選，方便識別">
              <Input
                value={form.last4}
                onChange={(e) => setForm({ ...form, last4: e.target.value.slice(0, 4) })}
                placeholder="1234"
                maxLength={4}
              />
            </FormField>
          )}

          <FormField label="AutoPay 設定">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autopayEnabled}
                onChange={(e) => setForm({ ...form, autopayEnabled: e.target.checked })}
                className="w-4 h-4 rounded accent-indigo-600"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                此付款方法已設定自動轉賬 (AutoPay)
              </span>
            </label>
          </FormField>

          <FormField label="備註">
            <TextArea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={2}
              placeholder="可選備註"
            />
          </FormField>

          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1">
              {editingId ? '儲存更改' : '新增付款方法'}
            </Button>
            <Button onClick={() => setModalOpen(false)} variant="secondary">取消</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
