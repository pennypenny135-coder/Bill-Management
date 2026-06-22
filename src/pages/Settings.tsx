import { useRef } from 'react';
import {
  Upload, FileJson, FileSpreadsheet, RefreshCw,
  Moon, Sun, Smartphone, Info,
} from 'lucide-react';
import { useStoreContext } from '../store/StoreContext';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/FormField';
import { getCurrentPeriod } from '../utils/helpers';

export default function Settings() {
  const { data, updateSettings, exportJSON, exportCSV, importJSON, resetToSeed, generateRecordsForPeriod } = useStoreContext();
  const fileRef = useRef<HTMLInputElement>(null);
  const settings = data.settings;
  const currentPeriod = getCurrentPeriod();

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (confirm('匯入將覆蓋現有資料，確定繼續？')) {
        importJSON(file);
      }
    }
    e.target.value = '';
  };

  const handleReset = () => {
    if (confirm('確定要重置所有資料？這將清除所有帳單記錄並還原示範資料。')) {
      resetToSeed();
    }
  };

  const totalRecords = data.billRecords.length;
  const totalItems = data.billItems.length;
  const totalPm = data.paymentMethods.length;
  const localSize = (() => {
    try {
      const raw = localStorage.getItem('billmaster_data') ?? '';
      return (new Blob([raw]).size / 1024).toFixed(1);
    } catch {
      return '?';
    }
  })();

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">設定與備份</h1>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">外觀設定</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.darkMode ? <Moon size={18} className="text-indigo-400" /> : <Sun size={18} className="text-amber-500" />}
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-white">深色模式</p>
                <p className="text-xs text-slate-400">切換介面主題</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ darkMode: !settings.darkMode })}
              className={`w-12 h-6 rounded-full transition-colors ${settings.darkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${settings.darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </CardBody>
      </Card>

      {/* Currency */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">貨幣設定</h3>
        </CardHeader>
        <CardBody className="space-y-3">
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

      {/* Generate bills */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">帳單生成</h3>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-white">生成本月帳單</p>
              <p className="text-xs text-slate-400">為所有啟用的 recurring 帳單建立本月記錄</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                generateRecordsForPeriod(currentPeriod);
                alert('已生成本月帳單記錄！');
              }}
            >
              <RefreshCw size={14} /> 生成
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Export / Import */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">備份與匯出</h3>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-white">匯出 JSON 備份</p>
              <p className="text-xs text-slate-400">包含所有帳單項目、記錄、付款方法</p>
            </div>
            <Button size="sm" variant="secondary" onClick={exportJSON}>
              <FileJson size={14} /> JSON
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-white">匯出 CSV 報表</p>
              <p className="text-xs text-slate-400">可用 Excel / Numbers 開啟</p>
            </div>
            <Button size="sm" variant="secondary" onClick={exportCSV}>
              <FileSpreadsheet size={14} /> CSV
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-white">匯入 JSON 備份</p>
              <p className="text-xs text-slate-400">還原之前的備份（會覆蓋現有資料）</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> 匯入
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </CardBody>
      </Card>

      {/* PWA */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">PWA 安裝</h3>
        </CardHeader>
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

      {/* Data stats */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Info size={16} /> 資料概況
          </h3>
        </CardHeader>
        <CardBody className="space-y-2 text-sm">
          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400">帳單項目</span>
            <span className="text-slate-800 dark:text-white">{totalItems} 項</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400">帳單記錄</span>
            <span className="text-slate-800 dark:text-white">{totalRecords} 筆</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400">付款方法</span>
            <span className="text-slate-800 dark:text-white">{totalPm} 種</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400">本地儲存大小</span>
            <span className="text-slate-800 dark:text-white">{localSize} KB</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-slate-500 dark:text-slate-400">儲存方式</span>
            <span className="text-emerald-600 dark:text-emerald-400">localStorage（本地）</span>
          </div>
        </CardBody>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader className="border-red-100 dark:border-red-800/50">
          <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">危險操作</h3>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-white">重置示範資料</p>
              <p className="text-xs text-slate-400">清除所有資料，還原初始示範內容</p>
            </div>
            <Button size="sm" variant="danger" onClick={handleReset}>
              <RefreshCw size={14} /> 重置
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
