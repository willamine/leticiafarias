import { supabase, assertSupabaseReady } from './supabase-client.js';

const form = document.querySelector('#anamneseForm');
const statusMessage = document.querySelector('#statusMessage');
const submitButton = document.querySelector('#submitButton');

const fieldMap = {
  nomeCompleto: document.querySelector('#nomeCompleto'),
  dataNascimento: document.querySelector('#dataNascimento'),
  telefone: document.querySelector('#telefone'),
  email: document.querySelector('#email'),
  prazoMeta: document.querySelector('#prazoMeta'),
  informacoesAdicionais: document.querySelector('#informacoesAdicionais'),
  consentimentoPrivacidade: document.querySelector('#consentimentoPrivacidade'),
};

const validators = {
  nomeCompleto(value) {
    if (!value || value.trim().length < 2) {
      return 'Informe o nome completo.';
    }
    return '';
  },
  telefone(value) {
    if (!value || value.trim().length < 8) {
      return 'Informe um telefone ou WhatsApp válido.';
    }
    return '';
  },
  email(value) {
    if (!value || !value.trim()) return '';
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(value.trim())) {
      return 'Informe um e-mail válido.';
    }
    return '';
  },
  consentimentoPrivacidade(value) {
    if (!value) {
      return 'É necessário aceitar o aviso de privacidade.';
    }
    return '';
  },
};

function setFieldError(fieldName, message) {
  const field = fieldMap[fieldName];
  if (!field) return;

  const errorNode = document.querySelector(`#${fieldName}Error`);
  field.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (errorNode) {
    errorNode.textContent = message;
  }
}

function validateField(fieldName) {
  const field = fieldMap[fieldName];
  if (!field) return true;

  const value = field.type === 'checkbox' ? field.checked : field.value;
  const validator = validators[fieldName];
  const message = validator ? validator(value) : '';
  setFieldError(fieldName, message);
  return !message;
}

function validateForm() {
  let isValid = true;
  const requiredFields = ['nomeCompleto', 'telefone', 'consentimentoPrivacidade'];

  requiredFields.forEach((fieldName) => {
    if (!validateField(fieldName)) {
      isValid = false;
    }
  });

  if (fieldMap.email && fieldMap.email.value.trim()) {
    if (!validateField('email')) {
      isValid = false;
    }
  }

  return isValid;
}

