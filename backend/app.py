import os
import json
import chromadb
from google import genai
from google.genai import types
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# ── Configuração da API do Google ─────────────────────────────────────────────
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "").strip()
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY não definida. Configure no arquivo .env")

client = genai.Client(api_key=GOOGLE_API_KEY)

# ── ChromaDB (banco de vetores em memória / persistente) ───────────────────────
CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_db")
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = chroma_client.get_or_create_collection(
    name="gamificacao",
    metadata={"hnsw:space": "cosine"},
)

# ── Modelos ───────────────────────────────────────────────────────────────────
EMBED_MODEL  = "gemini-embedding-001"   # Google embedding model (novo SDK)
GEMINI_MODEL = "gemini-2.5-flash-lite"  # Modelo para gerar respostas


def embed_text(text: str) -> list:
    """Gera embedding via Google AI Studio (novo SDK google-genai)."""
    result = client.models.embed_content(
        model=EMBED_MODEL,
        contents=text,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
    )
    if hasattr(result, 'embeddings') and result.embeddings:
        return list(result.embeddings[0].values)
    return list(result.embedding.values)


def load_embeddings_to_chroma(path: str = "embeddings.json"):
    """Carrega embeddings pré-gerados no ChromaDB (só roda se a coleção estiver vazia)."""
    if collection.count() > 0:
        print(f"[ChromaDB] Coleção já populada com {collection.count()} documentos.")
        return

    if not os.path.exists(path):
        print(f"[ChromaDB] Arquivo '{path}' não encontrado — coleção ficará vazia.")
        return

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not data:
        print(f"[ChromaDB] Arquivo '{path}' está vazio — execute o script de embeddings primeiro.")
        return

    ids, embeddings, documents, metadatas = [], [], [], []
    for i, item in enumerate(data):
        ids.append(str(i))
        embeddings.append(item["embedding"])
        documents.append(item["text"])
        metadatas.append(item.get("metadata", {}))

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=documents,
        metadatas=metadatas,
    )
    print(f"[ChromaDB] {len(ids)} documentos carregados com sucesso.")


def retrieve_context(query: str, n_results: int = 5) -> list:
    """Busca os documentos mais similares à query."""
    query_embedding = embed_text(query)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        include=["documents", "metadatas", "distances"],
    )
    docs = []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        docs.append({"text": doc, "metadata": meta, "similarity": 1 - dist})
    return docs


def generate_answer(question: str, context_docs: list) -> str:
    """Gera resposta usando o Gemini com base no contexto recuperado."""
    context_text = "\n\n".join(
        [f"[{i+1}] {doc['text']}" for i, doc in enumerate(context_docs)]
    )

    prompt = f"""Você é o GamBot, assistente especialista em gamificação educacional e projetos acadêmicos.
Responda com base EXCLUSIVAMENTE no contexto abaixo. Se a informação não estiver no contexto, diga que não encontrou nos dados disponíveis.
Use linguagem motivadora, clara e didática. Você pode usar emojis relacionados a games (🎮 🏆 ⭐ 🚀 🎯).

CONTEXTO:
{context_text}

PERGUNTA DO USUÁRIO:
{question}

RESPOSTA:"""

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )
    return response.text


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "documents_in_db": collection.count(),
        "embed_model": EMBED_MODEL,
        "gen_model": GEMINI_MODEL,
    })


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    question = data.get("message", "").strip()

    if not question:
        return jsonify({"error": "Campo 'message' é obrigatório."}), 400

    if collection.count() == 0:
        return jsonify({
            "answer": "⚠️ O banco de dados ainda não foi populado. Por favor, carregue o arquivo embeddings.json.",
            "sources": [],
        })

    context_docs = retrieve_context(question)
    answer = generate_answer(question, context_docs)

    return jsonify({
        "answer": answer,
        "sources": [
            {"text": d["text"][:200] + "...", "similarity": round(d["similarity"], 3)}
            for d in context_docs
        ],
    })


@app.route("/load", methods=["POST"])
def load_data():
    """Endpoint para forçar recarga dos embeddings (útil em dev)."""
    data = request.get_json(silent=True) or {}
    path = data.get("path", "embeddings.json")
    try:
        chroma_client.delete_collection("gamificacao")
        globals()["collection"] = chroma_client.get_or_create_collection(
            name="gamificacao", metadata={"hnsw:space": "cosine"}
        )
        load_embeddings_to_chroma(path)
        return jsonify({"status": "ok", "documents": collection.count()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Carrega os embeddings no ChromaDB ao iniciar.
# Executado aqui (nível de módulo) para funcionar tanto com
# `python app.py` quanto com gunicorn (que não passa pelo bloco __main__).
load_embeddings_to_chroma()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=os.getenv("FLASK_DEBUG", "false") == "true")
