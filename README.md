# Sistema de Anamnese para Personal Trainer

Este projeto implementa uma solução web leve para coleta de anamneses iniciais e consulta administrativa em ambiente seguro, com foco em custo zero e uso de serviços gratuítos.

## Visão geral

- Página pública para envio de anamnese sem login do aluno.
- Painel administrativo protegido por autenticação do Supabase.
- Base de dados PostgreSQL com RLS e políticas estritas.
- Frontend estático para publicação em GitHub Pages.

## Estrutura do projeto

- `index.html` — landing page institucional.
- `anamnese.html` — formulário público.
- `login.html` — acesso restrito ao painel.
- `painel.html` — painel administrativo.
- `assets/css/` — estilos globais e específicos.
- `assets/js/` — configuração, cliente Supabase e scripts de página.
- `supabase/migrations/` — esquema SQL versionado.
- `.env.example` — exemplo de variáveis públicas.

## Requisitos

- Conta no Supabase.
- Projeto PostgreSQL criado no Supabase.
- Git para versionamento.
- GitHub Pages para hospedagem do frontend estático.

## Configuração do Supabase

1. Crie um projeto no Supabase.
2. Em `Project Settings > API`, copie:
   - `Project URL`
   - `anon public key`
3. Atualize os valores em `assets/js/config.js`.
4. Também copie os mesmos valores para `SUPABASE_URL` e `SUPABASE_ANON_KEY` no arquivo `.env` se quiser usar a configuração em ambiente local.
5. Crie a tabela de administradores no SQL editor do Supabase.
6. Em seguida execute as migrations contidas em `supabase/migrations/`.

## Primeiro administrador

Não crie usuários públicos no frontend. O primeiro administrador deve ser criado manualmente no Supabase.

Procedimento recomendado:

1. Acesse `Authentication > Users` no Supabase.
2. Clique em `Add user`.
3. Crie o usuário com e-mail e senha da personal trainer.
4. No SQL editor, insira o registro correspondente na tabela `administradores`.
5. Garanta que o campo `email` e o `user_id` correspondam ao usuário autenticado.
6. O painel usa `auth.uid()` para validar acesso. A autorização não depende apenas do frontend.

Exemplo SQL:

```sql
INSERT INTO public.administradores (user_id, email)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'seu-email@exemplo.com'
);
```

Substitua o UUID pelo ID real gerado no Supabase.

## Migrations

As migrations em `supabase/migrations/` implementam:

- tabela `administradores`
- tabela `alunos`
- tabela `anamneses`
- índices no campo de relacionamento
- políticas RLS para acesso restrito
- `created_at` para auditoria

Obs.: O formulário público pode inserir dados por `INSERT` apenas em `alunos` e `anamneses` com validação em camada confiável. No plano gratuito do Supabase, a proteção mais forte é a combinação de RLS + Edge Function/ambiente confiável para validação e rate limiting. O GitHub Pages não oferece proteção de backend, então o acesso a dados sensíveis continua restrito ao painel autenticado.

## Regras de segurança

- Jamais publique a `service_role` key no frontend ou no GitHub.
- A chave pública `anon` não substitui autenticação.
- O banco deve realizar todas as verificações de autorização por meio de RLS.
- Usuários anônimos não conseguem listar nem consultar registros privados.
- O formulário público faz inserções somente quando a política permite e com validação mínima no cliente/servidor.
- Não use `console.log` com dados sensíveis.
- GitHub Pages é hospedagem estática; não é apropriado para armazenar segredos ou lógica sensível.

## Execução local

1. Instale um servidor estático local, por exemplo:

```bash
python3 -m http.server 8000
```

2. Acesse no navegador:

```text
http://localhost:8000/
```

3. Atualize as credenciais do Supabase em `assets/js/config.js` antes de testar.

## Publicação no GitHub Pages

1. Crie um repositório GitHub.
2. Faça o push do código.
3. Em `Settings > Pages`, selecione a branch principal e a pasta raiz do site.
4. Habilite a opção de GitHub Pages.
5. Use o endereço gerado pela plataforma para compartilhar o formulário público.

Limitações relevantes:

- O GitHub Pages não executa backend.
- Ele não pode armazenar chaves secretas.
- Apenas o frontend estático pode ser hospedado ali.
- O painel administrativo deve continuar protegido por autenticação do Supabase e não depender do GitHub Pages como mecanismo de autorização.

## Checklist de implantação

