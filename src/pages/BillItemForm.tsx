import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { useStoreContext } from '../store/StoreContext';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { FormField, Input, Select, TextArea } from '../components/ui/FormField';
import { RECURRENCE_LABELS, PAYMENT_TYPE_ICONS } from '../utils/helpers';
import type { RecurrenceType } from '../types';

export default function BillItemForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { data, addBillItem, updateBillItem, deleteBillItem } = useStoreContext();

  const isEdit = Boolean(id && id !== 'add');
  const existingItem = isEdit ? data.billItems.find((b) => b.id === id) : undefined;

  const [name, setName] = useState(existingItem?.name ?? '');
  const [categoryId, setCategoryId] = useState(existingItem?.categoryId ?? data.categories[0]?.id ?? '');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(existingItem?.recurrenceType ?? 'monthly');
  const [recurrenceInterval, setRecurrenceInterval] = useState(existingItem?.recurrenceInterval ?? 2);
  const [dueDay, setDueDay] = useState(existingItem?.dueDay ?? 1);
  const [defaultAmount, setDefaultAmount] = useState(existingItem?.defaultAmount !== undefined ? String(existingItem.defaultAmount) : '');
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState(existingItem?.defaultPaymentMethodId ?? '');
  const [note, setNote] = useState(existingItem?.note ?? '');
  const [active, setActive] = useState(existingItem?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = '請輸入帳單名稱';
    if (!categoryId) errs.categoryId = '請選擇分類';
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const itemData = {
      name: name.trim(),
      categoryId,
      recurrenceType,
      recurrenceInterval: recurrenceType === 'custom' ? recurrenceInterval : undefined,
      dueDay,
      defaultAmount: defaultAmount ? parseFloat(defaultAmount) : undefined,
      defaultPaymentMethodId: defaultPaymentMethodId || undefined,
      note: note.trim(),
      active,
    };

    if (isEdit && id) {
      updateBillItem(id, itemData);
    } else {
      addBillItem(itemData);
    }
    navigate('/bills');
  };

  const handleDelete = () => {
    if (confirm(`確定要刪除「${existingItem?.name}」？此操作會同時刪除所有相關帳單記錄。`)) {
      if (id) deleteBillItem(id);
      navigate('/bills');
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {isEdit ? '編輯帳單項目' : '新增帳單項目'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">基本資料</p>
          </CardHeader>
          <CardBody className="space-y-4">
            <FormField label="帳單名稱" required error={errors.name}>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：中電、Netflix、管理費"
                error={!!errors.name}
              />
            </FormField>

            <FormField label="分類" required error={errors.categoryId}>
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                error={!!errors.categoryId}
              >
                <option value="">請選擇分類</option>
                {data.categories.filter((c) => c.active).map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="備註">
              <TextArea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="可選備註"
              />
            </FormField>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">收費設定</p>
          </CardHeader>
          <CardBody className="space-y-4">
            <FormField label="收費週期" required>
              <Select
                value={recurrenceType}
                onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
              >
                {Object.entries(RECURRENCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </FormField>

            {recurrenceType === 'custom' && (
              <FormField label="每幾個月" hint="例如每3個月輸入3">
                <Input
                  type="number"
                  min={1}
                  max={36}
                  value={recurrenceInterval}
                  onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                />
              </FormField>
            )}

            <FormField label="每期到期日（號數）" hint="例如每月15號到期，輸入15">
              <Input
                type="number"
                min={1}
                max={31}
                value={dueDay}
                onChange={(e) => setDueDay(parseInt(e.target.value) || 1)}
              />
            </FormField>

            <FormField label="預設金額" hint="水電煤金額浮動可留空">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={defaultAmount}
                onChange={(e) => setDefaultAmount(e.target.value)}
                placeholder="0.00"
              />
            </FormField>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">付款設定</p>
          </CardHeader>
          <CardBody className="space-y-4">
            <FormField label="預設付款方法">
              <Select
                value={defaultPaymentMethodId}
                onChange={(e) => setDefaultPaymentMethodId(e.target.value)}
              >
                <option value="">請選擇（可選）</option>
                {data.paymentMethods.filter((p) => p.active).map((p) => (
                  <option key={p.id} value={p.id}>
                    {PAYMENT_TYPE_ICONS[p.type]} {p.label}
                    {p.autopayEnabled ? ' [AutoPay]' : ''}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="狀態">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">啟用此帳單項目</span>
              </label>
            </FormField>
          </CardBody>
        </Card>

        <div className="flex gap-3 mt-4">
          <Button type="submit" className="flex-1">
            <Save size={16} /> {isEdit ? '儲存更改' : '新增帳單'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            取消
          </Button>
          {isEdit && (
            <Button type="button" variant="danger" onClick={handleDelete}>
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
