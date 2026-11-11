import { supabase } from '../lib/supabase';
import type { WorkspaceRoot } from '../types';

export class CloudConflictError extends Error {
  constructor() {
    super('雲端資料版本已改變，或上一次儲存結果未能確認。請先匯出未儲存資料，再重新載入；不可直接覆蓋雲端版本。');
    this.name = 'CloudConflictError';
  }
}

export function validateRoot(value: unknown): asserts value is WorkspaceRoot {
  const root = value as WorkspaceRoot | null;
  if (!root || root.version !== '2.0.0' || !Array.isArray(root.workspaces) ||
      root.workspaces.length < 1 || root.workspaces.length > 3 ||
      !root.workspaces.some(w => w.id === root.activeWorkspaceId)) {
    throw new Error('無效的工作區資料');
  }
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const workspaceIds = new Set<string>();
  for (const ws of root.workspaces) {
    if (!uuid.test(ws.id) || workspaceIds.has(ws.id) || !ws.name?.trim() ||
        !Number.isFinite(Date.parse(ws.createdAt))) throw new Error('無效的工作區識別碼、名稱或日期');
    workspaceIds.add(ws.id);
    const d = ws.data;
    if (!d || !d.settings || typeof d.settings.darkMode !== 'boolean' ||
        typeof d.settings.currencySymbol !== 'string' ||
        typeof d.settings.currency !== 'string' ||
        !Array.isArray(d.categories) || !Array.isArray(d.paymentMethods) ||
        !Array.isArray(d.billItems) || !Array.isArray(d.billRecords)) throw new Error('無效的賬單資料格式');
    const ids = (rows: { id: string }[], requireUuid: boolean) => {
      const result = new Set<string>();
      for (const row of rows) {
        if (!row || typeof row.id !== 'string' || !row.id || result.has(row.id) ||
            (requireUuid && !uuid.test(row.id))) throw new Error('無效或重複的資料識別碼');
        result.add(row.id);
      }
      return result;
    };
    const categories = ids(d.categories, false);
    const methods = ids(d.paymentMethods, true);
    const items = ids(d.billItems, true);
    ids(d.billRecords, true);
    for (const item of d.billItems) {
      if (!categories.has(item.categoryId) ||
          (item.defaultPaymentMethodId && !methods.has(item.defaultPaymentMethodId))) throw new Error('賬單引用不存在的分類或付款方式');
    }
    for (const rec of d.billRecords) {
      if (!items.has(rec.billItemId) || (rec.paymentMethodId && !methods.has(rec.paymentMethodId))) throw new Error('付款記錄引用不存在的賬單或付款方式');
    }
  }
}

async function clientFor(userId: string) {
  if (!supabase) throw new Error('尚未設定 Supabase');
  const { data, error } = await supabase.auth.getSession();
  if (error || data.session?.user.id !== userId) throw new Error('登入帳戶已改變，請重新登入');
  return supabase;
}

export async function loadCloudRoot(userId: string): Promise<{ root: WorkspaceRoot | null; revision: number }> {
  const client = await clientFor(userId);
  const { data, error } = await client.rpc('bill_management_load', { p_user_id: userId });
  if (error) throw new Error(`雲端資料載入失敗 (${error.code})`);
  if (!data || !Number.isSafeInteger(data.revision) || data.revision < 0) throw new Error('雲端回傳無效的版本資料');
  if (data.root !== null) validateRoot(data.root);
  return { root: data.root, revision: data.revision };
}

export async function saveCloudRoot(userId: string, root: WorkspaceRoot, expectedRevision: number): Promise<number> {
  validateRoot(root);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new Error('無效的資料版本');
  const client = await clientFor(userId);
  const { data, error } = await client.rpc('bill_management_save', {
    p_user_id: userId, p_root: root, p_expected_revision: expectedRevision,
  });
  if (error?.code === '40001') throw new CloudConflictError();
  if (error) throw new Error(`雲端資料儲存失敗 (${error.code})，請保留未儲存資料。`);
  if (!Number.isSafeInteger(data) || data !== expectedRevision + 1) throw new Error('未能確認雲端儲存結果，請勿當作已儲存');
  return data;
}
