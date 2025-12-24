# Spec: Implement Row Level Security (RLS) for 'daily_outfit_plans' Table

## 1. Objective
To enhance data privacy and integrity by implementing Row Level Security (RLS) policies on the `daily_outfit_plans` table in the Supabase database. This will ensure that users can only access and modify their own data.

## 2. Functional Requirements
- **Data Isolation:** Users must only be able to `SELECT`, `INSERT`, `UPDATE`, and `DELETE` their own records in the `daily_outfit_plans` table.
- **API Behavior:** Existing APIs that interact with this table (`/api/reco/daily-outfits/save` and `/api/reco/daily-outfits/plan`) must continue to function correctly for authenticated users, while respecting the new RLS policies.
- **Unauthorized Access:** Unauthenticated users must be prevented from accessing any data in the `daily_outfit_plans` table at the database level.

## 3. Technical Implementation
- **Enable RLS:** RLS must be enabled on the `daily_outfit_plans` table.
- **Create Policies:**
  - A `SELECT` policy must be created to allow users to view only the rows where `user_id` matches their authenticated `auth.uid()`.
  - An `INSERT` policy must be created to allow users to insert new rows only if the `user_id` in the new row matches their `auth.uid()`.
  - An `UPDATE` policy must be created to allow users to update existing rows only where `user_id` matches their `auth.uid()`.
  - A `DELETE` policy should be considered and created, likely with the same condition (`user_id = auth.uid()`), to allow users to delete their own data.
- **Policy Definition (Example):**
  ```sql
  -- For SELECT, UPDATE, DELETE
  CREATE POLICY "Enable user-specific access"
  ON public.daily_outfit_plans
  FOR ALL
  USING (auth.uid() = user_id);

  -- For INSERT (if not covered by ALL)
  CREATE POLICY "Enable user-specific insert"
  ON public.daily_outfit_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  ```

## 4. Acceptance Criteria
- All existing API tests for `/save` and `/plan` routes must pass for authenticated users.
- New tests should be created to verify that a user cannot access another user's data.
- Manual verification confirms that RLS is enabled and policies are active in the Supabase dashboard.
