begin;

alter table public.user_preferences add column revision bigint not null default 0 check (revision >= 0);

create function public.bill_management_load(p_user_id uuid)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare result jsonb;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Authentication mismatch' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'revision', coalesce((select p.revision from public.user_preferences p where p.user_id = p_user_id), 0),
    'root', case when count(*) = 0 then null else jsonb_build_object(
      'version', '2.0.0',
      'activeWorkspaceId', coalesce(
        (select p.active_workspace_id from public.user_preferences p where p.user_id = p_user_id),
        (array_agg(w.id order by w.created_at, w.id))[1]),
      'workspaces', jsonb_agg(jsonb_build_object(
        'id', w.id, 'name', w.name, 'createdAt', w.created_at,
        'data', jsonb_build_object(
          'version', '1.0.0', 'settings', w.settings,
          'categories', coalesce((select jsonb_agg(c.payload || jsonb_build_object('id', c.id) order by c.position, c.id) from public.categories c where c.user_id = p_user_id and c.workspace_id = w.id), '[]'::jsonb),
          'paymentMethods', coalesce((select jsonb_agg(m.payload || jsonb_build_object('id', m.id) order by m.position, m.id) from public.payment_methods m where m.user_id = p_user_id and m.workspace_id = w.id), '[]'::jsonb),
          'billItems', coalesce((select jsonb_agg(b.payload || jsonb_build_object('id', b.id, 'categoryId', b.category_id, 'defaultPaymentMethodId', b.payment_method_id) order by b.id) from public.bill_items b where b.user_id = p_user_id and b.workspace_id = w.id), '[]'::jsonb),
          'billRecords', coalesce((select jsonb_agg(r.payload || jsonb_build_object('id', r.id, 'billItemId', r.bill_item_id, 'paymentMethodId', r.payment_method_id) order by r.id) from public.bill_records r where r.user_id = p_user_id and r.workspace_id = w.id), '[]'::jsonb)
        )
      ) order by w.created_at, w.id)
    ) end
  ) into result from public.workspaces w where w.user_id = p_user_id;
  return result;
end;
$$;

create function public.bill_management_save(p_user_id uuid, p_root jsonb, p_expected_revision bigint)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare current_revision bigint; ws jsonb; entry jsonb; ws_id uuid; idx integer;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Authentication mismatch' using errcode = '42501';
  end if;
  if p_root is null or jsonb_typeof(p_root) <> 'object' or
     jsonb_typeof(p_root->'workspaces') is distinct from 'array' then
    raise exception 'Invalid workspace root';
  end if;
  if jsonb_array_length(p_root->'workspaces') not between 1 and 3 or
     not exists (select 1 from jsonb_array_elements(p_root->'workspaces') x where x->>'id' = p_root->>'activeWorkspaceId') then
    raise exception 'Invalid workspace count or active workspace';
  end if;
  insert into public.user_preferences(user_id) values(p_user_id) on conflict (user_id) do nothing;
  select revision into current_revision from public.user_preferences where user_id = p_user_id for update;
  if p_expected_revision is null or current_revision <> p_expected_revision then
    raise exception 'BILL_MANAGEMENT_REVISION_CONFLICT' using errcode = '40001';
  end if;

  update public.user_preferences set active_workspace_id = null where user_id = p_user_id;
  delete from public.bill_records where user_id = p_user_id;
  delete from public.bill_items where user_id = p_user_id;
  delete from public.payment_methods where user_id = p_user_id;
  delete from public.categories where user_id = p_user_id;
  delete from public.workspaces where user_id = p_user_id;

  for ws in select value from jsonb_array_elements(p_root->'workspaces') loop
    ws_id := (ws->>'id')::uuid;
    if jsonb_typeof(ws->'data'->'settings') is distinct from 'object' or
       jsonb_typeof(ws->'data'->'categories') is distinct from 'array' or
       jsonb_typeof(ws->'data'->'paymentMethods') is distinct from 'array' or
       jsonb_typeof(ws->'data'->'billItems') is distinct from 'array' or
       jsonb_typeof(ws->'data'->'billRecords') is distinct from 'array' then
      raise exception 'Invalid workspace data';
    end if;
    insert into public.workspaces(id, user_id, name, settings, created_at)
      values(ws_id, p_user_id, ws->>'name', ws->'data'->'settings', (ws->>'createdAt')::timestamptz);
    idx := 0;
    for entry in select value from jsonb_array_elements(ws->'data'->'categories') loop
      insert into public.categories(id, workspace_id, user_id, payload, position) values(entry->>'id', ws_id, p_user_id, entry, idx);
      idx := idx + 1;
    end loop;
    idx := 0;
    for entry in select value from jsonb_array_elements(ws->'data'->'paymentMethods') loop
      insert into public.payment_methods(id, workspace_id, user_id, payload, position) values((entry->>'id')::uuid, ws_id, p_user_id, entry, idx);
      idx := idx + 1;
    end loop;
    for entry in select value from jsonb_array_elements(ws->'data'->'billItems') loop
      insert into public.bill_items(id, workspace_id, user_id, category_id, payment_method_id, payload)
        values((entry->>'id')::uuid, ws_id, p_user_id, entry->>'categoryId', nullif(entry->>'defaultPaymentMethodId', '')::uuid, entry);
    end loop;
    for entry in select value from jsonb_array_elements(ws->'data'->'billRecords') loop
      insert into public.bill_records(id, workspace_id, user_id, bill_item_id, payment_method_id, payload)
        values((entry->>'id')::uuid, ws_id, p_user_id, (entry->>'billItemId')::uuid, nullif(entry->>'paymentMethodId', '')::uuid, entry);
    end loop;
  end loop;
  update public.user_preferences set active_workspace_id = (p_root->>'activeWorkspaceId')::uuid, revision = current_revision + 1 where user_id = p_user_id;
  return current_revision + 1;
end;
$$;

revoke all on function public.bill_management_load(uuid) from public, anon;
revoke all on function public.bill_management_save(uuid, jsonb, bigint) from public, anon;
grant execute on function public.bill_management_load(uuid) to authenticated;
grant execute on function public.bill_management_save(uuid, jsonb, bigint) to authenticated;

commit;
