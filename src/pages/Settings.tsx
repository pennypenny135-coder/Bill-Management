import { useRef } from 'react';
import {
  Upload, FileJson, FileSpreadsheet, RefreshCw,
  Moon, Sun, Smartphone, Info, DatabaseBackup, FolderDown, FolderUp,
} from 'lucide-react';
import { useStoreContext } from '../store/StoreContext';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/FormField';
import { getCurrentPeriod } from '../utils/helpers';

export default function Settings() {
  const {
    data, updateSettings,
    exportJSON, exportCSV, importJSON,
    exportAllJSON, importAllJSON,
    resetToSeed, generateRecordsForPeriod,
    workspaces,
  } = useStoreContext();

  const fileRef    = useRef<HTMLInputElement>(null);
  const fileAllRef = useRef<HTMLInputElement>(null);
  const settings   = data.settings;
  const currentPeriod = getCurrentPeriod();

  // ── Single workspace import ──────────────────────────────────────────────
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (confirm('匯入將覆蓋【目前帳戶】資料，確定繼續？')) importJSON(file);
    }
    e.target.value = '';
  };

  // ── All workspaces import ────────────────────────────────────────────────
  const handleImportAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (confirm('匯入將覆蓋【所有帳戶】資料，確定繼續？')) importAllJSON(file);
    }
    e.target.value = '';
  };

  const handleReset = () => {
    if (confirm('確定要清空目前帳戶的所有資料？此操作不可撤銷。')) resetToSeed();
  };

  const totalRecords = data.billRecords.length;
  const totalItems   = data.billItems.length;
  const totalPm      = data.paymentMethods.length;

  const localSize = (() => {
    try {
      const raw = localStorage.getItem('billmaster_v2') ?? '';
      return (new Blob([raw]).size / 1024).toFixed(1);
    } catch { return '?'; }
  })();

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">設定與備份</h1>

      {/* ── Appearance ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader><h3 className="text-sm font-semibold text-slate-800 dark:text-white">外觀設定</h3></CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.darkMode
                ? <Moon size={18} className="text-indigo-400" />
                : <Sun  size={18} className="text-amber-500" />}
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-white">深色模式</p>
                <p className="text-xs text-slate-400">切換介面主題</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ darkMode: !settings.darkMode })}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.darkMode ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${
                settings.darkMode ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </CardBody>
      </Card>

      {/* ── Currency ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader><h3 className="text-sm font-semibold text-slate-800 dark:text-white">貨幣設定</h3></CardHeader>
        <CardBody>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-700 dark:text-slate-300">貨幣符號</p>
            <Select
              value={settings.currencySymbol}
              onChange={(e) => updateSettings({ currencySymbol: e.target.value })}
              className="w-40"
            >
              <option value="HK$">HK$ (港元)</option>
              <option value="$">$ (美元)</option>
              <option value="¥">¥ (日圓/人民幣)</option>
              <option value="£">£ (英鎊)</option>
              <option value="€">€ (歐元)</option>
              <option value="NT$">NT$ (台幣)</option>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* ── Generate bills ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader><h3 className="text-sm font-semibold text-slate-800 dark:text-white">帳單生成</h3></CardHeader>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-white">生成本月帳單</p>
              <p className="text-xs text-slate-400">為所有啟用的 recurring 帳單建立本月記錄</p>
            </div>
            <Button size="sm" variant="secondary"
              onClick={() => { generateRecordsForPeriod(currentPeriod); alert('已生成本月帳單記錄！'); }}
            >
              <RefreshCw size={14} /> 生成
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* ── Backup: current workspace ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">備份（目前帳戶）</h3>
            <p className="text-xs text-slate-400 mt-0.5">只備份 / 還原目前選中的帳戶</p>
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-white">匯出 JSON 備份</p>
              <p className="text-xs text-slate-400">包含帳單項目、記錄、付款方法</p>
            </div>
            <Button size="sm" variant="secondary" onClick={exportJSON}>
              <FileJson size={14} /> 匯出 JSON
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-white">匯出 CSV 報表</p>
              <p className="text-xs text-slate-400">可用 Excel / Numbers 開啟</p>
            </div>
            <Button size="sm" variant="secondary" onClick={exportCSV}>
              <FileSpreadsheet size={14} /> 匯出 CSV
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-white">匯入 JSON 備份</p>
              <p className="text-xs text-slate-400">還原目前帳戶（覆蓋現有資料）</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> 匯入
            </Button>
          </div>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </CardBody>
      </Card>

      {/* ── Backup: ALL workspaces ─────────────────────────────────────── */}
      <Card className="border-indigo-200 dark:border-indigo-800/60">
        <CardHeader className="border-indigo-100 dark:border-indigo-800/40">
          <div>
            <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
              <DatabaseBackup size={15} /> 備份（全部 {workspaces.length} 個帳戶）
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">同時備份 / 還原所有帳戶的資料，推薦用此方式做完整備份</p>
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-white">匯出全部帳戶 JSON</p>
              <p className="text-xs text-slate-400">所有帳戶的帳單 + 付款方法完整備份</p>
            </div>
            <Button size="sm" variant="primary" onClick={exportAllJSON}>
              <FolderDown size={14} /> 匯出全部
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-white">匯入全部帳戶 JSON</p>
              <p className="text-xs text-slate-400">還原所有帳戶（覆蓋全部現有資料）</p>
            </div>
            <Button size="sm" variant="primary" onClick={() => fileAllRef.current?.click()}>
              <FolderUp size={14} /> 匯入全部
            </Button>
          </div>
          <input ref={fileAllRef} type="file" accept=".json" className="hidden" onChange={handleImportAll} />
        </CardBody>
      </Card>

      {/* ── PWA ────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader><h3 className="text-sm font-semibold text-slate-800 dark:text-white">PWA 安裝</h3></CardHeader>
        <CardBody>
          <div className="flex items-start gap-3">
            <Smartphone size={20} className="text-indigo-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-white mb-1">安裝到手機主畫面</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                iOS：在 Safari 底部點擊「分享」圖示，然後選擇「加入主畫面」。<br />
                Android：在 Chrome 點擊右上角選單，選擇「加入主畫面」或「安裝應用程式」。
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ── Data stats ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Info size={16} /> 資料概況（目前帳戶）
          </h3>
        </CardHeader>
        <CardBody className="space-y-2 text-sm">
          {[
            ['帳單項目', `${totalItems} 項`],
            ['帳單記錄', `${totalRecords} 筆`],
            ['付款方法', `${totalPm} 種`],
            ['帳戶總數', `${workspaces.length} 個`],
            ['本地儲存大小', `${localSize} KB`],
            ['儲存方式', 'localStorage（本地）'],
          ].map(([label, value], i, arr) => (
            <div key={label}
              className={`flex justify-between py-1.5 ${
                i < arr.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''
              }`}
            >
              <span className="text-slate-500 dark:text-slate-400">{label}</span>
              <span className={label === '儲存方式'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-800 dark:text-white'
              }>{value}</span>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* ── Danger zone ────────────────────────────────────────────────── */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader className="border-red-100 dark:border-red-800/50">
          <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">危險操作</h3>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-white">清空目前帳戶</p>
              <p className="text-xs text-slate-400">清除目前帳戶所有帳單資料（不可撤銷）</p>
            </div>
            <Button size="sm" variant="danger" onClick={handleReset}>
              <RefreshCw size={14} /> 清空
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="text-center text-xs text-slate-400 pb-8">
        <p>帳單管家 v1.0.0</p>
        <p>所有資料儲存於本地裝置，不上傳任何資訊</p>
      </div>
    </div>
  );
}
