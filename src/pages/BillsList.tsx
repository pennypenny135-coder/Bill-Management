import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Filter, ArrowLeft, ArrowRight, RefreshCw,
} from 'lucide-react';
import { useStoreContext } from '../store/StoreContext';
import { Card, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/FormField';
import RecordDetailModal from '../components/RecordDetailModal';
import {
  formatCurrency, formatPeriod, getCurrentPeriod, addMonths,
  getRecordStatus, getStatusLabel, PAYMENT_TYPE_ICONS,
} from '../utils/helpers';
import type { BillRecord } from '../types';

type SortKey = 'dueDate' | 'amount' | 'name';
type FilterStatus = 'all' | 'paid' | 'unpaid' | 'overdue';

export default function BillsList() {
  const { data, markPaid, generateRecordsForPeriod } = useStoreContext();
  const [period, setPeriod] = useState(getCurrentPeriod());
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPm, setFilterPm] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('dueDate');
  const [selectedRecord, setSelectedRecord] = useState<BillRecord | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const sym = data.settings.currencySymbol;

  const periodRecords = useMemo(() => {
    let records = data.billRecords.filter((r) => r.period === period);

    // Search
    if (search) {
      const q = search.toLowerCase();
      records = records.filter((r) => {
        const item = data.billItems.find((b) => b.id === r.billItemId);
        return item?.name.toLowerCase().includes(q);
      });
    }

    // Category filter
    if (filterCat !== 'all') {
      const catBillIds = data.billItems
        .filter((b) => b.categoryId === filterCat)
        .map((b) => b.id);
      records = records.filter((r) => catBillIds.includes(r.billItemId));
    }

    // Status filter
    if (filterStatus !== 'all') {
      records = records.filter((r) => {
        const s = getRecordStatus(r);
        if (filterStatus === 'paid') return s === 'paid';
        if (filterStatus === 'unpaid') return s !== 'paid';
        if (filterStatus === 'overdue') return s === 'overdue';
        return true;
      });
    }

    // Payment method filter
    if (filterPm !== 'all') {
      records = records.filter((r) => r.paymentMethodId === filterPm);
    }

    // Sort
    records = [...records].sort((a, b) => {
      if (sortKey === 'dueDate') {
        return (a.dueDate ?? '').localeCompare(b.dueDate ?? '');
      }
      if (sortKey === 'amount') {
        return (b.amount ?? 0) - (a.amount ?? 0);
      }
      if (sortKey === 'name') {
        const aItem = data.billItems.find((i) => i.id === a.billItemId);
        const bItem = data.billItems.find((i) => i.id === b.billItemId);
        return (aItem?.name ?? '').localeCompare(bItem?.name ?? '', 'zh-HK');
      }
      return 0;
    });

    return records;
  }, [data, period, search, filterCat, filterStatus, filterPm, sortKey]);

  const total = periodRecords.reduce((s, r) => s + (r.amount ?? 0), 0);
  const paid = periodRecords.filter((r) => r.paid).reduce((s, r) => s + (r.amount ?? 0), 0);
  const unpaidCount = periodRecords.filter((r) => !r.paid).length;

  const canGenerate = data.billItems.some((item) => {
    if (!item.active) return false;
    return !data.billRecords.find((r) => r.billItemId === item.id && r.period === period);
  });

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">帳單列表</h1>
        <div className="flex items-center gap-2">
          {canGenerate && (
            <Button size="sm" variant="secondary" onClick={() => generateRecordsForPeriod(period)}>
              <RefreshCw size={14} /> 生成
            </Button>
          )}
          <Link to="/bills/add">
            <Button size="sm"><Plus size={14} /> 新增</Button>
          </Link>
        </div>
      </div>

      {/* Period navigator */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => setPeriod(addMonths(period, -1))} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
          <ArrowLeft size={18} />
        </button>
        <span className="text-base font-semibold text-slate-800 dark:text-white min-w-[110px] text-center">
          {formatPeriod(period)}
        </span>
        <button onClick={() => setPeriod(addMonths(period, 1))} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">總計</p>
          <p className="text-base font-bold text-slate-900 dark:text-white">{formatCurrency(total, sym)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800 p-3">
          <p className="text-xs text-emerald-600">已付</p>
          <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(paid, sym)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">未付項</p>
          <p className="text-base font-bold text-slate-900 dark:text-white">{unpaidCount}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="搜尋帳單..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-600 dark:text-indigo-300' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200'}`}
          >
            <Filter size={15} />
            篩選
          </button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}>
              <option value="all">所有狀態</option>
              <option value="paid">已付款</option>
              <option value="unpaid">未付款</option>
              <option value="overdue">逾期</option>
            </Select>
            <Select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
              <option value="all">所有分類</option>
              {data.categories.filter((c) => c.active).map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </Select>
            <Select value={filterPm} onChange={(e) => setFilterPm(e.target.value)}>
              <option value="all">所有付款方法</option>
              {data.paymentMethods.filter((p) => p.active).map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </Select>
            <Select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
              <option value="dueDate">按到期日</option>
              <option value="amount">按金額</option>
              <option value="name">按名稱</option>
            </Select>
          </div>
        )}
      </div>

      {/* Quick filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'unpaid', 'overdue', 'paid'] as FilterStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
          >
            {s === 'all' ? '全部' : s === 'paid' ? '已付款' : s === 'unpaid' ? '未付款' : '逾期'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {periodRecords.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <p className="text-slate-400 text-sm mb-3">
                {search || filterCat !== 'all' || filterStatus !== 'all' ? '沒有符合條件的帳單' : '本月尚無帳單'}
              </p>
              {!search && filterCat === 'all' && filterStatus === 'all' && (
                <Button size="sm" variant="secondary" onClick={() => generateRecordsForPeriod(period)}>
                  <RefreshCw size={14} /> 生成本月帳單
                </Button>
              )}
            </CardBody>
          </Card>
        ) : (
          periodRecords.map((record) => {
            const item = data.billItems.find((b) => b.id === record.billItemId);
            const cat = data.categories.find((c) => c.id === item?.categoryId);
            const pm = data.paymentMethods.find((p) => p.id === record.paymentMethodId);
            const status = getRecordStatus(record);
            const statusVariant = status === 'paid' ? 'success' : status === 'overdue' ? 'danger' : status === 'due_soon' ? 'warning' : 'default';
            return (
              <div
                key={record.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                onClick={() => setSelectedRecord(record)}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: cat?.color + '20' }}>
                  {cat?.icon ?? '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{item?.name}</p>
                    <Badge variant={statusVariant}>{getStatusLabel(status)}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    {record.dueDate && <span>到期 {record.dueDate.substring(5)}</span>}
                    {pm && (
                      <span className="flex items-center gap-1">
                        {PAYMENT_TYPE_ICONS[pm.type]} {pm.label}
                      </span>
                    )}
                    {cat && <span style={{ color: cat.color }}>{cat.name}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    {formatCurrency(record.amount, sym)}
                  </p>
                  {!record.paid && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markPaid(record.id, true); }}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline mt-0.5"
                    >
                      ✓ 已付
                    </button>
                  )}
                  {record.paid && (
                    <p className="text-xs text-emerald-500 mt-0.5">✓ 已付</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Record detail modal */}
      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}
