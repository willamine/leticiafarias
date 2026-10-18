addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  if (url.pathname === '/admin/alunos' && request.method === 'GET') {
    // Expect Authorization: Bearer <access_token>
    const auth = request.headers.get('Authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return new Response(JSON.stringify({ error: 'missing access token' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

    // These values should be provided as Worker secrets/bindings (wrangler secret put)
    const SUPABASE_URL = SUPABASE_URL || ''
    const SERVICE_KEY = SUPABASE_SERVICE_KEY || ''

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return new Response(JSON.stringify({ error: 'server not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    // Validate token with Supabase auth endpoint
    const validateRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SERVICE_KEY,
      },# Copy this file to `.env` and set the secret keys there (do not commit `.env`)
# Use the service (secret) key only on the server side. Example:
# SUPABASE_SECRET_KEY=
PORT=3000

# Notes:
# - The anon/publishable key is safe to use in frontend code for public operations.
# - Keep the `SUPABASE_SECRET_KEY` (service role) private on the backend only.
# - Configure CORS / Allowed Origins in Supabase dashboard to include your frontend origin (e.g., http://localhost:8000).

# Optional: a comma-separated list of admin emails allowed to call admin endpoints.
# If set, only those emails can fetch `/admin/alunos`. Example:
# ADMIN_EMAILS=admin@example.com,leticia@exemplo.com

    })

    if (!validateRes.ok) {
      const errBody = await validateRes.text().catch(() => '')
      return new Response(JSON.stringify({ error: 'invalid token', detail: errBody }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }

    const userData = await validateRes.json().catch(() => null)
    if (!userData || !userData.id) {
      return new Response(JSON.stringify({ error: 'invalid token' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }

    // Optional ADMIN_EMAILS check
    const adminList = (ADMIN_EMAILS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    if (adminList.length && !adminList.includes(userData.email)) {
      return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
    }

    // Fetch alunos via PostgREST
    const select = encodeURIComponent('id,nome_completo,telefone,email,data_nascimento,anamneses(*)')
    const restUrl = `${SUPABASE_URL}/rest/v1/alunos?select=${select}&order=created_at.desc`

    const resp = await fetch(restUrl, {
      method: 'GET',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Accept: 'application/json',
      },
    })

    if (!resp.ok) {
      const body = await resp.text().catch(() => '')
      return new Response(JSON.stringify({ error: 'failed to fetch alunos', detail: body }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
        },
      })
    }

    const alunos = await resp.json().catch(() => [])
    return new Response(JSON.stringify({ alunos }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
      },
    })
  }

  return new Response('Not found', { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } })
}
