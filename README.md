# 🥋 Projeto Social TKD — API

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/JSON%20Web%20Tokens-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="Render" />
</p>

<p align="center">
  API REST para gestão de um projeto social de Taekwondo — cadastro de alunos, turmas, controle de presença, graduações e comunicados.
</p>

---

## 📋 Índice

- [Sobre o projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#️-tecnologias)
- [Arquitetura e estrutura de pastas](#️-arquitetura-e-estrutura-de-pastas)
- [Como executar localmente](#-como-executar-localmente)
- [Variáveis de ambiente](#-variáveis-de-ambiente)
- [Autenticação e perfis de usuário](#-autenticação-e-perfis-de-usuário)
- [Convenções da API](#-convenções-da-api)
- [Endpoints](#-endpoints)
- [Deploy](#️-deploy)
- [Status do projeto](#-status-do-projeto)
- [Autor](#-autor)

---

## 📖 Sobre o projeto

Backend desenvolvido para o app de gestão de uma academia/projeto social de Taekwondo, como parte de um trabalho acadêmico. A API cobre todo o ciclo de vida de um aluno no projeto: cadastro (inclusive de menores de idade, vinculados a um responsável), matrícula em turmas, registro de presença em aula, cálculo de frequência, histórico de graduação de faixas e comunicados publicados pela equipe.

O frontend (React Native + Expo + TypeScript) vive em um repositório separado e consome esta API via HTTP/JSON.

## ✨ Funcionalidades

- 👤 **Autenticação e perfis** — cadastro de responsável, aluno (menor ou maior de idade) e professor/admin, login por telefone + senha com JWT
- 🎓 **Alunos** — cadastro, atualização, ativação/desativação (soft delete) e controle de visibilidade por perfil
- 🏫 **Turmas e matrículas** — turmas com horários recorrentes por dia da semana, matrícula e encerramento de vínculo
- 📅 **Aulas e presenças** — controle de aulas previstas/realizadas/canceladas, registro de presença em lote (upsert) e cálculo de frequência/ranking sob demanda
- 🥋 **Faixas e graduação** — cadastro de faixas, histórico de graduação imutável e cálculo de frequência desde a última graduação
- 📢 **Comunicados e observações** — avisos publicados pela equipe (com controle de visualização) e observações individuais sobre o aluno, unificados numa timeline

## 🛠️ Tecnologias

| Categoria | Tecnologia | Uso |
|---|---|---|
| Runtime | **Node.js** | Ambiente de execução |
| Linguagem | **TypeScript** (ESM) | Tipagem estática, `module`/`moduleResolution: nodenext` |
| Framework | **Express 5** | Roteamento e middlewares HTTP |
| Banco de dados | **MySQL** (`mysql2/promise`) | Persistência, via pool de conexões e prepared statements |
| Autenticação | **jsonwebtoken** | Emissão/validação de tokens JWT |
| Criptografia | **bcrypt** | Hash de senhas |
| Segurança | **helmet**, **cors**, **express-rate-limit** | Headers de segurança, CORS e limitação de requisições |
| Dev tooling | **tsx**, **dotenv** | Hot-reload em desenvolvimento e variáveis de ambiente |
| Deploy | **Render** | Hospedagem da API em produção |

## 🏗️ Arquitetura e estrutura de pastas

A API segue uma arquitetura em camadas: toda requisição passa por **rota → middleware → controller → model**, nessa ordem. Só a camada de `models` toca o banco de dados.

```
src/
├── app.ts                     # express() + helmet/cors/rate-limit + rotas + errorHandler
├── server.ts                  # sobe o app (app.listen)
├── config/
│   ├── env.ts                 # lê e valida variáveis de ambiente
│   └── db.ts                  # pool de conexão mysql2/promise
├── types/
│   ├── auth.ts                # tipo Perfil, JwtPayload, constante de perfil admin/professor
│   └── express.d.ts           # estende o tipo Request do Express, adicionando req.user
├── utils/
│   ├── password.ts            # hash e comparação de senha (bcrypt)
│   ├── jwt.ts                 # geração e verificação de token
│   ├── age.ts                 # cálculo de idade
│   ├── validacao.ts           # validação de data (DD/MM/AAAA → ISO) e horário
│   └── asyncHandler.ts        # wrapper para rotas assíncronas
├── models/                    # acesso a dados — uma tabela por arquivo
├── middlewares/
│   ├── verifyToken.ts         # exige Bearer token válido
│   ├── optionalAuth.ts        # popula req.user se houver token, sem exigir
│   ├── checkRole.ts           # restringe por perfil
│   └── errorHandler.ts        # tratamento de erro global
├── controllers/                # regras de negócio de cada módulo
└── routes/                     # define URL + método + middlewares de cada rota
```

## 🚀 Como executar localmente

### Pré-requisitos

- Node.js 20+
- Acesso a um banco MySQL (local ou remoto)

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/<seu-usuario>/projeto-social-tkd-api.git
cd projeto-social-tkd-api

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# edite o .env com os dados reais do seu banco

# 4. Suba em modo desenvolvimento (hot-reload)
npm run dev

# 5. Ou gere o build de produção e rode
npm run build
npm start
```

A API sobe por padrão em `http://localhost:3000`.

## 🔐 Variáveis de ambiente

Baseado no `.env.example` do repositório:

| Variável | Descrição |
|---|---|
| `PORT` | Porta em que a API escuta (padrão `3000`) |
| `DB_HOST` | Host do banco MySQL |
| `DB_PORT` | Porta do banco MySQL (padrão `3306`) |
| `DB_USER` | Usuário do banco |
| `DB_PASSWORD` | Senha do banco |
| `DB_NAME` | Nome do schema/banco |
| `JWT_SECRET` | Valor usado para assinar os tokens JWT |
| `JWT_EXPIRES_IN` | Validade do token (ex: `1d`) |

## 🔑 Autenticação e perfis de usuário

A autenticação é feita por **telefone + senha** (nunca e-mail), retornando um JWT que deve ser enviado em `Authorization: Bearer <token>` em toda rota protegida.

| Perfil | Descrição | Acesso |
|---|---|---|
| `PROFESSOR` | Cobre admin e professor | Acesso total — único perfil que cria/edita/desativa qualquer recurso |
| `RESPONSAVEL` | Responsável por aluno(s) menor(es) | Só visualiza os dados dos alunos vinculados a ele |
| `ALUNO` | Aluno maior de idade, autocadastrado | Só visualiza os próprios dados |

Um aluno **menor de idade nunca tem login próprio** — é sempre o responsável que autentica e gerencia os dados dos alunos vinculados a ele.

## 🧩 Convenções da API

- **Envelope de resposta:** toda resposta de sucesso vem numa chave nomeada pelo recurso — `{ aluno }`, `{ turmas }`, `{ faixa }` — nunca um objeto solto na raiz.
- **Datas:** toda data enviada no corpo/query da requisição usa o formato brasileiro `DD/MM/AAAA`; as respostas devolvem datas em ISO 8601.
- **Erros:** sempre no formato `{ "message": "..." }`, com o HTTP status apropriado (`400`, `401`, `403`, `404`, `409`).
- **Exclusão:** a grande maioria dos recursos usa soft delete (`ativo=false`) em vez de exclusão física — histórico de presença e graduação precisa sobreviver.

## 📡 Endpoints

<details>
<summary><strong>Autenticação</strong> — <code>/auth</code></summary>

| Método | Rota | Proteção | Descrição |
|---|---|---|---|
| `POST` | `/auth/register/responsavel` | Pública | Cadastra um responsável |
| `POST` | `/auth/register/aluno` | Pública (maior) / Bearer do responsável (menor) | Cadastra um aluno — comportamento muda conforme a idade |
| `POST` | `/auth/register/admin-professor` | `PROFESSOR` | Cadastra outro admin/professor |
| `POST` | `/auth/login` | Pública | Autentica por telefone + senha, devolve o token |
| `GET` | `/auth/me` | Autenticado | Retorna o usuário do token |

</details>

<details>
<summary><strong>Alunos</strong> — <code>/alunos</code></summary>

| Método | Rota | Proteção | Descrição |
|---|---|---|---|
| `GET` | `/alunos` | `PROFESSOR` | Lista todos os alunos (`?ativo=true/false`) |
| `GET` | `/alunos/:id` | Autenticado | Detalhe de um aluno |
| `PATCH` | `/alunos/:id` | `PROFESSOR` | Atualiza cadastro |
| `PATCH` | `/alunos/:id/status` | `PROFESSOR` | Ativa/desativa o aluno |
| `GET` | `/alunos/:id/frequencia` | Autenticado | Percentual de presença calculado sob demanda |

</details>

<details>
<summary><strong>Turmas e matrículas</strong> — <code>/turmas</code>, <code>/matriculas</code></summary>

| Método | Rota | Proteção | Descrição |
|---|---|---|---|
| `POST` | `/turmas` | `PROFESSOR` | Cria turma + horários |
| `GET` | `/turmas` | Autenticado | Lista turmas ativas |
| `GET` | `/turmas/:id` | Autenticado | Detalhe da turma com horários |
| `PATCH` | `/turmas/:id` | `PROFESSOR` | Atualiza turma/horários |
| `GET` | `/turmas/:id/ranking` | `PROFESSOR` | Ranking de frequência da turma |
| `POST` | `/matriculas` | `PROFESSOR` | Matricula aluno numa turma |
| `GET` | `/matriculas?aluno_id=` | Autenticado | Matrículas de um aluno |
| `GET` | `/matriculas?turma_id=` | `PROFESSOR` | Matrículas ativas de uma turma |
| `PATCH` | `/matriculas/:id/encerrar` | `PROFESSOR` | Encerra uma matrícula |

</details>

<details>
<summary><strong>Aulas e presenças</strong> — <code>/aulas</code></summary>

| Método | Rota | Proteção | Descrição |
|---|---|---|---|
| `POST` | `/aulas` | `PROFESSOR` | Cria uma aula prevista |
| `GET` | `/aulas?turma_id=&data_inicio=&data_fim=` | Autenticado | Lista aulas de uma turma |
| `GET` | `/aulas/:id` | Autenticado | Detalhe da aula |
| `PATCH` | `/aulas/:id/cancelar` | `PROFESSOR` | Cancela a aula |
| `POST` | `/aulas/:id/presencas` | `PROFESSOR` | Registra a chamada (upsert) |
| `GET` | `/aulas/:id/presencas` | `PROFESSOR` | Lista presenças da aula |

</details>

<details>
<summary><strong>Faixas e graduação</strong> — <code>/faixas</code></summary>

| Método | Rota | Proteção | Descrição |
|---|---|---|---|
| `POST` | `/faixas` | `PROFESSOR` | Cria uma faixa |
| `GET` | `/faixas` | Autenticado | Lista faixas ativas |
| `PATCH` | `/faixas/:id` | `PROFESSOR` | Atualiza/desativa uma faixa |
| `POST` | `/alunos/:id/graduacao` | `PROFESSOR` | Registra graduação do aluno |
| `GET` | `/alunos/:id/historico-faixas` | Autenticado | Histórico completo de graduações |
| `GET` | `/alunos/:id/faixa-atual/aulas` | Autenticado | Frequência desde a última graduação |

</details>

<details>
<summary><strong>Comunicados e observações</strong> — <code>/comunicados</code></summary>

| Método | Rota | Proteção | Descrição |
|---|---|---|---|
| `POST` | `/comunicados` | `PROFESSOR` | Publica um comunicado |
| `GET` | `/comunicados` | Autenticado | Lista comunicados ativos |
| `GET` | `/comunicados/:id` | Autenticado | Detalhe do comunicado |
| `PATCH` | `/comunicados/:id` | `PROFESSOR` | Edita um comunicado |
| `DELETE` | `/comunicados/:id` | `PROFESSOR` | Remove (soft delete) um comunicado |
| `POST` | `/comunicados/:id/visualizar` | Autenticado | Marca comunicado como visto |
| `POST` | `/alunos/:id/observacoes` | `PROFESSOR` | Registra observação sobre o aluno |
| `GET` | `/alunos/:id/observacoes` | Autenticado | Lista observações do aluno |
| `GET` | `/alunos/:id/timeline` | Autenticado | Observações + comunicados numa lista só |

</details>

<details>
<summary><strong>Diagnóstico</strong></summary>

| Método | Rota | Proteção | Descrição |
|---|---|---|---|
| `GET` | `/test-db` | Pública | Verifica a conexão com o banco |

</details>

## ☁️ Deploy

A API está publicada em produção no [Render](https://render.com):

```
https://projeto-social-tkd-api.onrender.com
```

> ⚠️ No plano gratuito, o serviço "dorme" após um período de inatividade — a primeira requisição após esse período pode levar alguns segundos para responder.

## ✅ Status do projeto

- [x] Autenticação e usuários
- [x] Alunos, turmas e matrículas
- [x] Aulas e presenças
- [x] Faixas e histórico de graduação
- [x] Comunicados e observações
