# SemEval-2026 Task 12: Abductive Event Reasoning (AER)
## Multi-Answer ALBERT Modeling, Error Calibration & Research Evaluation Web Application

An interactive, production-grade web application and research dashboard for **SemEval-2026 Task 12: Abductive Event Reasoning (AER)**, built on top of the fine-tuned multi-answer **ALBERT** (`albert-base-v2`) pipeline developed in `file.ipynb`.

---

## 🚀 Quickstart

Run the server with Python 3:

```bash
python3 app.py
```

Then open your browser at:
👉 **[http://127.0.0.1:5005](http://127.0.0.1:5005)**

*(No compilation, Node.js build step, or complex dependencies required! Runs immediately using lightweight Flask and browser-native CDN assets).*

---

## 🌟 Key Application Features

### 1. 🔬 Interactive Abductive Inference Lab (Playground)
- **Live Event & Multi-Document Input**: Enter any target event and add/remove/edit multiple supporting context documents.
- **Multi-Answer Decision Logic**: Supports identifying **single or multiple** simultaneous causal triggers (e.g. `[A]`, `[B, D]`, `[A, C]`, `[A, B, C]`).
- **One-Click Showcase Presets**: Includes pre-configured real-world scenarios:
  - *Industrial Disaster*: Chemical Plant Explosion (Texas) - Single Answer `[B]`
  - *Political Crisis*: South Korea Parliamentary Impeachment - Multi-Answer `[B, D]`
  - *Security Incident*: Shinzo Abe Public Rally Shooting - Single Answer `[D]`
  - *Aviation Safety*: Passenger Airliner Fleet Emergency Grounding - Multi-Answer `[A, C]`
  - *Infrastructure Failure*: Metropolitan Power Grid Blackout - Multi-Answer `[A, B, C]`
  - *Biomedical Safety*: Drug Phase III Recall - Single Answer `[C]`
- **Calibrated Probability Gauges**: Visual percentage meters for Options A, B, C, D with color-coded confidence and threshold markers.
- **Causal Evidence Highlighting**: Automatically extracts and highlights supporting sentences and keywords from the context documents.
- **Adjustable Threshold Slider**: Dynamically adjust $\tau \in [0.05, 0.95]$ (default 0.50) with fallback to Top-1 when all probabilities fall below threshold.
- **Keyboard Shortcut**: Press `Ctrl + Enter` (or `Cmd + Enter`) to trigger reasoning instantly.

### 2. 📊 Benchmark Performance & Error Calibration
- **Model Benchmark KPIs**:
  - **Exact Match Accuracy**: `99.00%` (396 / 400 dev samples)
  - **Macro F1-Score**: `0.9967`
  - **Decision MCC**: `0.9948`
  - **Micro ROC-AUC**: `0.9994`
  - **Probability Calibration RMSE**: `0.0688`
- **Interactive Training Convergence Charts**:
  - 5-Epoch Training Loss ($0.4161 \to 0.0210$) vs. Exact Match Accuracy ($72.25\% \to 99.00\%$).
  - Macro F1-Score ($0.8830 \to 0.9967$) vs. Calibration Error ($0.2852 \to 0.0688$).
- **Per-Option 2×2 Multi-Label Confusion Breakdown**:
  - Exact TP, FP, TN, FN counts, Precision, Recall, and F1 for Options A, B, C, and D.
- **Dev Set Sample Comparison Table**:
  - 15 sample-by-sample comparisons showing $y_{\text{actual}}$ vs $y_{\text{pred}}$, exact match status, option probabilities $P(A), P(B), P(C), P(D)$, and sample RMSE.
- **Zoomable Research Figures Gallery**:
  - High-resolution heatmaps and ROC curves extracted directly from the notebook execution.

### 3. 📁 Benchmark Dataset Explorer
- Browse the official SemEval-2026 dataset splits (200 sample questions + 400 development questions).
- Filter by **Single-Answer** vs **Multi-Answer**, search by keyword, or filter by specific options.
- Inspect full context documents, topics, sources, and golden annotations.
- One-click **"Load in Lab"** button to transfer any benchmark question directly into the playground.

### 4. 📈 Bias & Class Distribution Analytics
- Single-answer (57.28%) vs Multi-answer (42.72%) distribution breakdown.
- Positive occurrence rates across options A (41.34%), B (39.14%), C (39.47%), D (36.89%).
- Top label combinations chart (`[B]`, `[C]`, `[A]`, `[D]`, `[A,C]`, `[A,D]`, etc.).
- Documentation on principled class imbalance handling (`pos_weight` in BCE loss + `WeightedRandomSampler`).

### 5. 🗺️ Pipeline Architecture & Research Roadmap
- Schematic diagram of the ALBERT multi-choice multi-label encoder.
- Research iteration roadmap (V0 Baseline to V5 Multi-Model Ensemble).

### 6. ⚡ REST API Sandbox & Documentation
- Interactive API testing console with live request and response inspector.
- Built-in cURL code generator.

---

## 📡 REST API Reference

### `POST /api/predict`
Run abductive reasoning on an event, supporting documents, and candidate cause options.

**Request Body:**
```json
{
  "event": "A major chemical plant fire occurred in Texas causing regional evacuations.",
  "documents": [
    "Preliminary logs confirmed a pressure relief valve failure on Tank 4 triggered an explosion at 3 PM.",
    "Emergency crews responded within minutes to contain the chemical hazards."
  ],
  "options": {
    "A": "A sudden thunderstorm damaged electrical lines.",
    "B": "A pressure valve failure caused an explosion in Tank 4.",
    "C": "Worker strike disrupted safety protocols.",
    "D": "None of the others"
  },
  "threshold": 0.50
}
```

**Response:**
```json
{
  "predicted_labels": ["B"],
  "selected_options": ["A pressure valve failure caused an explosion in Tank 4."],
  "is_multi_answer": false,
  "probabilities": {
    "A": 0.001,
    "B": 0.9974,
    "C": 0.001,
    "D": 0.0384
  },
  "evidence": { ... },
  "threshold": 0.50,
  "top_1_fallback_applied": false
}
```

### Additional Endpoints:
- `GET /api/presets`: Retrieve curated showcase scenarios.
- `GET /api/samples?split=dev_data&page=1&type=multi`: Paginated and filtered dataset samples.
- `GET /api/samples/<id>`: Full question metadata and topic context documents.
- `GET /api/metrics`: Verified 5-epoch training and evaluation metrics, confusion matrices, and ROC-AUC.
- `GET /api/stats`: Dataset class distribution and multi-answer proportions.
- `GET /api/roadmap`: Experimental roadmap (V0 - V5).

---

## 🏗️ Project Structure

```
├── file.ipynb                   # Original SemEval-2026 Task 12 research notebook
├── app.py                       # Flask server and REST API inference engine
├── requirements.txt             # Minimal dependencies
├── data/
│   └── presets.json             # Curated showcase scenarios (single & multi-answer)
├── sample_data/                 # Official SemEval sample split (questions & docs)
├── dev_data/                    # Official SemEval development split (questions & docs)
├── static/
│   ├── css/
│   │   └── style.css            # Custom animations, card styling & transitions
│   ├── js/
│   │   └── app.js               # Reactive frontend controller, Chart.js & state
│   └── images/                  # Extracted high-resolution notebook research figures
└── templates/
    └── index.html               # Main responsive single-page application
```
