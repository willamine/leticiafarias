require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Simple healthcheck
app.get('/health', (req, res) => res.json({ ok: true }));

// Verify JWT token server-side (returns session info)
app.post('/admin/verify-session', async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) return res.status(400).json({ error: 'access_token required' });

  try {
    // Use Supabase Admin API to get user by cookie/token
    const { data, error } = await supabase.auth.getUser(access_token);
    if (error) return res.status(401).json({ error: error.message });
    return res.json({ user: data?.user || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Example protected route: list users (requires service role key)
app.get('/admin/list-users', async (req, res) => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ users: data?.users || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Protected: return alunos with anamneses. Validate caller's access_token.
app.get('/admin/alunos', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'missing access token' });

    // Validate token
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return res.status(401).json({ error: 'invalid token' });

    // Optional admin email restriction
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (adminEmails.length && !adminEmails.includes(userData.user.email)) {
      return res.status(403).json({ error: 'forbidden' });
    }

    // Query alunos and related anamneses
    const { data, error } = await supabase
      .from('alunos')
      .select(`
        id,
        nome_completo,
        telefone,
        email,
        data_nascimento,
        anamneses:anamneses ( * )
      `)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ alunos: data || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

app.listen(PORT, () => console.log(`Admin server listening on http://localhost:${PORT}`));
