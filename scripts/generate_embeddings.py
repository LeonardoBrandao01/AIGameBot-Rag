"""
generate_embeddings.py
======================
Script para gerar embeddings da planilha de gamificação
usando a API do Google AI Studio (text-embedding-004).

USO:
    pip install google-genai openpyxl pandas python-dotenv
    python generate_embeddings.py --input dados_gamificacao.xlsx --output embeddings.json
"""

import argparse
import json
import os
import time

from google import genai
from google.genai import types
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

EMBED_MODEL = "gemini-embedding-001"


def setup_google_ai():
    api_key = os.getenv("GOOGLE_API_KEY", "").strip()
    if not api_key:
        raise ValueError(
            "GOOGLE_API_KEY não encontrada!\n"
            "1. Acesse: https://aistudio.google.com/app/apikey\n"
            "2. Crie sua chave de API\n"
            "3. Defina no arquivo .env como: GOOGLE_API_KEY=sua_chave\n"
            "   ATENÇÃO: não use aspas, não deixe espaços!"
        )

    client = genai.Client(api_key=api_key)
    print(f"✅ Google AI configurado. Modelo: {EMBED_MODEL}")
    return client


def load_spreadsheet(path: str) -> pd.DataFrame:
    """Lê .xlsx ou .csv e retorna DataFrame."""
    ext = os.path.splitext(path)[-1].lower()
    if ext in [".xlsx", ".xls"]:
        df = pd.read_excel(path)
    elif ext == ".csv":
        df = pd.read_csv(path)
    else:
        raise ValueError(f"Formato não suportado: {ext}")

    print(f"📊 Planilha carregada: {len(df)} linhas × {len(df.columns)} colunas")
    print(f"   Colunas: {list(df.columns)}")
    return df


def row_to_text(row: pd.Series, cols: list) -> str:
    """Converte uma linha do DataFrame em texto para embedding."""
    parts = []
    for col in cols:
        val = row.get(col, "")
        if pd.notna(val) and str(val).strip():
            parts.append(f"{col}: {str(val).strip()}")
    return " | ".join(parts)


def generate_embedding(client: genai.Client, text: str) -> list:
    """Gera embedding via Google AI Studio (novo SDK google-genai)."""
    result = client.models.embed_content(
        model=EMBED_MODEL,
        contents=text,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
    )
    # O novo SDK retorna EmbedContentResponse com campo 'embeddings'
    if hasattr(result, 'embeddings') and result.embeddings:
        return list(result.embeddings[0].values)
    # Fallback: campo embedding direto
    return list(result.embedding.values)


def main():
    parser = argparse.ArgumentParser(description="Gera embeddings a partir de planilha")
    parser.add_argument("--input",  "-i", default="dados_gamificacao.xlsx", help="Caminho da planilha")
    parser.add_argument("--output", "-o", default="embeddings.json",        help="Arquivo de saída")
    parser.add_argument("--delay",  "-d", type=float, default=0.5,          help="Delay entre chamadas (s)")
    args = parser.parse_args()

    # ── Setup ──────────────────────────────────────────────────────────────────
    client = setup_google_ai()
    df = load_spreadsheet(args.input)

    # Usa todas as colunas por padrão
    text_cols = list(df.columns)

    # ── Geração de embeddings ──────────────────────────────────────────────────
    records = []
    errors  = []

    for idx, (_, row) in enumerate(df.iterrows()):
        text = row_to_text(row, text_cols)
        if not text.strip():
            print(f"  ⚠ Linha {idx+1} vazia — ignorada.")
            continue

        try:
            print(f"  [{idx+1}/{len(df)}] Gerando embedding...", end=" ")
            embedding = generate_embedding(client, text)
            records.append({
                "id":        str(idx),
                "text":      text,
                "embedding": embedding,
                "metadata":  {col: str(row.get(col, "")) for col in text_cols},
            })
            print(f"✅ ({len(embedding)} dims)")
        except Exception as e:
            print(f"❌ Erro: {e}")
            errors.append({"index": idx, "error": str(e)})

        time.sleep(args.delay)

    # ── Salvamento ─────────────────────────────────────────────────────────────
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*50}")
    print(f"✅ Embeddings salvos: {args.output}")
    print(f"   Total gerados : {len(records)}")
    print(f"   Erros         : {len(errors)}")
    if errors:
        print(f"   Linhas com erro: {[e['index'] for e in errors]}")
    print(f"{'='*50}")
    print("\nPróximo passo: o arquivo embeddings.json já foi salvo na pasta backend/.")
    print("Agora execute: cd ../backend && python app.py")


if __name__ == "__main__":
    main()
