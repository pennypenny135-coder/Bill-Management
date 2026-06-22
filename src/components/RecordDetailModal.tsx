import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3, Trash2, CheckCircle2, XCircle, Copy } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { FormField, Input, Select, TextArea } from './ui/FormField';
import { useStoreContext } from '../store/StoreContext';
import {
  formatCurrency, formatDate, getRecordStatus, getStatusLabel,
  PAYMENT_TYPE_ICONS, RECURRENCE_LABELS,
} from '../utils/helpers';
import type { BillRecord } from '../types';

interface Props {
  record: BillRecord;
  onClose: () => void;
}

export default function RecordDetailModal({ record, onClose }: Props) {
  const { data, markPaid, updateBillRecord, deleteBillRecord } = useStoreContext();
  const navigate = useNavigate();

  const item = data.billItems.find((b) => b.id === record.billItemId);
  const cat = data.categories.find((c) => c.id === item?.categoryId);
  const pm = data.paymentMethods.find((p) => p.id === record.paymentMethodId);
  const status = getRecordStatus(record);
  const sym = data.settings.currencySymbol;

  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(record.amount ?? ''));
  const [paymentMethodId, setPaymentMethodId] = useState(record.paymentMethodId ?? '');
  const [paidDate, setPaidDate] = useState(record.paidDate ?? new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState(record.note ?? '');
  const [paid, setPaid] = useState(record.paid);

  // Find previous period record for copy
  const prevPeriodRecords = data.billRecords.filter(
    (r) => r.billItemId === record.billItemId && r.period < record.period
  );
  const lastRecord = prevPeriodRecords.sort((a, b) => b.period.localeCompare(a.period))[0];

  const handleSave = () => {
    updateBillRecord(record.id, {
      amount: amount ? parseFloat(amount) : undefined,
      paymentMethodId: paymentMethodId || undefined,
      paid,
      paidDate: paid ? paidDate : undefined,
      note,
    });
    setEditing(false);
    onClose();
  };

  const handleTogglePaid = () => {
    markPaid(record.id, !record.paid, record.paymentMethodId);
    onClose();
  };

  const handleDelete = () => {
    if (confirm('確定要刪除這筆帳單記錄？')) {
      deleteBillRecord(record.id);
      onClose();
    }
  };

  const handleCopyLastAmount = () => {
    if (lastRecord?.amount !== undefined) {
      setAmount(String(lastRecord.amount));
    }
  };

  const statusVariant = status === 'paid' ? 'success' : status === 'overdue' ? 'danger' : status === 'due_soon' ? 'warning' : 'default';

  return (
    <Modal open={true} onClose={onClose} title={item?.name ?? '帳單詳情'}>
      {!editing ? (
        <div className="space-y-4">
          {/* Header info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{cat?.icon ?? '📋'}</span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{item?.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {cat?.name} · {item ? RECURRENCE_LABELS[item.recurrenceType] : ''}
                </p>
              </div>
            </div>
            <Badge variant={statusVariant}>{getStatusLabel(status)}</Badge>
          </div>

          {/* Amount */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(record.amount, sym)}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{record.period}</p>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">到期日</span>
              <span className="text-slate-800 dark:text-white font-medium">{formatDate(record.dueDate)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">付款方法</span>
              <span className="text-slate-800 dark:text-white font-medium flex items-center gap-1">
                {pm ? (
                  <>{PAYMENT_TYPE_ICONS[pm.type]} {pm.label}</>
                ) : '—'}
              </span>
            </div>
            {pm?.autopayEnabled && (
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">AutoPay</span>
                <Badge variant="info">自動轉賬</Badge>
              </div>
            )}
            {record.paid && (
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">付款日期</span>
                <span className="text-emerald-700 dark:text-emerald-300 font-medium">{formatDate(record.paidDate)}</span>
              </div>
            )}
            {record.note && (
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">備註</span>
                <span className="text-slate-800 dark:text-white">{record.note}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleTogglePaid}
              variant={record.paid ? 'secondary' : 'success'}
              className="w-full"
            >
              {record.paid ? (
                <><XCircle size={16} /> 標記未付</>
              ) : (
                <><CheckCircle2 size={16} /> 標記已付</>
              )}
            </Button>
            <Button onClick={() => setEditing(true)} variant="secondary" className="w-full">
              <Edit3 size={16} /> 編輯記錄
            </Button>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate(`/bills/${item?.id}`)}
              variant="ghost"
              size="sm"
              className="flex-1"
            >
              查看帳單項目
            </Button>
            <Button onClick={handleDelete} variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <FormField label="實際金額">
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1"
              />
              {lastRecord?.amount !== undefined && (
                <button
                  onClick={handleCopyLastAmount}
                  className="flex items-center gap-1 px-3 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg"
                >
                  <Copy size={12} /> 上期 {formatCurrency(lastRecord.amount, sym)}
                </button>
              )}
            </div>
          </FormField>

          <FormField label="付款方法">
            <Select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)}>
              <option value="">請選擇</option>
              {data.paymentMethods.filter((p) => p.active).map((p) => (
                <option key={p.id} value={p.id}>
                  {PAYMENT_TYPE_ICONS[p.type]} {p.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="已付款">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paid}
                  onChange={(e) => setPaid(e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">已付款</span>
              </label>
            </div>
          </FormField>

          {paid && (
            <FormField label="付款日期">
              <Input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
            </FormField>
          )}

          <FormField label="備註">
            <TextArea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="可選備註"
            />
          </FormField>

          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1">儲存</Button>
            <Button onClick={() => setEditing(false)} variant="secondary" className="flex-1">取消</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