function setStatus(message, kind = '') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${kind}`.trim();
}

function collectRadioGroups() {
  const selections = {};
  document.querySelectorAll('input[type="radio"]').forEach((radio) => {
    if (radio.checked) {
      selections[radio.name] = radio.value;
    }
  });
  return selections;
}

function serializeFormData() {
  const radioSelections = collectRadioGroups();

  const payload = {
    nome_completo: fieldMap.nomeCompleto.value.trim(),
    data_nascimento: fieldMap.dataNascimento.value || null,
    telefone: fieldMap.telefone.value.trim(),
    email: fieldMap.email.value.trim() || null,
    consentimento_privacidade: fieldMap.consentimentoPrivacidade.checked,
    prazo_meta: fieldMap.prazoMeta.value.trim() || null,
    informacoes_adicionais: fieldMap.informacoesAdicionais.value.trim() || null,
    respostas_json: {
      ...radioSelections,
      nomeCompleto: fieldMap.nomeCompleto.value.trim(),
      telefone: fieldMap.telefone.value.trim(),
      email: fieldMap.email.value.trim() || null,
      dataNascimento: fieldMap.dataNascimento.value || null,
      prazoMeta: fieldMap.prazoMeta.value.trim() || null,
      informacoesAdicionais: fieldMap.informacoesAdicionais.value.trim() || null,
    },
  };

  return payload;
}

function handleSubmit(event) {
  event.preventDefault();

  if (!validateForm()) {
    setStatus('Corrija os campos obrigatórios antes de enviar.', 'error');
    return;
  }

  if (!supabase) {
    setStatus('Configuração do Supabase ausente. Atualize as chaves antes de enviar o formulário.', 'error');
    return;
  }

  const payload = serializeFormData();
  submitButton.disabled = true;
  setStatus('Enviando anamnese...', '');

  supabase
    .from('alunos')
    .insert([
      {
        nome_completo: payload.nome_completo,
        telefone: payload.telefone,
        email: payload.email,
        data_nascimento: payload.data_nascimento,
      },
    ])
    .select('id')
    .single()
    .then(({ data: alunoData, error: alunoError }) => {
      if (alunoError) throw alunoError;

      const anamnesePayload = {
        aluno_id: alunoData.id,
        objetivo_principal: payload.respostas_json.objetivoPrincipal || null,
        experiencia_anterior: payload.respostas_json.nivelAtividade || null,
        frequencia_semanal: payload.respostas_json.compromissoSemanal || null,
        atividades_atuais: payload.respostas_json.preferenciaExercicio || null,
        lesoes_limitacoes: payload.respostas_json.localDor || null,
        condicoes_saude: payload.respostas_json.diagnostico || null,
        restricoes_medicas: payload.respostas_json.medicamentos || null,
        observacoes_relevantes: payload.respostas_json.informacoesAdicionais || null,
        rotina_trabalho: payload.respostas_json.ocupacao || null,
        qualidade_sono: payload.respostas_json.sono || null,
        habitos_relevantes: payload.respostas_json.alimentacao || null,
        peso: null,
        altura_cm: null,
        outras_medidas: payload.respostas_json.prazoMeta || null,
        consentimento_privacidade: payload.consentimento_privacidade,
        respostas_json: payload.respostas_json,
      };

      return supabase.from('anamneses').insert([anamnesePayload]).select('id').single();
    })
    .then(({ data, error }) => {
      if (error) throw error;
      if (data?.id) {
        form.reset();
        Object.values(fieldMap).forEach((field) => {
          if (field && field.type !== 'checkbox') {
            field.setAttribute('aria-invalid', 'false');
          }
        });
        setStatus('Anamnese enviada com sucesso. Em breve a personal trainer entrará em contato.', 'success');
      }
    })
    .catch((error) => {
      const message = error?.message || 'Não foi possível enviar a anamnese no momento. Tente novamente.';
      setStatus(message, 'error');
    })
    .finally(() => {
      submitButton.disabled = false;
    });
}

const formSteps = [...document.querySelectorAll('.form-step')];
const stepDots = [...document.querySelectorAll('.step-dot')];
const stepButtons = [...document.querySelectorAll('.step-next')];
const backButtons = [...document.querySelectorAll('.step-back')];

let currentStep = 1;
const totalSteps = formSteps.length;

function updateStepUI() {
  formSteps.forEach((step) => {
    const isActive = Number(step.dataset.step) === currentStep;
    step.classList.toggle('active', isActive);
  });

  stepDots.forEach((dot) => {
    const isActive = Number(dot.dataset.dot) === currentStep;
    dot.classList.toggle('active', isActive);
  });

  backButtons.forEach((button) => {
    button.hidden = currentStep === 1;
  });

  const isLastStep = currentStep === totalSteps;
  stepButtons.forEach((button) => {
    button.textContent = isLastStep ? 'Revisar envio' : 'Próximo';
  });
}

function getCurrentStepFields() {
  const currentStepElement = document.querySelector(`.form-step.active`);
  if (!currentStepElement) return [];

  return [...currentStepElement.querySelectorAll('input, textarea, select')].filter((element) => {
    return element.type !== 'hidden' && element.name;
  });
}

function validateCurrentStep() {
  const fields = getCurrentStepFields();
  let isValid = true;

  fields.forEach((field) => {
    const fieldName = field.name;
    if (!fieldName) return;

    if (fieldName === 'nomeCompleto' || fieldName === 'telefone' || fieldName === 'consentimentoPrivacidade') {
      if (!validateField(fieldName)) {
        isValid = false;
      }
    }
  });

  const consentWrapper = document.querySelector('#consentimentoPrivacidade');
  if (currentStep === totalSteps && consentWrapper && !consentWrapper.checked) {
    validateField('consentimentoPrivacidade');
    isValid = false;
  }

  return isValid;
}

function goToStep(stepNumber) {
  if (stepNumber < 1 || stepNumber > totalSteps) return;
  currentStep = stepNumber;
  updateStepUI();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

stepButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (!validateCurrentStep()) {
      setStatus('Revise os campos obrigatórios da etapa antes de continuar.', 'error');
      return;
    }

    goToStep(currentStep + 1);
    setStatus('', '');
  });
});

backButtons.forEach((button) => {
  button.addEventListener('click', () => {
    goToStep(currentStep - 1);
    setStatus('', '');
  });
});

form.addEventListener('submit', handleSubmit);

Object.entries(fieldMap).forEach(([fieldName, field]) => {
  if (!field) return;

  if (field.type === 'checkbox') {
    field.addEventListener('change', () => validateField(fieldName));
    return;
  }

  field.addEventListener('blur', () => validateField(fieldName));
  field.addEventListener('input', () => {
    if (field.getAttribute('aria-invalid') === 'true') {
      validateField(fieldName);
    }
  });
});

assertSupabaseReady();
updateStepUI();
