# AI Con Hub — Supabase Schema & Rules

## Connection
```typescript
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)
```

## Architecture Rules
- All DB calls go in `src/services/` — NEVER directly in components
- Always handle `error` from every Supabase response
- Use `select()` with explicit columns — never `select('*')` in production
- Enable RLS on every table — no exceptions

## Core Tables (expand as you build)

### organizations
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name_ar | text | Arabic name |
| name_en | text | English name |
| plan | enum | starter / pro / enterprise |
| created_at | timestamptz | |

### projects
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK | → organizations |
| name_ar | text | |
| name_en | text | |
| status | enum | planning / active / on_hold / completed |
| start_date | date | |
| end_date | date | |
| budget_usd | numeric | |
| manager_id | uuid FK | → profiles |

### profiles (extends auth.users)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | matches auth.users.id |
| org_id | uuid FK | |
| full_name_ar | text | |
| full_name_en | text | |
| role | enum | admin / pm / engineer / viewer |

## RLS Pattern
```sql
-- Users can only see their own org's data
create policy "org_isolation" on projects
  for all using (
    org_id = (select org_id from profiles where id = auth.uid())
  );
```

## Service Layer Pattern
```typescript
// src/services/projects.ts
export async function getProjects(orgId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name_ar, name_en, status, start_date, budget_usd')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
```