# SemEval-2026 Task 12 — Abductive Event Reasoning using ALBERT

## 📌 Overview

This project explores **SemEval-2026 Task 12: Abductive Event Reasoning (AER)**, a natural language processing task focused on identifying plausible causes of real-world events from contextual evidence and candidate explanations.

The project uses **ALBERT (A Lite BERT)**, a lightweight transformer-based language model, to learn contextual representations and reason about relationships between events and their potential causes. The model was applied to the task of distinguishing plausible causal explanations from distractors.

The implemented approach achieved **96% accuracy** on the evaluated dataset.

## 🎯 Objectives

- Apply transformer-based NLP techniques to abductive reasoning.
- Explore contextual language understanding using ALBERT.
- Identify plausible causal relationships between events.
- Evaluate model performance on an event-reasoning dataset.

## ⚙️ Methodology

1. **Data Preparation:** Process the dataset containing target events, contextual evidence, and candidate explanations.
2. **Tokenization:** Convert text into tokenized inputs compatible with the ALBERT tokenizer.
3. **Model Fine-Tuning:** Adapt the pretrained ALBERT model to the task-specific prediction objective.
4. **Prediction:** Evaluate candidate explanations using the trained model.
5. **Evaluation:** Measure predictive performance and analyze the model's ability to identify plausible causes.

## 📊 Results

| Metric | Value |
|---|---|
| Task | SemEval-2026 Task 12 |
| Domain | Abductive Event Reasoning |
| Model | ALBERT |
| Reported Accuracy | **96%** |

## 🛠️ Tech Stack

- Python
- ALBERT
- Hugging Face Transformers
- PyTorch
- Scikit-learn

## 🧠 Key Learnings

- Transformer-based natural language understanding.
- Fine-tuning pretrained language models for downstream NLP tasks.
- Text preprocessing and tokenization.
- Causal reasoning and semantic relationship analysis.
- Model evaluation and performance analysis.

## 🚀 Future Improvements

- Evaluate precision, recall, and F1-score.
- Compare ALBERT with other transformer architectures.
- Analyze errors involving semantically related but non-causal explanations.
- Improve generalization across different event contexts.

## 📚 Reference

Official task: https://semeval.github.io/SemEval2026/tasks

---

*An NLP project investigating transformer-based approaches to abductive event reasoning using ALBERT.*
