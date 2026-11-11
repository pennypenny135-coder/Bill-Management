import { useCallback, useEffect, useRef, useState } from 'react';
import type { WorkspaceRoot } from '../types';
import { loadCloudRoot, saveCloudRoot, validateRoot } from './cloudRepository';

export function useCloudRoot(userId: string, factory: () => WorkspaceRoot) {
  const [root, view] = useState(factory);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('正在載入雲端資料…');
  const [error, setError] = useState<string | null>(null);
  const wanted = useRef(root);
  const saved = useRef<WorkspaceRoot | null>(null);
  const revision = useRef(0);
  const generation = useRef(0);
  const initialized = useRef(false);
  const running = useRef(false);
  const blocked = useRef(false);

  useEffect(() => {
    const token = ++generation.current;
    initialized.current = false; running.current = false; blocked.current = false;
    saved.current = null; setReady(false); setError(null);
    setStatus('正在載入雲端資料…');
    if (!userId) return;
    (async () => {
      const loaded = await loadCloudRoot(userId);
      if (token !== generation.current) return;
      const next = loaded.root || factory();
      let nextRevision = loaded.revision;
      if (!loaded.root) nextRevision = await saveCloudRoot(userId, next, nextRevision);
      if (token !== generation.current) return;
      wanted.current = next; saved.current = next; revision.current = nextRevision;
      initialized.current = true; view(next); setReady(true); setStatus('已儲存至雲端');
    })().catch((e: unknown) => {
      if (token !== generation.current) return;
      blocked.current = true;
      setError(e instanceof Error ? e.message : '雲端載入失敗');
    });
    return () => { ++generation.current; initialized.current = false; };
  }, [userId, factory]);

  const flush = useCallback(async () => {
    if (!initialized.current || running.current || blocked.current) return;
    const token = generation.current;
    running.current = true; setStatus('正在儲存，請勿關閉或登出…');
    try {
      while (wanted.current !== saved.current && token === generation.current) {
        const snapshot = wanted.current;
        const nextRevision = await saveCloudRoot(userId, snapshot, revision.current);
        if (token !== generation.current) return;
        revision.current = nextRevision; saved.current = snapshot;
      }
      if (token === generation.current) setStatus('已儲存至雲端');
    } catch (e) {
      if (token !== generation.current) return;
      blocked.current = true;
      setError(e instanceof Error ? e.message : '儲存失敗，尚有未儲存資料');
      setStatus('未儲存');
    } finally {
      if (token === generation.current) running.current = false;
    }
  }, [userId]);

  const setRoot = useCallback((change: WorkspaceRoot | ((r: WorkspaceRoot) => WorkspaceRoot)) => {
    if (!initialized.current || blocked.current) return;
    try {
      const next = typeof change === 'function' ? change(wanted.current) : change;
      if (next === wanted.current) return;
      validateRoot(next); wanted.current = next; view(next);
      setStatus('等待儲存…');
    } catch (e) { alert(e instanceof Error ? e.message : '資料格式錯誤'); }
  }, []);

  useEffect(() => { if (ready) void flush(); }, [root, ready, flush]);
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (initialized.current && wanted.current !== saved.current) {
        event.preventDefault(); event.returnValue = '';
      }
    };
    const beforeSignOut = (event: Event) => {
      if (initialized.current && wanted.current !== saved.current) {
        event.preventDefault();
        alert('仍有未儲存資料，請等待儲存完成；如儲存失敗，請先匯出備份。');
      }
    };
    window.addEventListener('beforeunload', unload);
    window.addEventListener('bill-management-before-signout', beforeSignOut);
    return () => {
      window.removeEventListener('beforeunload', unload);
      window.removeEventListener('bill-management-before-signout', beforeSignOut);
    };
  }, []);
  const retrySave = useCallback(() => {
    if (!initialized.current) return;
    blocked.current = false; setError(null); void flush();
  }, [flush]);
  return { root, setRoot, ready, status, error, retrySave };
}
