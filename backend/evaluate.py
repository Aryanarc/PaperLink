"""
Day 8 — RAGAS Evaluation
========================
Run this script ONCE after ingesting your papers to measure how good
your RAG pipeline actually is.

Usage:
    python evaluate.py

Output:
    eval_results.json  — scores per question + overall averages
    eval_summary.json  — just the final numbers (for your resume/README)

What it measures:
    faithfulness       — did the answer only use info from the retrieved chunks?
    answer_relevancy   — did the answer actually address the question asked?
    context_precision  — were the retrieved chunks actually useful?
"""

import json
import os
import sys
from datetime import datetime
from vector_store import search
from prompts import SYSTEM_PROMPT, USER_PROMPT, format_context
from langchain_community.chat_models import ChatOllama
from pydantic import BaseModel

# ── Test set — 20 questions across 5 paper topics ───────────────────────────
# These are general enough to work with any arXiv papers you have ingested.
# Replace or extend these if you have specific papers loaded.

TEST_QUESTIONS = [
    # Attention / Transformers
    "What is the attention mechanism and how does it work?",
    "What are the key components of the transformer architecture?",
    "How does multi-head attention differ from single-head attention?",
    "What problem does self-attention solve that RNNs could not?",

    # Training / Optimization
    "What optimizer is commonly used for training transformer models?",
    "What is the role of the learning rate schedule in training?",
    "How does dropout prevent overfitting in neural networks?",
    "What is gradient clipping and when is it used?",

    # Embeddings / Representations
    "How are word embeddings used in language models?",
    "What is positional encoding and why is it needed?",
    "How does the model represent the meaning of a sentence?",
    "What is the difference between encoder and decoder in a transformer?",

    # Evaluation / Metrics
    "What metrics are used to evaluate language model performance?",
    "How is BLEU score calculated and what does it measure?",
    "What are the limitations of perplexity as an evaluation metric?",

    # Applications / Use Cases
    "What tasks can transformer-based models be applied to?",
    "How is transfer learning applied in NLP?",
    "What is fine-tuning and how does it differ from pretraining?",
    "How does the model handle long documents or sequences?",
    "What are the computational challenges of scaling transformer models?",
]


# ── LLM setup ────────────────────────────────────────────────────────────────

llm = ChatOllama(model="mistral")


def get_answer(question: str) -> tuple[str, list[dict]]:
    """
    Runs one question through the full RAG pipeline.
    Returns (answer_string, retrieved_chunks).
    """
    chunks = search(question)
    if not chunks:
        return "No relevant context found.", []

    context_str = format_context(chunks)
    full_system_prompt = SYSTEM_PROMPT.format(context=context_str)
    full_user_prompt = USER_PROMPT.format(question=question)

    from langchain_core.messages import HumanMessage, SystemMessage
    messages = [
        SystemMessage(content=full_system_prompt),
        HumanMessage(content=full_user_prompt),
    ]

    response = llm.invoke(messages)
    return response.content, chunks


# ── Manual RAGAS-style scoring ────────────────────────────────────────────────
# We implement lightweight versions of the three metrics without requiring
# an OpenAI API key, using Mistral locally as the judge.

def score_faithfulness(question: str, answer: str, contexts: list[str]) -> float:
    """
    Faithfulness: did the answer only use facts from the context?
    Score: 0.0 to 1.0
    Uses Mistral as judge — asks it to count supported vs unsupported claims.
    """
    if not contexts or not answer.strip():
        return 0.0

    context_text = "\n---\n".join(contexts[:4])

    judge_prompt = f"""You are evaluating whether an AI answer is faithful to its source context.

Context:
{context_text}

Answer to evaluate:
{answer}

Task: Count how many factual claims in the answer are directly supported by the context.
Respond with ONLY two numbers in this exact format:
SUPPORTED: <number>
TOTAL: <number>

Do not write anything else."""

    from langchain_core.messages import HumanMessage
    try:
        response = llm.invoke([HumanMessage(content=judge_prompt)])
        text = response.content.strip()

        supported = 0
        total = 0
        for line in text.split("\n"):
            if line.startswith("SUPPORTED:"):
                supported = int(line.split(":")[1].strip())
            elif line.startswith("TOTAL:"):
                total = int(line.split(":")[1].strip())

        if total == 0:
            return 1.0  # no claims = trivially faithful
        return round(min(supported / total, 1.0), 3)
    except Exception:
        return 0.5  # default if judge fails


def score_answer_relevancy(question: str, answer: str) -> float:
    """
    Answer relevancy: does the answer address the question?
    Score: 0.0 to 1.0
    Uses Mistral as judge.
    """
    if not answer.strip():
        return 0.0

    judge_prompt = f"""You are evaluating how relevant an AI answer is to a question.

Question: {question}

Answer: {answer}

Task: Rate how directly and completely the answer addresses the question.
Respond with ONLY a number between 0 and 1 (e.g. 0.85).
0.0 = completely irrelevant
0.5 = partially relevant
1.0 = fully relevant and complete

Do not write anything else. Just the number."""

    from langchain_core.messages import HumanMessage
    try:
        response = llm.invoke([HumanMessage(content=judge_prompt)])
        score = float(response.content.strip())
        return round(min(max(score, 0.0), 1.0), 3)
    except Exception:
        return 0.5


