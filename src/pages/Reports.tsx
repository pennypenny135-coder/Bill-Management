import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import { Filter, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react';
import { useStoreContext } from '../store/StoreContext';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import {
  formatCurrency, PAYMENT_TYPE_ICONS,
} from '../utils/helpers';

// ─── helpers ──────────────────────────────────────────────────────────────────
function getNPeriods(n: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return result;
}
function calcTotal(records: { amount?: number | null }[]) {
  return records.reduce((s, r) => s + (r.amount ?? 0), 0);
}
function calcPaid(records: { amount?: number | null; paid: boolean }[]) {
  return records.filter((r) => r.paid).reduce((s, r) => s + (r.amount ?? 0), 0);
}

const CHART_COLORS = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ec4899','#ef4444','#8b5cf6','#64748b'];

// ─── Sub-components ───────────────────────────────────────────────────────────
function RangeSlider({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 whitespace-nowrap">統計月數</span>
      <input
        type="range" min={1} max={12} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-28 accent-indigo-600 cursor-pointer"
      />
      <span className="text-sm font-bold text-indigo-600 w-8 text-right">近{value}月</span>
    </div>
  );
}

function BillFilterPanel({
  billItems, categories, selectedIds, onToggle, onSelectAll, onClearAll,
}: {
  billItems: any[];
  categories: any[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = billItems.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const grouped = categories.reduce((acc: Record<string, any[]>, cat) => {
    const bills = filtered.filter((b) => b.categoryId === cat.id);
    if (bills.length > 0) acc[cat.id] = bills;
    return acc;
  }, {} as Record<string, any[]>);
  const uncategorised = filtered.filter((b) => !categories.find((c) => c.id === b.categoryId));

  const allSelected = billItems.every((b) => selectedIds.has(b.id));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
          selectedIds.size === billItems.length
            ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'
            : 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-400 text-indigo-700 dark:text-indigo-300'
        }`}
      >
        <Filter size={13} />
        篩選帳單
        {selectedIds.size < billItems.length && (
          <span className="ml-1 bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full">
            {selectedIds.size}/{billItems.length}
          </span>
        )}
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
          {/* Header */}
          <div className="px-3 pt-3 pb-2 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">選擇統計的帳單</span>
              <div className="flex gap-2">
                <button onClick={onSelectAll} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">全選</button>
                <span className="text-slate-300">|</span>
                <button onClick={onClearAll} className="text-xs text-slate-400 hover:underline">清除</button>
              </div>
            </div>
            <input
              type="text" placeholder="搜尋帳單名稱…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto py-1">
            {Object.entries(grouped).map(([catId, bills]) => {
              const cat = categories.find((c) => c.id === catId);
              const catAllSelected = bills.every((b) => selectedIds.has(b.id));
              return (
                <div key={catId}>
                  {/* Category row */}
                  <button
                    onClick={() => {
                      if (catAllSelected) bills.forEach((b) => onToggle(b.id));
                      else bills.filter((b) => !selectedIds.has(b.id)).forEach((b) => onToggle(b.id));
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    {catAllSelected
                      ? <CheckSquare size={13} className="text-indigo-500 flex-shrink-0" />
                      : <Square size={13} className="text-slate-300 flex-shrink-0" />
                    }
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex-1 text-left">
                      {cat?.icon} {cat?.name}
                    </span>
                  </button>
                  {/* Bill rows */}
                  {bills.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => onToggle(b.id)}
                      className="w-full flex items-center gap-2 pl-7 pr-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      {selectedIds.has(b.id)
                        ? <CheckSquare size={13} className="text-indigo-500 flex-shrink-0" />
                        : <Square size={13} className="text-slate-300 flex-shrink-0" />
                      }
                      <span className="text-xs text-slate-700 dark:text-slate-300 flex-1 text-left">{b.name}</span>
                    </button>
                  ))}
                </div>
              );
            })}
            {uncategorised.map((b) => (
              <button
                key={b.id}
                onClick={() => onToggle(b.id)}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                {selectedIds.has(b.id)
                  ? <CheckSquare size={13} className="text-indigo-500 flex-shrink-0" />
                  : <Square size={13} className="text-slate-300 flex-shrink-0" />
                }
                <span className="text-xs text-slate-700 dark:text-slate-300 flex-1 text-left">{b.name}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">沒有符合的帳單</p>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-700 flex justify-between">
            <span className="text-xs text-slate-400">已選 {selectedIds.size} / {billItems.length} 項</span>
            <button onClick={() => setOpen(false)} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline">完成</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Reports() {
  const { data } = useStoreContext();
  const sym = data.settings.currencySymbol;

  // Active bill items
  const activeBills = useMemo(() => data.billItems.filter((b) => b.active), [data.billItems]);

  // ── State: month range (1-12) ──
  const [monthCount, setMonthCount] = useState(6);

  // ── State: selected bill IDs (default: all) ──
  const [selectedBillIds, setSelectedBillIds] = useState<Set<string>>(
    () => new Set(activeBills.map((b) => b.id))
  );

  const toggleBill = (id: string) =>
    setSelectedBillIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const selectAll  = () => setSelectedBillIds(new Set(activeBills.map((b) => b.id)));
  const clearAll   = () => setSelectedBillIds(new Set());

  // ── Derived ──
  const periods = useMemo(() => getNPeriods(monthCount), [monthCount]);

  // Filter records to selected bills only
  const filteredRecords = useMemo(
    () => data.billRecords.filter(
      (r) => selectedBillIds.has(r.billItemId) && periods.includes(r.period)
    ),
    [data.billRecords, selectedBillIds, periods]
  );

  const monthlyData = useMemo(() =>
    periods.map((period) => {
      const recs = filteredRecords.filter((r) => r.period === period);
      const total = calcTotal(recs);
      const paid  = calcPaid(recs);
      return {
        period,
        label: period.replace(/^\d{4}-0?/, '') + '月',
        total, paid,
        unpaid: total - paid,
        count: recs.length,
      };
    }),
    [filteredRecords, periods]
  );

  const categoryData = useMemo(() => {
    return data.categories
      .filter((c) => c.active)
      .map((cat) => {
        const catBillIds = activeBills
          .filter((b) => b.categoryId === cat.id && selectedBillIds.has(b.id))
          .map((b) => b.id);
        const recs = filteredRecords.filter((r) => catBillIds.includes(r.billItemId));
        return { name: cat.name, value: calcTotal(recs), color: cat.color, icon: cat.icon };
      })
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [data.categories, activeBills, selectedBillIds, filteredRecords]);

  const pmData = useMemo(() => {
    return data.paymentMethods
      .filter((pm) => pm.active)
      .map((pm) => {
        const recs = filteredRecords.filter((r) => r.paid && r.paymentMethodId === pm.id);
        return { name: pm.label, value: calcTotal(recs), count: recs.length, icon: PAYMENT_TYPE_ICONS[pm.type], type: pm.type };
      })
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [data.paymentMethods, filteredRecords]);

  const topBills = useMemo(() => {
    return activeBills
      .filter((b) => selectedBillIds.has(b.id))
      .map((item) => {
        const cat  = data.categories.find((c) => c.id === item.categoryId);
        const recs = filteredRecords.filter((r) => r.billItemId === item.id);
        const total = calcTotal(recs);
        return { item, cat, total, count: recs.length, avg: recs.length > 0 ? total / recs.length : 0 };
      })
      .filter((x) => x.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [activeBills, selectedBillIds, filteredRecords, data.categories]);

  const totalSpend = monthlyData.reduce((s, m) => s + m.total, 0);
  const avgMonthly = monthlyData.length > 0 ? totalSpend / monthlyData.length : 0;
  const maxMonth   = monthlyData.length > 0
    ? monthlyData.reduce((m, d) => d.total > m.total ? d : m)
    : null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-lg text-sm">
        <p className="font-medium text-slate-800 dark:text-white mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value, sym)}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">統計報表</h1>
        <div className="flex flex-wrap items-center gap-3">
          <RangeSlider value={monthCount} onChange={setMonthCount} />
          {activeBills.length > 0 && (
            <BillFilterPanel
              billItems={activeBills}
              categories={data.categories.filter((c) => c.active)}
              selectedIds={selectedBillIds}
              onToggle={toggleBill}
              onSelectAll={selectAll}
              onClearAll={clearAll}
            />
          )}
        </div>
      </div>

      {/* ── Empty state ── */}
      {selectedBillIds.size === 0 && (
        <Card>
          <CardBody className="py-12 text-center">
            <p className="text-slate-400 text-sm">未選擇任何帳單，請點擊「篩選帳單」選擇</p>
          </CardBody>
        </Card>
      )}

      {selectedBillIds.size > 0 && (
        <>
          {/* ── Summary KPIs ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card><CardBody className="p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">總支出</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(totalSpend, sym)}</p>
              <p className="text-xs text-slate-400">近{monthCount}個月</p>
            </CardBody></Card>
            <Card><CardBody className="p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">月均支出</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(avgMonthly, sym)}</p>
              <p className="text-xs text-slate-400">共{monthCount}個月</p>
            </CardBody></Card>
            <Card><CardBody className="p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">最高月份</p>
              <p className="text-base font-bold text-slate-900 dark:text-white">{maxMonth?.label ?? '—'}</p>
              <p className="text-xs text-slate-400">{maxMonth ? formatCurrency(maxMonth.total, sym) : ''}</p>
            </CardBody></Card>
            <Card><CardBody className="p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">已選帳單</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedBillIds.size} 項</p>
              <p className="text-xs text-slate-400">共{activeBills.length}項帳單</p>
            </CardBody></Card>
          </div>

          {/* ── Bar chart ── */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm">每月支出趨勢</h3>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="paid"   name="已付" fill="#10b981" radius={[3,3,0,0]} />
                  <Bar dataKey="unpaid" name="未付" fill="#e2e8f0" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category pie */}
            {categoryData.length > 0 && (
              <Card>
                <CardHeader><h3 className="font-semibold text-slate-800 dark:text-white text-sm">分類支出分佈</h3></CardHeader>
                <CardBody>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" outerRadius={75} dataKey="value" nameKey="name"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: unknown) => formatCurrency(Number(v), sym)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {categoryData.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-slate-700 dark:text-slate-300">{cat.icon} {cat.name}</span>
                        </div>
                        <span className="font-medium text-slate-800 dark:text-white">{formatCurrency(cat.value, sym)}</span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Payment method */}
            {pmData.length > 0 && (
              <Card>
                <CardHeader><h3 className="font-semibold text-slate-800 dark:text-white text-sm">付款方法使用（已付）</h3></CardHeader>
                <CardBody className="space-y-3">
                  {pmData.map((pm, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <span>{pm.icon}</span><span>{pm.name}</span>
                          <span className="text-xs text-slate-400">({pm.count} 筆)</span>
                        </span>
                        <span className="font-medium text-slate-800 dark:text-white">{formatCurrency(pm.value, sym)}</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${pmData[0].value > 0 ? (pm.value / pmData[0].value) * 100 : 0}%`,
                          backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                        }} />
                      </div>
                    </div>
                  ))}
                </CardBody>
              </Card>
            )}
          </div>

          {/* Top bills */}
          {topBills.length > 0 && (
            <Card>
              <CardHeader><h3 className="font-semibold text-slate-800 dark:text-white text-sm">支出最高帳單</h3></CardHeader>
              <CardBody className="p-0">
                {topBills.map(({ item, cat, total, count, avg }, i) => (
                  <div key={item.id} className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                    <span className="text-slate-400 text-sm font-mono w-5">#{i + 1}</span>
                    <span className="text-lg">{cat?.icon ?? '📋'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{item.name}</p>
                      <p className="text-xs text-slate-400">{cat?.name} · {count} 期 · 均 {formatCurrency(avg, sym)}</p>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(total, sym)}</p>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}

          {/* Line chart */}
          <Card>
            <CardHeader><h3 className="font-semibold text-slate-800 dark:text-white text-sm">月度支出走勢</h3></CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="total" name="總額" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="paid"  name="已付" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
