import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import { useStoreContext } from '../store/StoreContext';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import {
  formatCurrency, getLast6Periods, getLast12Periods,
  calcTotalForPeriod, calcPaidForPeriod, PAYMENT_TYPE_ICONS,
} from '../utils/helpers';

type ViewRange = '6m' | '12m';

export default function Reports() {
  const { data } = useStoreContext();
  const [range, setRange] = useState<ViewRange>('6m');
  const sym = data.settings.currencySymbol;

  const periods = range === '6m' ? getLast6Periods() : getLast12Periods();

  // Monthly trend data
  const monthlyData = useMemo(() => {
    return periods.map((period) => {
      const records = data.billRecords.filter((r) => r.period === period);
      return {
        period,
        label: period.substring(5) + '月',
        total: calcTotalForPeriod(records),
        paid: calcPaidForPeriod(records),
        unpaid: calcTotalForPeriod(records) - calcPaidForPeriod(records),
        count: records.length,
      };
    });
  }, [data, periods]);

  // Category breakdown across range

  const categoryData = useMemo(() => {
    return data.categories
      .filter((c) => c.active)
      .map((cat) => {
        const catBillIds = data.billItems.filter((b) => b.categoryId === cat.id).map((b) => b.id);
        // Sum across all periods in range
        const allRecords = data.billRecords.filter(
          (r) => catBillIds.includes(r.billItemId) && periods.includes(r.period)
        );
        const total = calcTotalForPeriod(allRecords);
        return { name: cat.name, value: total, color: cat.color, icon: cat.icon };
      })
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [data, periods]);

  // Payment method breakdown
  const pmData = useMemo(() => {
    return data.paymentMethods
      .filter((pm) => pm.active)
      .map((pm) => {
        const records = data.billRecords.filter(
          (r) => r.paid && r.paymentMethodId === pm.id && periods.includes(r.period)
        );
        return {
          name: pm.label,
          value: calcTotalForPeriod(records),
          count: records.length,
          icon: PAYMENT_TYPE_ICONS[pm.type],
          type: pm.type,
        };
      })
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [data, periods]);

  // Top bills
  const topBills = useMemo(() => {
    return data.billItems
      .filter((b) => b.active)
      .map((item) => {
        const cat = data.categories.find((c) => c.id === item.categoryId);
        const records = data.billRecords.filter(
          (r) => r.billItemId === item.id && periods.includes(r.period)
        );
        const total = calcTotalForPeriod(records);
        return { item, cat, total, count: records.length, avg: records.length > 0 ? total / records.length : 0 };
      })
      .filter((x) => x.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [data, periods]);

  const totalSpend = monthlyData.reduce((s, m) => s + m.total, 0);
  const avgMonthly = monthlyData.length > 0 ? totalSpend / monthlyData.length : 0;
  const maxMonth = monthlyData.reduce((m, d) => (d.total > m.total ? d : m), monthlyData[0] ?? { total: 0, label: '' });

  const CHART_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#8b5cf6', '#64748b'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-lg text-sm">
          <p className="font-medium text-slate-800 dark:text-white mb-1">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color }}>
              {p.name}: {formatCurrency(p.value, sym)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">統計報表</h1>
        <div className="flex gap-2">
          {(['6m', '12m'] as ViewRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                range === r
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600'
              }`}
            >
              近{r === '6m' ? '6' : '12'}個月
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardBody className="p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">總支出</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(totalSpend, sym)}</p>
            <p className="text-xs text-slate-400">近{range === '6m' ? '6' : '12'}個月</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">月均支出</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(avgMonthly, sym)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">最高月份</p>
            <p className="text-base font-bold text-slate-900 dark:text-white">{maxMonth?.label}</p>
            <p className="text-xs text-slate-400">{formatCurrency(maxMonth?.total, sym)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">活躍帳單</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {data.billItems.filter((b) => b.active).length} 項
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Monthly bar chart */}
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
              <Bar dataKey="paid" name="已付" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="unpaid" name="未付" fill="#e2e8f0" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category pie chart */}
        {categoryData.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm">分類支出分佈</h3>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
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

        {/* Payment method breakdown */}
        {pmData.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm">付款方法使用（已付）</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              {pmData.map((pm, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <span>{pm.icon}</span>
                      <span>{pm.name}</span>
                      <span className="text-xs text-slate-400">({pm.count} 筆)</span>
                    </span>
                    <span className="font-medium text-slate-800 dark:text-white">
                      {formatCurrency(pm.value, sym)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pmData[0].value > 0 ? (pm.value / pmData[0].value) * 100 : 0}%`,
                        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
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
          <CardHeader>
            <h3 className="font-semibold text-slate-800 dark:text-white text-sm">支出最高帳單</h3>
          </CardHeader>
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

      {/* Line chart: monthly trend */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-800 dark:text-white text-sm">月度支出走勢</h3>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="total" name="總額" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="paid" name="已付" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  );
}
