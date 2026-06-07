# Tutorial de Deploy — GamBot RAG

Este guia cobre as três etapas necessárias para colocar o projeto online:

1. Publicar o código no GitHub
2. Fazer deploy do backend no Render
3. Fazer deploy do frontend no Vercel

---

## Pré-requisitos

- Conta no [GitHub](https://github.com)
- Conta no [Render](https://render.com) (backend) — plano gratuito disponível
- Conta no [Vercel](https://vercel.com) (frontend) — plano gratuito disponível
- `git` instalado localmente
- Projeto funcionando localmente (embeddings gerados, backend e frontend testados)

---

## Etapa 1 — Publicar o código no GitHub

### 1.1 — Criar o repositório

1. Acesse [github.com/new](https://github.com/new)
2. Preencha:
   - **Repository name:** `gambot-rag`
   - **Visibility:** Public ou Private
   - **NÃO** marque "Add a README" (já temos um)
3. Clique em **Create repository**

### 1.2 — Verificar o `.gitignore`

Antes de commitar, confirme que os seguintes arquivos **não** serão enviados:

```
backend/.env          ← contém sua API key
scripts/.env          ← contém sua API key
backend/chroma_db/    ← banco vetorial local (recriado no servidor)
node_modules/
```

O arquivo `backend/embeddings.json` **deve** ser incluído no repositório — o servidor de deploy vai precisar dele.

### 1.3 — Fazer o primeiro commit e push

Execute no terminal, dentro da pasta `gambot-rag/`:

```bash
git init
git add .
git commit -m "feat: projeto GamBot RAG inicial"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/gambot-rag.git
git push -u origin main
```

> Substitua `SEU_USUARIO` pelo seu nome de usuário do GitHub.

Confirme no GitHub que os arquivos `.env` **não aparecem** na listagem.

---

## Etapa 2 — Deploy do Backend no Render

### 2.1 — Criar o Web Service

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Clique em **New → Web Service**
3. Conecte sua conta do GitHub e selecione o repositório `gambot-rag`
4. Configure:

| Campo              | Valor                                              |
|--------------------|----------------------------------------------------|
| **Name**           | `gambot-api` (ou o nome que preferir)              |
| **Root Directory** | `backend`                                          |
| **Runtime**        | Python 3                                           |
| **Build Command**  | `pip install -r requirements.txt`                  |
| **Start Command**  | `gunicorn app:app --bind 0.0.0.0:$PORT`            |

### 2.2 — Configurar variáveis de ambiente

Na seção **Environment Variables**, adicione:

| Chave            | Valor                             |
|------------------|-----------------------------------|
| `GOOGLE_API_KEY` | Sua chave do Google AI Studio     |
| `PYTHON_VERSION` | `3.11.0`                          |

> **Não** defina `PORT` — o Render injeta essa variável automaticamente.

### 2.3 — Fazer o deploy

Clique em **Create Web Service**. O Render vai:

1. Clonar o repositório
2. Rodar `pip install -r requirements.txt`
3. Iniciar o servidor com gunicorn

O processo leva cerca de 2–4 minutos. Ao final, você verá uma URL como:

```
https://gambot-api.onrender.com
```

### 2.4 — Testar o backend em produção

```bash
curl https://gambot-api.onrender.com/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "documents_in_db": 35,
  "embed_model": "gemini-embedding-001",
  "gen_model": "gemini-2.5-flash-lite"
}
```

> **Atenção — plano gratuito do Render:** o servidor "dorme" após 15 minutos de inatividade. A primeira requisição após o sleep pode demorar 30–60 segundos.

---

## Etapa 3 — Deploy do Frontend no Vercel

### 3.1 — Importar o projeto

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Clique em **Import Git Repository**
3. Conecte sua conta do GitHub e selecione o repositório `gambot-rag`
4. Configure:

| Campo              | Valor                  |
|--------------------|------------------------|
| **Framework**      | Create React App       |
| **Root Directory** | `frontend`             |
| **Build Command**  | `npm run build`        |
| **Output Dir**     | `build`                |

### 3.2 — Configurar variável de ambiente

Na seção **Environment Variables**, adicione:

| Chave                | Valor                                      |
|----------------------|--------------------------------------------|
| `REACT_APP_API_URL`  | URL do backend no Render (sem barra final) |

Exemplo:
```
REACT_APP_API_URL=https://gambot-api.onrender.com
```

### 3.3 — Fazer o deploy

Clique em **Deploy**. O Vercel vai compilar o React e publicar o site. Ao final, você verá uma URL como:

```
https://gambot-rag.vercel.app
```

### 3.4 — Testar o frontend em produção

Acesse a URL gerada pelo Vercel e verifique se:

- A sidebar carrega com status "Online"
- A contagem de documentos aparece (35)
- O chat responde às perguntas

---

## Possíveis problemas e soluções

### Backend não encontra `embeddings.json`

O arquivo `embeddings.json` precisa estar no repositório (na pasta `backend/`). Verifique se o `.gitignore` não está excluindo esse arquivo — por padrão, a linha que o exclui está comentada.

Se o arquivo for grande demais para o Git, use o endpoint `/load` via POST para recarregar manualmente após o deploy.

### Erro CORS no frontend em produção

Se o frontend em produção não conseguir falar com o backend, verifique:

1. A variável `REACT_APP_API_URL` está correta (sem `/` no final)
2. O backend está online — acesse `/health` diretamente
3. O Flask-CORS está instalado — ele já está no `requirements.txt`

### ChromaDB recriado vazio no Render

O Render não persiste arquivos em disco entre deploys no plano gratuito. Para manter os dados:

**Opção A (recomendada):** Manter `embeddings.json` no repositório. O backend carrega os vetores na memória do ChromaDB a cada inicialização — é mais lento para iniciar, mas funciona no plano gratuito.

**Opção B:** Usar um volume persistente no Render (plano pago) apontando `CHROMA_PATH` para o volume.

### Render em sleep — timeout no frontend

No plano gratuito, o backend dorme após inatividade. O frontend pode mostrar erro de conexão na primeira requisição. Uma solução simples é fazer um "ping" ao `/health` no carregamento da página para acordar o servidor antes do usuário enviar uma pergunta.

---

## Atualizando o deploy

Após fazer alterações no código:

```bash
git add .
git commit -m "fix: descrição da alteração"
git push origin main
```

- **Render** faz redeploy automaticamente ao detectar push na branch `main`
- **Vercel** também faz redeploy automaticamente

---

## Checklist final

- [ ] Repositório no GitHub criado e código enviado
- [ ] Arquivos `.env` **não** aparecem no repositório
- [ ] `backend/embeddings.json` está no repositório
- [ ] Backend rodando no Render com status `ok`
- [ ] Variável `REACT_APP_API_URL` configurada no Vercel
- [ ] Frontend acessível via URL do Vercel
- [ ] Chat respondendo perguntas sobre gamificação
