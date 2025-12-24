# Plan: Implement RLS for 'daily_outfit_plans'

## Phase 1: RLS Policy Implementation and Migration

-   **Task:** Define and write the SQL migration script for the RLS policies.
    -   Create a new SQL file in `supabase/migrations/`.
    -   In the file, write the `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statement.
    -   Write the `CREATE POLICY` statements for `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on the `daily_outfit_plans` table. The policy should restrict access to rows where `user_id` matches `auth.uid()`.

-   **Task:** Apply the database migration.
    -   Run the Supabase CLI command to apply the new migration to the local development database.
    -   Verify in the Supabase Studio that RLS is enabled and the policies are correctly configured for the `daily_outfit_plans` table.

## Phase 2: API and Integration Testing

-   **Task:** Create and run integration tests to verify RLS policies.
    -   Write a test case where `user_A` saves data and verifies that `user_A` can read it.
    -   Write a test case where `user_B` attempts to read `user_A`'s data and verifies that the request returns no data.
    -   Write a test case for an unauthenticated user attempting to read data, expecting a failure (this should be handled by the API's auth check, but is good to have as a database-level confirmation).

-   **Task:** Run existing API tests to ensure no regressions.
    -   Execute the existing test suite for the `save` and `plan` API routes to confirm that functionality remains correct for authenticated users.

## Phase 3: Documentation and Finalization

-   **Task:** Update project documentation.
    -   Update `docs/backend-services.md` or a relevant architecture document to reflect the use of RLS on the `daily_outfit_plans` table.
-   **Task:** Review and merge the changes.
    -   Create a pull request with the new migration script and any test files.
    -   Review the changes and merge to the main branch.