- [ ] Criar projeto Supabase.
- [ ] Configurar URL e anon key.
- [ ] Aplicar migrations SQL.
- [ ] Criar usuário administrador no Supabase.
- [ ] Inserir administrador na tabela `administradores`.
- [ ] Validar login no painel.
- [ ] Testar envio anônimo do formulário público.
- [ ] Testar acesso sem autenticação ao painel.
- [ ] Validar consulta de dados autorizados.
- [ ] Publicar frontend no GitHub Pages.

## Observações importantes

- O sistema foi implementado em JavaScript puro para manter simplicidade e custo zero.
- Não foi realizada publicação real em serviços externos porque este workspace não contém credenciais válidas do Supabase.
- É necessário completar a configuração do projeto no Supabase para que a aplicação funcione plenamente.

## Deploy no Cloudflare (Pages + Worker) — passo a passo

Este projeto foi preparado para hospedar o frontend estático no **Cloudflare Pages** e o proxy protegido (que usa a `service_role` do Supabase) no **Cloudflare Workers**. Abaixo estão os passos mínimos para deploy em ambiente gratuito.

1) Preparar repositório
  - Commit e push do código para um repositório Git (GitHub, GitLab ou repositório conectado ao Pages).

2) Publicar o frontend no Cloudflare Pages
  - No painel Cloudflare → Pages → Create a project.
  - Conecte o repositório e escolha a branch que contém o site.
  - Build settings: como este projeto é estático, não é necessário comando de build (deixe vazio) e o diretório de saída é a raiz `/` ou `.` conforme a UI pedir.
  - Adicione variáveis de ambiente públicas caso precise (`SUPABASE_URL` e `SUPABASE_ANON_KEY` **não** são secretas para efeitos de leitura — você já tem `assets/js/config.js` configurado). Em produção prefira definir essas chaves como variáveis do Pages e injetá-las no build.
  - Deploy.

3) Preparar o Worker (proxy seguro)
  - O Worker em `cloudflare/worker.js` valida o `access_token` do usuário e consulta a API REST do Supabase com a `service_role` key no servidor.
  - No diretório `cloudflare/` você encontrará `worker.js`, `wrangler.example.toml` e `DEPLOY.md` com instruções.

4) Instalar e configurar Wrangler (na sua máquina)
  - Instale o cli `wrangler`:
```bash
npm install -g wrangler
```
  - Faça login:
```bash
wrangler login
```

5) Ajustar `wrangler.toml` e adicionar secrets
  - Copie `cloudflare/wrangler.example.toml` para `cloudflare/wrangler.toml` e configure `account_id` (encontrado no painel Cloudflare → Overview).
  - Adicione as secrets (na pasta `cloudflare`):
```bash
wrangler secret put SUPABASE_SERVICE_KEY
# cole a service_role key (sb_secret_...)
wrangler secret put SUPABASE_URL
# cole o https://<project>.supabase.co
wrangler secret put ADMIN_EMAILS
# opcional: admin1@example.com,admin2@example.com
```

6) Publicar o Worker
```bash
# dentro da pasta cloudflare
wrangler publish
```

7) Conectar Pages → Worker
  - Se preferir manter o Worker no mesmo domínio do Pages, configure uma rota na seção Workers → Routes apontando `https://<your-domain>/admin/*` para o Worker.
  - Alternativamente, chame o Worker pelo seu subdomínio `workers.dev` diretamente (ex.: `https://formulario-anamnese-worker.<your-subdomain>.workers.dev/admin/alunos`).

8) CORS e Allowed Origins
  - No Supabase Dashboard → Auth → Settings, adicione o domínio do Pages e o domínio do Worker (`workers.dev` ou seu domínio custom) em Allowed Origins / Site URL.
  - O Worker já retorna cabeçalhos `Access-Control-Allow-Origin` para facilitar chamadas do browser.

9) Testes finais
  - Abra o Pages URL e faça login no `login.html` com um usuário administrador criado no Supabase.
  - No painel, o browser obtém o `access_token` via Supabase e chama `/admin/alunos` no Worker (ou rota que apontar para o Worker).
  - Verifique logs do Worker (painel Cloudflare → Workers → Logs) e console DevTools do navegador (Network) para depurar possíveis 401/403.

10) Boas práticas e segurança
  - Nunca coloque a `SUPABASE_SECRET_KEY` em código público. Use `wrangler secret put` ou variáveis de ambiente do host.
  - Mantenha `ADMIN_EMAILS` configurado para limitar quem pode obter dados administrativos.
  - Use RLS (Row Level Security) e políticas no Supabase para garantir que mesmo se alguém chamar a API REST diretamente, não terá acesso indevido.

Se quiser, eu monto o `wrangler.toml` final (eu preciso do `account_id`) e te envio os comandos exatos. Caso prefira, posso te guiar por telefone/terminal passo a passo enquanto você publica.
Atualizando
