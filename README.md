# GamBot — Chatbot RAG de Gamificação

Chatbot com Retrieval-Augmented Generation (RAG) especializado em gamificação educacional.

---

## Estrutura do Projeto

```
gambot-rag/
├── backend/
│   ├── app.py               # API Flask principal
│   ├── requirements.txt     # Dependências Python
│   ├── Procfile             # Comando de start para deploy (Render/Azure)
│   ├── embeddings.json      # Vetores gerados pelo script (não versionar se grande)
│   ├── .env                 # Variáveis de ambiente (não versionar)
│   └── .env.example         # Modelo do .env
├── frontend/
│   ├── public/index.html
│   ├── src/
│   │   ├── App.js / App.css
│   │   ├── index.js / index.css
│   │   └── components/
│   │       ├── Sidebar.js / Sidebar.css
│   │       ├── ChatWindow.js / ChatWindow.css
│   │       ├── MessageBubble.js / MessageBubble.css
│   │       └── ChatInput.js / ChatInput.css
│   ├── package.json
│   └── .env.example
└── scripts/
    ├── generate_embeddings.py   # Gera embeddings da planilha
    ├── gamificacao.xlsx         # Planilha de dados (não versionar)
    └── .env                     # Chave de API para o script (não versionar)
```

---

## Stack

| Componente     | Tecnologia                          |
|----------------|-------------------------------------|
| Embeddings     | Google AI Studio — `gemini-embedding-001` (3072 dims) |
| LLM            | Google Gemini `gemini-2.5-flash-lite` |
| SDK Google     | `google-genai` >= 1.0.0             |
| Banco vetorial | ChromaDB (persistente)              |
| Backend        | Python 3.11+ · Flask 3 · Flask-CORS |
| Frontend       | React 18 · Create React App         |

---

## Particularidades

### Chave de API
A aplicação usa o novo SDK `google-genai` (≥ 1.0.0). **Não use** o pacote antigo `google-generativeai` — ele está descontinuado e não autentica corretamente com chaves no formato `AQ.`.

Obtenha sua chave em: https://aistudio.google.com/app/apikey

### Porta do backend no macOS
A porta 5000 é bloqueada pelo AirPlay Receiver no macOS. Suba o backend na porta 5001:
```bash
PORT=5001 python3 app.py
```
Em deploy (Render/Azure), a porta é definida automaticamente pela variável `PORT`.

### Geração de embeddings
Execute o script **uma única vez** antes de subir o backend:
```bash
cd scripts
pip install google-genai openpyxl pandas python-dotenv
python3 generate_embeddings.py --input gamificacao.xlsx --output ../backend/embeddings.json
```
O arquivo `embeddings.json` gerado deve ser incluído no repositório ou enviado manualmente ao servidor de deploy.

### Modelos utilizados
- **Embedding:** `gemini-embedding-001` — produz vetores de 3072 dimensões
- **Geração de texto:** `gemini-2.5-flash-lite` — verificar disponibilidade conforme plano da conta

### Endpoints da API

| Método | Endpoint  | Descrição                                     |
|--------|-----------|-----------------------------------------------|
| GET    | `/health` | Status do servidor e contagem de documentos   |
| POST   | `/chat`   | Recebe `{"message": "..."}` e retorna resposta RAG |
| POST   | `/load`   | Recarrega embeddings do disco (útil em dev)   |

### Sistema de XP
Cada pergunta respondida concede +25 XP ao usuário. O nível sobe a cada 100 XP acumulados. As conquistas são desbloqueadas localmente (sem persistência entre sessões).

---

## Arquivos que não devem ser versionados

Certifique-se de que o `.gitignore` cobre:

```
backend/.env
scripts/.env
backend/chroma_db/
__pycache__/
*.pyc
node_modules/
frontend/.env
```

---

*Projeto desenvolvido para TCC/Extensão — Gamificação Educacional com RAG*
