-- RLS policies for anon key access
-- Authorization is handled at the API route level (JWT verification + alien_id checks)

-- clawbots: API routes handle ownership checks
create policy "anon_select_clawbots" on clawbots for select to anon using (true);
create policy "anon_insert_clawbots" on clawbots for insert to anon with check (true);
create policy "anon_update_clawbots" on clawbots for update to anon using (true);

-- deploy_jobs: API routes handle ownership checks
create policy "anon_select_deploy_jobs" on deploy_jobs for select to anon using (true);
create policy "anon_insert_deploy_jobs" on deploy_jobs for insert to anon with check (true);
create policy "anon_update_deploy_jobs" on deploy_jobs for update to anon using (true);

-- attestation_keys: read-only for public key distribution
create policy "anon_select_attestation_keys" on attestation_keys for select to anon using (true);
