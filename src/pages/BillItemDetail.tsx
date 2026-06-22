import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit3, Plus, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { useStoreContext } from '../store/StoreContext';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import RecordDetailModal from '../components/RecordDetailModal';
import {
  formatCurrency, formatDate, formatPeriod, getCurrentPeriod,
  getRecordStatus, getStatusLabel, RECURRENCE_LABELS, PAYMENT_TYPE_ICONS,
} from '../utils/helpers';
import type { BillRecord } from '../types';

export default function BillItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, markPaid, addBillRecord, updateBillItem } = useStoreContext();
  const [selectedRecord, setSelectedRecord] = useState<BillRecord | null>(null);

  const item = data.billItems.find((b) => b.id === id);
  if (!item) return (
    <div className="p-6 text-center text-slate-500">帳單項目不存在</div>
  );

  const cat = data.categories.find((c) => c.id === item.categoryId);
  const defaultPm = data.paymentMethods.find((p) => p.id === item.defaultPaymentMethodId);
  const sym = data.settings.currencySymbol;

  const records = data.billRecords
    .filter((r) => r.billItemId === id)
    .sort((a, b) => b.period.localeCompare(a.period));

  const currentPeriod = getCurrentPeriod();
  const hasCurrentPeriodRecord = records.some((r) => r.period === currentPeriod);

  const totalPaid = records.filter((r) => r.paid).reduce((s, r) => s + (r.amount ?? 0), 0);
  const avgAmount = records.length > 0
    ? records.reduce((s, r) => s + (r.amount ?? 0), 0) / records.length
    : 0;

  const handleAddCurrentPeriod = () => {
    const [yr, mo] = currentPeriod.split('-').map(Number);
    const day = item.dueDay ?? 1;
    const maxDay = new Date(yr, mo, 0).getDate();
    const dueDate = `${currentPeriod}-${String(Math.min(day, maxDay)).padStart(2, '0')}`;
    addBillRecord({
      billItemId: item.id,
      period: currentPeriod,
      dueDate,
      amount: item.defaultAmount,
      paid: false,
      paymentMethodId: item.defaultPaymentMethodId,
      note: '',
    });
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{cat?.icon ?? '📋'}</span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{item.name}</h1>
            {!item.active && <Badge>已停用</Badge>}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 ml-9">
            {cat?.name} · {RECURRENCE_LABELS[item.recurrenceType]}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => updateBillItem(item.id, { active: !item.active })}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            title={item.active ? '停用' : '啟用'}
          >
            {item.active ? <ToggleRight size={20} className="text-indigo-600" /> : <ToggleLeft size={20} />}
          </button>
          <Link to={`/bills/${item.id}/edit`}>
            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
              <Edit3 size={20} />
            </button>
          </Link>
        </div>
      </div>

      {/* Info card */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardBody className="p-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">預設金額</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {formatCurrency(item.defaultAmount, sym)}
            </p>
          </CardBody>
        </Card>
        <Card className="text-center">
          <CardBody className="p-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">平均金額</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {records.length > 0 ? formatCurrency(avgAmount, sym) : '—'}
            </p>
          </CardBody>
        </Card>
        <Card className="text-center">
          <CardBody className="p-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">總支付</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalPaid, sym)}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Details */}
      <Card>
        <CardHeader>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">帳單資料</p>
        </CardHeader>
        <CardBody className="space-y-2 text-sm">
          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400">到期日</span>
            <span className="text-slate-800 dark:text-white">每期 {item.dueDay} 號</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400">預設付款</span>
            <span className="text-slate-800 dark:text-white flex items-center gap-1">
              {defaultPm ? (
                <>{PAYMENT_TYPE_ICONS[defaultPm.type]} {defaultPm.label}{defaultPm.autopayEnabled ? ' [AutoPay]' : ''}</>
              ) : '—'}
            </span>
          </div>
          {item.note && (
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">備註</span>
              <span className="text-slate-800 dark:text-white">{item.note}</span>
            </div>
          )}
          <div className="flex justify-between py-1.5">
            <span className="text-slate-500 dark:text-slate-400">建立日期</span>
            <span className="text-slate-800 dark:text-white">{formatDate(item.createdAt)}</span>
          </div>
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        {!hasCurrentPeriodRecord && item.active && (
          <Button size="sm" variant="secondary" onClick={handleAddCurrentPeriod}>
            <Plus size={14} /> 新增本月記錄
          </Button>
        )}
      </div>

      {/* Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              帳單記錄（{records.length} 期）
            </p>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {records.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">暫無記錄</div>
          ) : (
            records.map((r) => {
              const pm = data.paymentMethods.find((p) => p.id === r.paymentMethodId);
              const status = getRecordStatus(r);
              const statusVariant = status === 'paid' ? 'success' : status === 'overdue' ? 'danger' : status === 'due_soon' ? 'warning' : 'default';
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  onClick={() => setSelectedRecord(r)}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      {formatPeriod(r.period)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {r.dueDate ? `到期 ${r.dueDate.substring(5)}` : ''}
                      {pm ? ` · ${pm.label}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        {formatCurrency(r.amount, sym)}
                      </p>
                      {r.paidDate && <p className="text-xs text-slate-400">付 {r.paidDate.substring(5)}</p>}
                    </div>
                    <Badge variant={statusVariant}>{getStatusLabel(status)}</Badge>
                    {!r.paid && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markPaid(r.id, true); }}
                        className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-md hover:bg-emerald-200"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardBody>
      </Card>

      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}
