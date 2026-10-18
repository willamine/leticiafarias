import { supabase, assertSupabaseReady } from './supabase-client.js';

const form = document.querySelector('#loginForm');
const status = document.querySelector('#loginStatus');

function setStatus(message, kind = '') 
{
  status.textContent = message;
  status.className = `status-message ${kind}`.trim();
}

async function handleLogin(event) {
  event.preventDefault();

  if (!supabase) {
    setStatus('Supabase não configurado. Atualize as credenciais públicas.', 'error');
    return;
  }

  const email = document.querySelector('#email').value.trim();
  const password = document.querySelector('#password').value;

  if (!email || !password) {
    setStatus('Informe e-mail e senha.', 'error');
    return;
  }

  try {
    setStatus('Entrando...', '');
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }

    window.location.href = 'painel.html';
  } catch (error) {
    const message = error?.message || 'Não foi possível entrar no painel.';
    setStatus(message, 'error');
  }
}

if (form) {
  form.addEventListener('submit', handleLogin);
}

assertSupabaseReady();
