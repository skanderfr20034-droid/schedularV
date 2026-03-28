# SchedulingTransformer - Implementation Summary

## ✅ Complete Implementation

A comprehensive educational AI system demonstrating Transformer attention mechanisms as multi-agent negotiation for scheduling.

---

## 📦 Project Structure

```
SchedulingTransformer/
├── config.py                           # Configuration: model dims, training params, dataset settings
├── requirements.txt                    # Python dependencies (PyTorch, FastAPI, etc.)
├── main.py                            # Interactive menu for running examples
├── README.md                          # Comprehensive documentation
│
├── data_generator/                    # 📊 Dataset Generation
│   ├── __init__.py
│   └── scenario_generator.py          # Generates synthetic negotiation scenarios
│                                       # - Room info with availability
│                                       # - Teacher preferences & constraints
│                                       # - Student preferences & constraints
│                                       # - Difficulty levels (easy/medium/hard)
│
├── model/                             # 🧠 Neural Architecture
│   ├── __init__.py
│   ├── attention.py                   # Multi-head self-attention implementation
│   │                                   # - SingleHeadAttention: Q·K^T/√d_k
│   │                                   # - MultiHeadAttention: Parallel heads
│   │
│   ├── transformer.py                 # Transformer blocks
│   │                                   # - PositionalEncoding: Agent identity
│   │                                   # - TransformerLayer: Attention + FFN
│   │                                   # - TransformerScheduler: Full architecture
│   │
│   └── scheduler_model.py             # Complete scheduler orchestration
│                                       # - Scenario → Embeddings
│                                       # - Negotiation trace generation
│                                       # - Round-by-round predictions
│
├── utils/                             # 🛠️ Utilities
│   ├── __init__.py
│   ├── satisfaction.py                # Satisfaction scoring & evaluation
│   │                                   # - SatisfactionEvaluator: Score proposals
│   │                                   # - LossFunction: Training loss
│   │                                   # - Metrics: Accuracy, satisfaction scores
│   │
│   └── visualization.py               # Plotting & visualization
│                                       # - Attention heatmaps
│                                       # - Satisfaction convergence plots
│                                       # - Slot probability evolution
│
├── training/                          # 🎓 Training Module
│   ├── __init__.py
│   └── train.py                       # Training loop
│                                       # - Satisfaction-based loss
│                                       # - Batch training
│                                       # - Validation & early stopping
│
├── api/                               # 🌐 REST API
│   ├── __init__.py
│   └── main.py                        # FastAPI server
│                                       # 7 Endpoints:
│                                       # - GET /health
│                                       # - GET /config
│                                       # - GET /slots
│                                       # - POST /generate-scenario
│                                       # - POST /negotiate
│                                       # - POST /batch-negotiate
│                                       # - POST /explain-decision
│
└── examples/                          # 📚 Usage Examples
    ├── example_run.py                # Single & batch negotiation
    ├── example_api.py                # API usage (7 examples)
    └── example_training.py           # Training & inference
```

---

## 🎯 Key Features Implemented

### 1. **Dataset Generator** ✅
- Generates realistic negotiation scenarios
- Three difficulty levels: easy, medium, hard
- Components:
  - Multiple rooms with availability
  - Teacher preferences & unavailable slots
  - Student preferences with constraints
- Batch generation for training

**File:** `data_generator/scenario_generator.py`

### 2. **Model Architecture** ✅
- **Lightweight Transformer** (educational, ~200K params)
- Components:
  - Multi-head self-attention (4 heads)
  - Residual connections
  - Feed-forward networks
  - Layer normalization
  - Positional encoding
- **3 Negotiation Rounds** (configurable)
- Fully implemented from scratch (no black-box libraries)

**Files:** 
- `model/attention.py` - Attention mechanism
- `model/transformer.py` - Transformer layers
- `model/scheduler_model.py` - Complete model

### 3. **Negotiation Mechanism** ✅
- Iterative refinement across rounds
- Each round outputs:
  - Proposed time slot
  - Attention weights (3x3 matrix)
  - Satisfaction scores
  - Textual explanation
- Full negotiation trace available

**File:** `model/scheduler_model.py`

### 4. **Satisfaction Function** ✅
- **Room Manager:** Evaluates availability (0-1 scale)
- **Teacher:** Prefers preferred slots, avoids unavailable (0-1)
- **Student:** Prefers preferred slots, handles constraints (0-1)
- **Global Score:** Weighted average of all agents (0-1)

**File:** `utils/satisfaction.py`

### 5. **Model Output Format** ✅
For each round:
```json
{
  "round": 1,
  "proposed_slot": "Mo-10:00",
  "predicted_idx": 5,
  "scores": {
    "room": 0.667,
    "teacher": 0.600,
    "student": 0.700,
    "global": 0.656
  },
  "explanation": "Negotiation still in progress..."
}
```

### 6. **Training Loop** ✅
- Satisfaction-based loss: `Loss = 1 - global_satisfaction`
- Adam optimizer with weight decay
- Train/validation split
- Early stopping with patience
- Batch training with configurable batch size
- Saves best model weights

**File:** `training/train.py`

### 7. **REST API** ✅
Full FastAPI server with 7 endpoints:

```
GET  /health               → Status check
GET  /config               → Model configuration
GET  /slots                → Available time slots
POST /generate-scenario    → Generate random scenario
POST /negotiate            → Run negotiation
POST /batch-negotiate      → Batch negotiation
POST /explain-decision     → Detailed explanation
```

**File:** `api/main.py`

### 8. **Code Organization** ✅
Modular structure with:
- Separate files for each component
- Clear responsibility boundaries
- Comprehensive docstrings
- Educational comments
- No over-engineering

