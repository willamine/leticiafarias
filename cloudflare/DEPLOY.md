Deployment steps for Cloudflare Worker (proxy for admin endpoints)

1) Install Wrangler (if not already):

```bash
npm install -g wrangler
wrangler login
```

2) From the `cloudflare/` folder, copy `wrangler.example.toml` to `wrangler.toml` and set your `account_id`.

3) Add secrets (service role key and supabase url):

```bash
# in cloudflare/ folder
wrangler secret put SUPABASE_SERVICE_KEY
# paste the service_role key (sb_secret_...)
wrangler secret put SUPABASE_URL
# paste the https://<project>.supabase.co
wrangler secret put ADMIN_EMAILS
# optional: comma separated admin emails
```

4) Publish the worker:

```bash
wrangler publish
```

Notes:
- The Worker exposes `/admin/alunos` and expects `Authorization: Bearer <access_token>`.
- The frontend (Cloudflare Pages) should call the Worker endpoint (e.g., `https://<name>.<workers_dev>.workers.dev/admin/alunos`) with the user's access token.
- Ensure your Supabase Allowed Origins include your Pages domain (and workers_dev domain if testing).

If you prefer Cloudflare Pages Functions integration, you can upload this same worker script as a Pages Function; instructions differ slightly in the Pages UI.
