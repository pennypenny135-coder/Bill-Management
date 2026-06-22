import { useState } from 'react';
import { Plus, Edit3, Trash2, GripVertical } from 'lucide-react';
import { useStoreContext } from '../store/StoreContext';
import { Card, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FormField, Input } from '../components/ui/FormField';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../utils/helpers';
import { useDragSort } from '../hooks/useDragSort';
import type { Category } from '../types';

const EMPTY_FORM = { name: '', color: '#6366f1', icon: '📋' };

export default function Categories() {
  const { data, addCategory, updateCategory, deleteCategory, reorderCategories } = useStoreContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const drag = useDragSort(data.categories, reorderCategories);

  const openAdd = () => {
    setForm({ ...EMPTY_FORM }); setEditingId(null); setErrors({}); setModalOpen(true);
  };
  const openEdit = (cat: Category) => {
    setForm({ name: cat.name, color: cat.color, icon: cat.icon });
    setEditingId(cat.id); setErrors({}); setModalOpen(true);
  };
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = '請輸入分類名稱';
    return errs;
  };
  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (editingId) {
      updateCategory(editingId, { name: form.name.trim(), color: form.color, icon: form.icon });
    } else {
      addCategory({ name: form.name.trim(), color: form.color, icon: form.icon, builtIn: false, active: true });
    }
    setModalOpen(false);
  };
  const handleDelete = (cat: Category) => {
    if (cat.builtIn) { alert('內建分類無法刪除'); return; }
    if (confirm(`確定要刪除「${cat.name}」分類？`)) deleteCategory(cat.id);
  };
  const getUsageCount = (catId: string) =>
    data.billItems.filter((b) => b.categoryId === catId && b.active).length;

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">帳單分類</h1>
          {data.categories.length > 1 && (
            <p className="text-xs text-slate-400 mt-0.5">拖動 <GripVertical size={11} className="inline" /> 可重新排序</p>
          )}
        </div>
        <Button size="sm" onClick={openAdd}><Plus size={14} /> 新增分類</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" {...drag.containerProps}>
        {data.categories.map((cat, idx) => {
          const usage = getUsageCount(cat.id);
          return (
            <div key={cat.id} {...drag.itemProps(idx)} style={drag.itemStyle(idx)}>
              <Card>
                <CardBody>
                  <div className="flex items-center gap-3">
                    {/* Drag handle */}
                    <GripVertical
                      size={17}
                      className="text-slate-300 dark:text-slate-600 flex-shrink-0 cursor-grab active:cursor-grabbing"
                    />
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: cat.color + '20', border: `2px solid ${cat.color}40` }}
                    >
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 dark:text-white">{cat.name}</p>
                        {cat.builtIn && <Badge>內建</Badge>}
                        {!cat.active && <Badge variant="warning">停用</Badge>}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{usage} 項帳單</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                      >
                        <Edit3 size={15} />
                      </button>
                      {!cat.builtIn && (
                        <button
                          onClick={() => handleDelete(cat)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-red-400"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          );
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? '編輯分類' : '新增分類'} size="sm">
        <div className="space-y-4">
          <FormField label="分類名稱" required error={errors.name}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例如：水電煤、醫療、交通" error={!!errors.name} />
          </FormField>
          <FormField label="圖示">
            <div className="grid grid-cols-8 gap-2">
              {CATEGORY_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setForm({ ...form, icon })}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${
                    form.icon === icon
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-indigo-500'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="或輸入自訂 emoji" className="mt-2" />
          </FormField>
          <FormField label="顏色">
            <div className="grid grid-cols-6 gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setForm({ ...form, color })}
                  className={`w-9 h-9 rounded-lg transition-all ${
                    form.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="mt-2 h-9 p-1 cursor-pointer" />
          </FormField>
          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1">{editingId ? '儲存' : '新增'}</Button>
            <Button onClick={() => setModalOpen(false)} variant="secondary">取消</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