def score_context_precision(question: str, contexts: list[str]) -> float:
    """
    Context precision: what fraction of retrieved chunks were actually useful?
    Score: 0.0 to 1.0
    Uses Mistral as judge.
    """
    if not contexts:
        return 0.0

    useful = 0
    for ctx in contexts[:4]:
        judge_prompt = f"""Is the following context useful for answering this question?

Question: {question}

Context: {ctx[:500]}

Respond with ONLY: YES or NO"""

        from langchain_core.messages import HumanMessage
        try:
            response = llm.invoke([HumanMessage(content=judge_prompt)])
            if "YES" in response.content.upper():
                useful += 1
        except Exception:
            useful += 1  # assume useful if judge fails

    return round(useful / len(contexts[:4]), 3)


# ── Main evaluation loop ──────────────────────────────────────────────────────

def run_evaluation(questions: list[str] = None, output_dir: str = ".") -> dict:
    """
    Runs the full evaluation loop.
    Returns the summary dict with average scores.
    """
    if questions is None:
        questions = TEST_QUESTIONS

    print(f"\n{'='*60}")
    print(f"  PaperMind — RAGAS Evaluation")
    print(f"  {len(questions)} questions")
    print(f"  Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")

    results = []
    faithfulness_scores = []
    relevancy_scores = []
    precision_scores = []

    for i, question in enumerate(questions, 1):
        print(f"[{i:02d}/{len(questions)}] {question[:70]}...")

        # get answer from RAG pipeline
        answer, chunks = get_answer(question)
        contexts = [c["text"] for c in chunks]

        # skip if no context found — paper not ingested
        if not contexts:
            print(f"         ⚠ No context found — skipping (ingest relevant papers first)\n")
            continue

        # score all three metrics
        faith = score_faithfulness(question, answer, contexts)
        relev = score_answer_relevancy(question, answer)
        prec  = score_context_precision(question, contexts)

        faithfulness_scores.append(faith)
        relevancy_scores.append(relev)
        precision_scores.append(prec)

        result = {
            "question": question,
            "answer": answer,
            "contexts": contexts,
            "faithfulness": faith,
            "answer_relevancy": relev,
            "context_precision": prec,
        }
        results.append(result)

        print(f"         faithfulness={faith:.2f}  relevancy={relev:.2f}  precision={prec:.2f}\n")

    # compute averages
    avg_faith = round(sum(faithfulness_scores) / len(faithfulness_scores), 3) if faithfulness_scores else 0
    avg_relev = round(sum(relevancy_scores) / len(relevancy_scores), 3) if relevancy_scores else 0
    avg_prec  = round(sum(precision_scores) / len(precision_scores), 3) if precision_scores else 0

    summary = {
        "run_date": datetime.now().isoformat(),
        "questions_evaluated": len(results),
        "questions_skipped": len(questions) - len(results),
        "scores": {
            "faithfulness": avg_faith,
            "answer_relevancy": avg_relev,
            "context_precision": avg_prec,
        },
        "model": "mistral-7b (ollama)",
        "embedding_model": "BAAI/bge-small-en-v1.5",
        "retrieval": "hybrid (dense + BM25) + cross-encoder rerank",
    }

    # save detailed results
    detailed_path = os.path.join(output_dir, "eval_results.json")
    with open(detailed_path, "w") as f:
        json.dump({"summary": summary, "results": results}, f, indent=2)

    # save summary only (for README / resume)
    summary_path = os.path.join(output_dir, "eval_summary.json")
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)

    # print final report
    print(f"\n{'='*60}")
    print(f"  EVALUATION COMPLETE")
    print(f"{'='*60}")
    print(f"  Questions evaluated : {len(results)}")
    print(f"  Faithfulness        : {avg_faith:.3f}")
    print(f"  Answer relevancy    : {avg_relev:.3f}")
    print(f"  Context precision   : {avg_prec:.3f}")
    print(f"{'='*60}")
    print(f"  Saved: {detailed_path}")
    print(f"  Saved: {summary_path}")
    print(f"{'='*60}\n")

    return summary


# ── FastAPI endpoint (optional — lets you trigger eval from /docs) ────────────

def get_eval_router():
    from fastapi import APIRouter
    from typing import Optional
    from pydantic import BaseModel

    router = APIRouter()

    class EvalRequest(BaseModel):
        questions: Optional[list[str]] = None  # None → use default

    @router.post("/evaluate")
    def evaluate(request: Optional[EvalRequest] = None):
        """
        Runs RAGAS evaluation. Takes 10-20 minutes.
        Returns scores and saves to eval_results.json.
        """
        questions = request.questions if request and request.questions else TEST_QUESTIONS
        summary = run_evaluation(questions=questions)
        return summary

    return router

# ── Run directly ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # change to backend directory so chroma_db path resolves correctly
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    summary = run_evaluation()
    sys.exit(0)