### 9. **Bonus Features** ✅
- ✅ **Attention Visualization:** Heatmaps of inter-agent attention
- ✅ **Convergence Plots:** Satisfaction scores per round
- ✅ **Explainability:** Round-by-round explanations
- ✅ **Batch Processing:** Multiple scenarios
- ✅ **Interactive Menu:** Easy to run examples

**File:** `utils/visualization.py`

---

## 🚀 How to Use

### Installation
```bash
pip install -r requirements.txt
```

### Quick Start Examples

#### Example 1: Run Negotiation
```bash
python examples/example_run.py
```
Output: Single negotiation with visualizations + batch statistics

#### Example 2: Use API
```bash
# Terminal 1
python api/main.py

# Terminal 2
python examples/example_api.py
```
Output: Test all 7 API endpoints

#### Example 3: Train Model
```bash
python examples/example_training.py
```
Output: Training for 50 epochs + inference with trained weights

#### Interactive Menu
```bash
python main.py
```
Interactive menu to choose any example.

---

## 📊 Example Output

### Console Output
```
=======================================================================
NEGOTIATION RESULTS
=======================================================================

FINAL DECISION: We-11:00
NEGOTIATION SUCCESSFUL: ✓ YES

FINAL SATISFACTION SCORES:
  • Room Manager:    0.850
  • Teacher:         0.920
  • Student Group:   0.780
  • Global Average:  0.850

NEGOTIATION TRACE:
----------
  Round 1:
    Proposed: Mo-10:00
    Scores: R=0.667 | T=0.600 | S=0.700 | G=0.656
    → Negotiation still in progress. (room available, students can attend)

  Round 2:
    Proposed: We-11:00
    Scores: R=0.850 | T=0.900 | S=0.750 | G=0.833
    → Good compromise found. (room available, teacher preferred, students satisfied)

  Round 3:
    Proposed: We-11:00
    Scores: R=0.850 | T=0.920 | S=0.780 | G=0.850
    → Excellent agreement. (room available, teacher preferred, students satisfied)
```

### Generated Visualizations
1. `attention_round_1.png`, `attention_round_2.png`, `attention_round_3.png` - Heatmaps of agent attention
2. `satisfaction_convergence.png` - Score evolution across rounds
3. `slot_probabilities.png` - Top 5 slot probability evolution
4. `full_report.json` - Complete scenario and results

---

## 🔬 Technical Details

### Model Dimensions
- Embedding: 64 dimensions
- Attention heads: 4
- Layers: 3 (3 negotiation rounds)
- Feedforward: 256 hidden
- Total parameters: ~200K (educational size)

### Training Configuration
- Batch size: 32
- Learning rate: 0.001
- Weight decay: 1e-5
- Epochs: 50
- Validation split: 20%

### Dataset
- Rooms: 5 per scenario
- Room capacity: 20-100 people
- Time slots: 40 (Mon-Fri, 9 AM - 4 PM, hourly)
- Agents: 3 (Room Manager, Teacher, Student)

---

## 📚 Educational Value

This implementation teaches:

1. **Transformer Architecture**
   - Multi-head attention mechanism
   - Layer normalization & residual connections
   - Positional encoding
   - Transformer encoder implementation

2. **Attention as Communication**
   - How attention weights encode "listening"
   - Multi-head attention for diverse perspectives
   - Convergence through iterative refinement

3. **Deep Learning Practices**
   - Custom loss functions (satisfaction-based)
   - Training loops with validation
   - Model checkpointing
   - Batch processing

4. **Software Engineering**
   - Modular architecture
   - REST API design
   - Data generation & handling
   - Visualization & reporting

---

## ⚡ Performance

- **Model Size**: 200K parameters (small, educational)
- **Training Time**: ~2-5 minutes for 50 epochs (CPU)
- **Inference**: <100ms per negotiation (CPU)
- **No GPU required** for education/prototyping
- **Fully CPU-compatible** with PyTorch

---

## 🎓 What the Model Learns

The model learns to:
1. **Understand preferences** from embeddings
2. **Negotiate through attention** - which constraints matter
3. **Converge to compromise** - balancing multiple objectives
4. **Explain decisions** - why this slot was chosen

The satisfaction-based loss drives the model to find slots that maximize mutual agreement.

---

## 📄 Configuration

Edit `config.py` to customize:
```python
MODEL_DIM = 64              # Embedding dimension
NUM_HEADS = 4               # Attention heads
NUM_LAYERS = 3              # Negotiation rounds
BATCH_SIZE = 32             # Training batch
LEARNING_RATE = 0.001       # Optimizer
NUM_EPOCHS = 50             # Training epochs
```

---

## 🎯 Project Goals Achieved

✅ Educational Transformer interpretation as negotiation
✅ Multi-agent system with realistic constraints
✅ Satisfaction-based decision making
✅ Clear attention weight visualization
✅ Full training pipeline
✅ REST API for easy access
✅ Modular, well-documented code
✅ Multiple runnable examples
✅ No over-engineering - focus on learning

---

## 📖 Resources

- **README.md** - Comprehensive guide
- **Code comments** - Explain design choices
- **Docstrings** - Document all functions
- **Examples** - 3 complete runnable examples

---

## 🏁 Ready to Use!

Everything is implemented and ready to run:

```bash
# Install
pip install -r requirements.txt

# Run any example
python examples/example_run.py          # See negotiation
python api/main.py                      # Start API
python examples/example_training.py     # Train model
```

**Enjoy exploring multi-agent negotiation with Transformers!** 🚀
