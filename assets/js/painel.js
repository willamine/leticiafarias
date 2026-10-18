import { supabase, assertSupabaseReady } from './supabase-client.js';

const searchInput = document.querySelector('#searchInput');
const studentList = document.querySelector('#studentList');
const detailContent = document.querySelector('#detailContent');
const userLabel = document.querySelector('#userLabel');
const userInitial = document.querySelector('#userInitial');
const logoutButton = document.querySelector('#logoutButton');

let alunos = [];
let selectedAlunoId = null;

function setDetail(content) {
  detailContent.innerHTML = content;
}

function renderEmptyState(message = 'Nenhum aluno encontrado.') {
  setDetail(`<div class="empty-state">${message}</div>`);
}

function renderUserProfile(session) {
  const email = session?.user?.email || 'Administrador';
  userLabel.textContent = email;
  userInitial.textContent = email.charAt(0).toUpperCase();
}

function renderAlunoList(items) {
  if (!studentList) return;

  studentList.innerHTML = '';

  if (!items.length) {
    studentList.innerHTML = '<li class="empty-state">Nenhum aluno corresponde à busca.</li>';
    return;
  }

  items.forEach((aluno) => {
    const item = document.createElement('li');
    item.className = 'student-item';

    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = `
      <span>
        <strong>${aluno.nome_completo || 'Aluno sem nome'}</strong>
        <span class="student-meta">${aluno.telefone || 'Sem telefone'}</span>
      </span>
      <span class="tag">${aluno.data_nascimento ? new Date(aluno.data_nascimento).getFullYear() : 'N/A'}</span>
    `;

    button.addEventListener('click', () => {
      selectedAlunoId = aluno.id;
      renderAlunoDetail(aluno);
      [...studentList.children].forEach((node) => node.classList.remove('is-selected'));
      item.classList.add('is-selected');
    });

    if (selectedAlunoId === aluno.id) {
      item.classList.add('is-selected');
    }

    item.appendChild(button);
    studentList.appendChild(item);
  });
}

function renderAlunoDetail(aluno) {
  const anamnese = aluno.anamnese || {};

  const details = [
    ['Nome completo', aluno.nome_completo || 'Não informado'],
    ['Telefone', aluno.telefone || 'Não informado'],
    ['E-mail', aluno.email || 'Não informado'],
    ['Data de nascimento', aluno.data_nascimento ? new Date(aluno.data_nascimento).toLocaleDateString('pt-BR') : 'Não informado'],
    ['Objetivo principal', anamnese.objetivo_principal || 'Não informado'],
    ['Experiência anterior', anamnese.experiencia_anterior || 'Não informado'],
    ['Frequência semanal', anamnese.frequencia_semanal || 'Não informado'],
    ['Atividades atuais', anamnese.atividades_atuais || 'Não informado'],
  ];

  const content = `
    <div class="detail-header">
      <h2>${aluno.nome_completo || 'Aluno sem nome'}</h2>
    </div>

    <div class="detail-grid">
      ${details
        .map(
          ([label, value]) => `
            <div class="detail-item">
              <dt>${label}</dt>
              <dd>${value}</dd>
            </div>
          `
        )
        .join('')}
    </div>

    <div class="detail-section">
      <h3>Saúde e limitações</h3>
      <div class="detail-grid">
        <div class="detail-item"><dt>Lesões ou limitações</dt><dd>${anamnese.lesoes_limitacoes || 'Não informado'}</dd></div>
        <div class="detail-item"><dt>Condições de saúde</dt><dd>${anamnese.condicoes_saude || 'Não informado'}</dd></div>
        <div class="detail-item"><dt>Restrições médicas</dt><dd>${anamnese.restricoes_medicas || 'Não informado'}</dd></div>
        <div class="detail-item"><dt>Observações</dt><dd>${anamnese.observacoes_relevantes || 'Não informado'}</dd></div>
      </div>
    </div>

    <div class="detail-section">
      <h3>Rotina e hábitos</h3>
      <div class="detail-grid">
        <div class="detail-item"><dt>Rotina de trabalho</dt><dd>${anamnese.rotina_trabalho || 'Não informado'}</dd></div>
        <div class="detail-item"><dt>Qualidade e duração do sono</dt><dd>${anamnese.qualidade_sono || 'Não informado'}</dd></div>
        <div class="detail-item"><dt>Outros hábitos</dt><dd>${anamnese.habitos_relevantes || 'Não informado'}</dd></div>
      </div>
    </div>

    <div class="detail-section">
      <h3>Medidas corporais</h3>
      <div class="detail-grid">
        <div class="detail-item"><dt>Peso</dt><dd>${anamnese.peso ? `${anamnese.peso} kg` : 'Não informado'}</dd></div>
        <div class="detail-item"><dt>Altura</dt><dd>${anamnese.altura_cm ? `${anamnese.altura_cm} cm` : 'Não informado'}</dd></div>
        <div class="detail-item"><dt>Outras medidas</dt><dd>${anamnese.outras_medidas || 'Não informado'}</dd></div>
      </div>
    </div>
  `;

  setDetail(content);
}

function filterAlunos(query) {
  const text = query.trim().toLowerCase();
  if (!text) {
    renderAlunoList(alunos);
    return;
  }

  const filtered = alunos.filter((aluno) =>
    (aluno.nome_completo || '').toLowerCase().includes(text) ||
    (aluno.telefone || '').toLowerCase().includes(text)
  );

  renderAlunoList(filtered);
}

async function fetchAlunos() {
  if (!supabase) {
    renderEmptyState('Configuração do Supabase não foi concluída. Atualize as chaves públicas para habilitar o painel.');
    return;
  }
  // Use backend proxy for listing alunos (so the service key remains on the server)
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const resp = await fetch('/admin/alunos', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      console.error('Failed to fetch alunos:', err);
      renderEmptyState('Não foi possível carregar os cadastros no momento.');
      return;
    }

    const payload = await resp.json();
    const data = payload.alunos || [];

    alunos = (data || []).map((aluno) => ({
      ...aluno,
      anamnese: Array.isArray(aluno.anamneses) && aluno.anamneses.length ? aluno.anamneses[0] : {},
    }));
  } catch (e) {
    console.error('Erro ao buscar alunos:', e);
    renderEmptyState('Não foi possível carregar os cadastros no momento.');
    return;
  }

  renderAlunoList(alunos);

  if (alunos.length) {
    selectedAlunoId = alunos[0].id;
    renderAlunoDetail(alunos[0]);
  } else {
    renderEmptyState('Ainda não há alunos cadastrados.');
  }
}

async function verifySession() {
  if (!supabase) {
    // Sem Supabase configurado — não permitir acesso ao painel.
    window.location.href = 'login.html';
    return;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    window.location.href = 'login.html';
    return;
  }

  renderUserProfile(data.session);
  await fetchAlunos();
}

if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }

    window.location.href = 'login.html';
  });
}

if (searchInput) {
  searchInput.addEventListener('input', (event) => {
    filterAlunos(event.target.value);
  });
}

assertSupabaseReady();
verifySession();
