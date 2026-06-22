import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useStoreContext } from '../store/StoreContext';
import { MAX_WORKSPACES } from '../types';
import { cn } from '../utils/cn';

export default function WorkspaceTabs() {
  const {
    workspaces, activeWorkspaceId,
    switchWorkspace, addWorkspace, renameWorkspace, deleteWorkspace,
  } = useStoreContext();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName]   = useState('');
  const [adding, setAdding]       = useState(false);
  const [newName, setNewName]     = useState('');

  const canAdd = workspaces.length < MAX_WORKSPACES;

  function startEdit(id: string, name: string) { setEditingId(id); setEditName(name); }
  function confirmEdit() {
    if (editingId && editName.trim()) renameWorkspace(editingId, editName.trim());
    setEditingId(null); setEditName('');
  }
  function cancelEdit() { setEditingId(null); setEditName(''); }

  function confirmAdd() {
    const name = newName.trim() || `帳戶 ${workspaces.length + 1}`;
    addWorkspace(name);
    setAdding(false); setNewName('');
  }
  function cancelAdd() { setAdding(false); setNewName(''); }

  return (
    <div className="flex items-center gap-1 px-3 h-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 overflow-x-auto shrink-0">
      {workspaces.map((ws) => {
        const isActive  = ws.id === activeWorkspaceId;
        const isEditing = editingId === ws.id;
        return (
          <div
            key={ws.id}
            className={cn(
              'group flex items-center gap-1 h-7 px-2.5 rounded-md text-xs font-medium shrink-0 transition-colors select-none',
              isActive
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
            )}
            onClick={() => !isEditing && !isActive && switchWorkspace(ws.id)}
          >
            {isEditing ? (
              <>
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') cancelEdit(); }}
                  className="w-24 bg-transparent border-b border-indigo-400 outline-none text-xs"
                  onClick={(e) => e.stopPropagation()}
                />
                <button onClick={(e) => { e.stopPropagation(); confirmEdit(); }} className="text-green-500 hover:text-green-400"><Check size={12} /></button>
                <button onClick={(e) => { e.stopPropagation(); cancelEdit(); }} className="text-slate-400 hover:text-slate-300"><X size={12} /></button>
              </>
            ) : (
              <>
                <span>{ws.name}</span>
                {isActive && (
                  <>
                    <button
                      title="重新命名"
                      onClick={(e) => { e.stopPropagation(); startEdit(ws.id, ws.name); }}
                      className="opacity-0 group-hover:opacity-100 ml-0.5 text-slate-400 hover:text-indigo-500 transition-opacity"
                    >
                      <Pencil size={11} />
                    </button>
                    {workspaces.length > 1 && (
                      <button
                        title="刪除帳戶"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`確定刪除「${ws.name}」？此操作不可撤銷。`)) deleteWorkspace(ws.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        );
      })}

      {adding ? (
        <div className="flex items-center gap-1 h-7 px-2 shrink-0">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') confirmAdd(); if (e.key === 'Escape') cancelAdd(); }}
            placeholder={`帳戶 ${workspaces.length + 1}`}
            className="w-28 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 text-xs outline-none focus:border-indigo-400"
          />
          <button onClick={confirmAdd} className="text-green-500 hover:text-green-400"><Check size={13} /></button>
          <button onClick={cancelAdd}  className="text-slate-400 hover:text-slate-300"><X size={13} /></button>
        </div>
      ) : canAdd ? (
        <button
          onClick={() => setAdding(true)}
          title={`新增帳戶（最多 ${MAX_WORKSPACES} 個）`}
          className="flex items-center gap-1 h-7 px-2 rounded-md text-xs text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0"
        >
          <Plus size={13} /><span>新增</span>
        </button>
      ) : (
        <span className="text-xs text-slate-400 dark:text-slate-500 px-2 shrink-0">已達上限 ({MAX_WORKSPACES})</span>
      )}
    </div>
  );
}
