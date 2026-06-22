import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, CheckCircle2, AlertCircle, Clock,
  ChevronRight, Plus, RefreshCw, ArrowLeft, ArrowRight,
  Wallet, CreditCard,
} from 'lucide-react';
import { useStoreContext } from '../store/StoreContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  formatCurrency, formatDate, formatPeriod, getCurrentPeriod,
  getRecordStatus, getStatusLabel, addMonths,
  calcTotalForPeriod, calcPaidForPeriod, calcUnpaidForPeriod,
  PAYMENT_TYPE_ICONS,
} from '../utils/helpers';

export default function Dashboard() {
  const { data, markPaid, generateRecordsForPeriod } = useStoreContext();
  const [period, setPeriod] = useState(getCurrentPeriod());
  const sym = data.settings.currencySymbol;

  const periodRecords = data.billRecords.filter((r) => r.period === period);
  const total = calcTotalForPeriod(periodRecords);
  const paid = calcPaidForPeriod(periodRecords);
  const unpaid = calcUnpaidForPeriod(periodRecords);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const overdue = data.billRecords.filter((r) => {
    if (r.paid) return false;
    if (!r.dueDate) return false;
    return new Date(r.dueDate) < new Date(todayStr);
  });

  const dueSoon = data.billRecords.filter((r) => {
    if (r.paid) return false;
    if (!r.dueDate) return false;
    const due = new Date(r.dueDate);
    const diff = (due.getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  const recentPaid = data.billRecords
    .filter((r) => r.paid && r.paidDate)
    .sort((a, b) => (b.paidDate ?? '').localeCompare(a.paidDate ?? ''))
    .slice(0, 5);

  // Category breakdown
  const catBreakdown = data.categories
    .filter((c) => c.active)
    .map((cat) => {
      const catBillIds = data.billItems.filter((b) => b.categoryId === cat.id).map((b) => b.id);
      const catRecords = periodRecords.filter((r) => catBillIds.includes(r.billItemId));
      const amount = calcTotalForPeriod(catRecords);
      return { cat, amount, count: catRecords.length };
    })
    .filter((x) => x.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Payment method breakdown
  const pmBreakdown = data.paymentMethods
    .filter((pm) => pm.active)
    .map((pm) => {
      const pmRecords = periodRecords.filter((r) => r.paid && r.paymentMethodId === pm.id);
      const amount = calcTotalForPeriod(pmRecords);
      return { pm, amount, count: pmRecords.length };
    })
    .filter((x) => x.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const canGenerate = data.billItems.some((item) => {
    if (!item.active) return false;
    return !data.billRecords.find((r) => r.billItemId === item.id && r.period === period);
  });

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">帳單管家</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">家庭固定支出追蹤</p>
        </div>
        <div className="flex items-center gap-2">
          {canGenerate && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => generateRecordsForPeriod(period)}
            >
              <RefreshCw size={14} />
              生成帳單
            </Button>
          )}
          <Link to="/bills/add">
            <Button size="sm">
              <Plus size={14} />
              新增帳單
            </Button>
          </Link>
        </div>
      </div>

      {/* Period navigator */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setPeriod(addMonths(period, -1))}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="text-lg font-semibold text-slate-800 dark:text-white min-w-[120px] text-center">
          {formatPeriod(period)}
        </span>
        <button
          onClick={() => setPeriod(addMonths(period, 1))}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
        >
          <ArrowRight size={18} />
        </button>
        {period !== getCurrentPeriod() && (
          <button
            onClick={() => setPeriod(getCurrentPeriod())}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            回本月
          </button>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardBody className="p-4">
            <div className="flex items-center justify-center mb-2">
              <Wallet size={20} className="text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">應付總額</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {formatCurrency(total, sym)}
            </p>
            <p className="text-xs text-slate-400">{periodRecords.length} 項</p>
          </CardBody>
        </Card>
        <Card className="text-center border-emerald-200 dark:border-emerald-800">
          <CardBody className="p-4">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle2 size={20} className="text-emerald-500" />
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">已付</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(paid, sym)}
            </p>
            <p className="text-xs text-slate-400">{periodRecords.filter((r) => r.paid).length} 項</p>
          </CardBody>
        </Card>
        <Card className={`text-center ${unpaid > 0 ? 'border-red-200 dark:border-red-800' : ''}`}>
          <CardBody className="p-4">
            <div className="flex items-center justify-center mb-2">
              <AlertCircle size={20} className={unpaid > 0 ? 'text-red-500' : 'text-slate-400'} />
            </div>
            <p className={`text-xs mb-1 ${unpaid > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>未付</p>
            <p className={`text-lg font-bold ${unpaid > 0 ? 'text-red-700 dark:text-red-300' : 'text-slate-900 dark:text-white'}`}>
              {formatCurrency(unpaid, sym)}
            </p>
            <p className="text-xs text-slate-400">{periodRecords.filter((r) => !r.paid).length} 項</p>
          </CardBody>
        </Card>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <Card>
          <CardBody className="py-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span>付款進度</span>
              <span>{Math.round((paid / total) * 100)}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, (paid / total) * 100)}%` }}
              />
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue & Due Soon */}
        {(overdue.length > 0 || dueSoon.length > 0) && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" />
                需要關注
              </h3>
            </CardHeader>
            <CardBody className="p-0">
              {overdue.slice(0, 5).map((r) => {
                const item = data.billItems.find((b) => b.id === r.billItemId);
                const cat = data.categories.find((c) => c.id === item?.categoryId);
                return (
                  <div key={r.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{cat?.icon ?? '📋'}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">{item?.name}</p>
                        <p className="text-xs text-red-500">逾期：{formatDate(r.dueDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {formatCurrency(r.amount, sym)}
                      </span>
                      <button
                        onClick={() => markPaid(r.id, true)}
                        className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-md hover:bg-emerald-200"
                      >
                        標記已付
                      </button>
                    </div>
                  </div>
                );
              })}
              {dueSoon.slice(0, 3).map((r) => {
                const item = data.billItems.find((b) => b.id === r.billItemId);
                const cat = data.categories.find((c) => c.id === item?.categoryId);
                const due = new Date(r.dueDate!);
                const diff = Math.round((due.getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={r.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{cat?.icon ?? '📋'}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">{item?.name}</p>
                        <p className="text-xs text-amber-500">
                          {diff === 0 ? '今日到期' : `${diff} 日後到期`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {formatCurrency(r.amount, sym)}
                      </span>
                      <button
                        onClick={() => markPaid(r.id, true)}
                        className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-md hover:bg-emerald-200"
                      >
                        標記已付
                      </button>
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>
        )}

        {/* This month bills */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                <Clock size={16} className="text-indigo-500" />
                {formatPeriod(period)} 帳單
              </h3>
              <Link to="/bills" className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                查看全部 <ChevronRight size={14} />
              </Link>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {periodRecords.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                <p>本月尚無帳單</p>
                <button
                  onClick={() => generateRecordsForPeriod(period)}
                  className="mt-2 text-indigo-600 dark:text-indigo-400 text-xs hover:underline"
                >
                  點此生成本月帳單
                </button>
              </div>
            ) : (
              periodRecords
                .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
                .slice(0, 6)
                .map((r) => {
                  const item = data.billItems.find((b) => b.id === r.billItemId);
                  const cat = data.categories.find((c) => c.id === item?.categoryId);
                  const pm = data.paymentMethods.find((p) => p.id === r.paymentMethodId);
                  const status = getRecordStatus(r);
                  return (
                    <div key={r.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{cat?.icon ?? '📋'}</span>
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-white">{item?.name}</p>
                          <p className="text-xs text-slate-400">
                            {r.dueDate ? `到期 ${r.dueDate.substring(5)}` : ''} · {pm?.label ?? '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {formatCurrency(r.amount, sym)}
                        </span>
                        <Badge variant={status === 'paid' ? 'success' : status === 'overdue' ? 'danger' : status === 'due_soon' ? 'warning' : 'default'}>
                          {getStatusLabel(status)}
                        </Badge>
                        {!r.paid && (
                          <button
                            onClick={() => markPaid(r.id, true)}
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

        {/* Category breakdown */}
        {catBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm">分類支出</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              {catBreakdown.map(({ cat, amount }) => (
                <div key={cat.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </span>
                    <span className="font-medium text-slate-800 dark:text-white">
                      {formatCurrency(amount, sym)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${total > 0 ? (amount / total) * 100 : 0}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        )}

        {/* Payment method breakdown */}
        {pmBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                <CreditCard size={16} className="text-indigo-500" />
                付款方法支出（已付）
              </h3>
            </CardHeader>
            <CardBody className="p-0">
              {pmBreakdown.map(({ pm, amount, count }) => (
                <div key={pm.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{PAYMENT_TYPE_ICONS[pm.type]}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{pm.label}</p>
                      <p className="text-xs text-slate-400">{count} 筆</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {formatCurrency(amount, sym)}
                  </span>
                </div>
              ))}
            </CardBody>
          </Card>
        )}

        {/* Recent payments */}
        {recentPaid.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" />
                最近付款記錄
              </h3>
            </CardHeader>
            <CardBody className="p-0">
              {recentPaid.map((r) => {
                const item = data.billItems.find((b) => b.id === r.billItemId);
                const cat = data.categories.find((c) => c.id === item?.categoryId);
                const pm = data.paymentMethods.find((p) => p.id === r.paymentMethodId);
                return (
                  <div key={r.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{cat?.icon ?? '📋'}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">{item?.name}</p>
                        <p className="text-xs text-slate-400">{pm?.label ?? '—'} · {formatDate(r.paidDate)}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(r.amount, sym)}
                    </span>
                  </div>
                );
              })}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
