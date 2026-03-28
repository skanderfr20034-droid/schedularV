# SchedulingTransformer - Quick Start Guide

Welcome! Here's how to get started immediately.

## ⚡ 5-Minute Quick Start

### Step 1: Install Dependencies
```bash
cd SchedulingTransformer
pip install -r requirements.txt
```

### Step 2: Run Your First Example
```bash
python examples/example_run.py
```

You'll see:
- A single negotiation with full trace
- Batch negotiation with statistics
- Visualizations saved to `./negotiation_report/`

**That's it!** You've just run a multi-agent Transformer negotiation! 🎉

---

## 🎯 Three Main Examples

### Example 1: Negotiation Demo
```bash
python examples/example_run.py
```
**What you'll see:**
- Single negotiation: Room Manager, Teacher, Students negotiating a time slot
- 3 rounds of iterative refinement
- Satisfaction scores evolving each round
- Attention weights showing who influences who
- Batch run on 5 scenarios with aggregate statistics

**Output files:**
- `negotiation_report/attention_round_1.png` (heatmap of Round 1)
- `negotiation_report/attention_round_2.png` (heatmap of Round 2)
- `negotiation_report/attention_round_3.png` (heatmap of Round 3)
- `negotiation_report/satisfaction_convergence.png` (scores over time)
- `negotiation_report/slot_probabilities.png` (top 5 slot evolution)
- `negotiation_report/full_report.json` (complete trace)

### Example 2: REST API
```bash
# Terminal 1: Start server
python api/main.py

# Terminal 2: Test API
python examples/example_api.py
```

**What you'll see:**
- API health check
- Model configuration
- Generate random scenario
- Run negotiation via API
- Get detailed explanation
- Batch negotiate 3 scenarios

**API Endpoints Available:**
- `GET /health` - Is server running?
- `GET /config` - Model configuration
- `GET /slots` - Available time slots
- `POST /generate-scenario` - Create random scenario
- `POST /negotiate` - Run negotiation
- `POST /explain-decision` - Detailed explanation
- `POST /batch-negotiate` - Multiple scenarios

**After starting the server, open:** http://localhost:8000/docs (Swagger UI)

### Example 3: Training
```bash
python examples/example_training.py
```

**What you'll see:**
- Training for 50 epochs
- Satisfaction scores improving over time
- Validation metrics
- Inference with trained model
- Training history plot saved

**Output files:**
- `training_history.png` - Loss and satisfaction plots
- `trained_model.pth` - Trained model weights

---

## 📖 Understanding the Output

### Negotiation Example Output

```
FINAL DECISION: We-11:00
NEGOTIATION SUCCESSFUL: ✓ YES

FINAL SATISFACTION SCORES:
  • Room Manager:    0.850
  • Teacher:         0.920
  • Student Group:   0.780
  • Global Average:  0.850

NEGOTIATION TRACE:
Round 1: Mo-10:00 (Scores: R=0.667 | T=0.600 | S=0.700)
Round 2: We-11:00 (Scores: R=0.850 | T=0.900 | S=0.750)
Round 3: We-11:00 (Scores: R=0.850 | T=0.920 | S=0.780) ← FINAL
```

**Interpretation:**
- Negotiation **converged** to `We-11:00` (Wednesday 11 AM)
- Room Manager is **satisfied** (0.85): Slot available in most rooms
- Teacher is **very satisfied** (0.92): This is a preferred slot
- Students are **satisfied** (0.78): Fits their constraints
- Process took **3 rounds** to reach consensus

### Attention Weights (From Visualizations)

```
Attention Matrix (Round 2):
                Room Mgr  Teacher  Students
           Room Mgr   0.40      0.35     0.25
           Teacher    0.20      0.60     0.20
           Students   0.15      0.25     0.60
```

**Interpretation:**
- Room Manager mostly listens to itself (0.40) and Teacher (0.35)
- Teacher mostly listens to itself (0.60), less to others
- Students listen mostly to themselves (0.60), some to Teacher (0.25)

This shows the negotiation dynamic!

---

## 🔧 Configuring the System

Edit `config.py` to customize:

```python
# Model size (educational, keep small)
MODEL_DIM = 64              # Embedding dimension
NUM_HEADS = 4               # Number of attention heads  
NUM_LAYERS = 3              # Number of rounds (1-5 recommended)

# Training
BATCH_SIZE = 32
NUM_EPOCHS = 50
LEARNING_RATE = 0.001

# Satisfaction threshold (0-1)
SATISFACTION_THRESHOLD = 0.7  # Success if global >= 0.7

# Available time slots
AVAILABLE_HOURS = 8         # 09:00 to 16:00 (9 AM to 4 PM)
AVAILABLE_DAYS = 5          # Mon-Fri
```

Then re-run examples with new configuration!

---

## 📚 File Structure

```
SchedulingTransformer/              # Root
├── config.py                       # Configuration (settings)
├── main.py                         # Interactive menu
├── requirements.txt                # Dependencies
├── README.md                       # Full documentation (read this!)
├── IMPLEMENTATION_SUMMARY.md      # What was implemented
├── 
├── data_generator/
│   └── scenario_generator.py      # Creates synthetic negotiation scenarios
│
├── model/
│   ├── attention.py               # Multi-head attention implementation
│   ├── transformer.py             # Transformer blocks
│   └── scheduler_model.py         # Complete scheduler model
│
├── utils/
│   ├── satisfaction.py            # Satisfaction scoring functions
│   └── visualization.py           # Plotting utilities
│
├── training/
│   └── train.py                  # Training loop
│
├── api/
│   └── main.py                   # FastAPI server
│
└── examples/                     # Runnable examples
    ├── example_run.py           # Negotiation demo
    ├── example_api.py           # API usage
    └── example_training.py      # Training demo
```

---

## 🎓 Educational Concepts

### What is This?

A Transformer model that interprets **attention as negotiation**:

```
Agent 1 (Room Manager)  ──\
                           ├─→ Attention Mechanism ──→ Proposed Slot
Agent 2 (Teacher)       ──/                             Satisfaction Scores
Agent 3 (Students)      ──┘

Each layer = 1 negotiation round
Multiple layers = Iterative refinement toward agreement
```

### How Does It Work?

1. **Input:** Scenario with 3 agents' preferences
2. **Process:** Transformer attention blocks (1 per round)
3. **Output:** Final time slot with satisfaction scores
4. **Visualization:** Attention weights showing influence flow

### Why Transformers?

- Attention weights naturally represent "who listens to whom"
- Multiple heads = different negotiation strategies
- Residual connections = stability
- Layer-wise = iterative refinement

---

## 🐛 Troubleshooting

### ImportError: No module named 'torch'
```bash
# Install dependencies
pip install -r requirements.txt
```

### API already in use (port 8000)
```bash
# Use different port - edit api/main.py:
# Change: API_PORT = 8000
# To:     API_PORT = 8001
```

### Slow training on CPU?
```python
# This is normal! CPU training is slower.
# For faster training, install CUDA-compatible PyTorch:
# https://pytorch.org/get-started/locally/
```

### Matplotlib backend error
```bash
# Add to top of your script:
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
```

---

## 🚀 Next Steps

1. **Understand the code:**
   - Read `README.md` for detailed documentation
   - Check docstrings in each module

2. **Modify and experiment:**
   - Change difficulty level in examples: `difficulty="hard"`
   - Adjust model size in `config.py`
   - Create custom scenarios

3. **Integrate:**
   - Use API for external applications
   - Extend with new agent types
   - Add your own satisfaction metrics

4. **Learn:**
   - Study attention mechanism (`model/attention.py`)
   - Understand Transformer layers (`model/transformer.py`)
   - Explore negotiation logic (`model/scheduler_model.py`)

---

## 💡 Pro Tips

### Generate Hard Scenarios
```python
from data_generator.scenario_generator import ScenarioGenerator

gen = ScenarioGenerator(seed=42)
hard_scenario = gen.generate_scenario(difficulty="hard")
# Many conflicts - see how Transformer negotiates!
```

### Custom Satisfaction Weights
Edit `utils/satisfaction.py`:
```python
# Change line: global_score = (room + teacher + student) / 3
# To weighted: global_score = 0.3*room + 0.5*teacher + 0.2*student
# Now teacher's preference matters most!
```

### Longer Negotiations
Edit `config.py`:
```python
NUM_LAYERS = 5  # More rounds for complex scenarios
NUM_EPOCHS = 100  # Train longer
```

### Run Full Training + Evaluation
```bash
python examples/example_training.py
# Then inference is automatic!
# Model saved to: trained_model.pth
```

---

## 📞 Need Help?

1. **Check README.md** for full documentation
2. **Check IMPLEMENTATION_SUMMARY.md** for technical details
3. **Read docstrings** in the code (very detailed!)
4. **Run examples** to see patterns
5. **Modify config.py** to experiment

---

## 📊 Expected Results

### Single Negotiation
```
✓ Convergence in 3 rounds
✓ Satisfaction scores: 0.6-0.95 range
✓ Final decision with explanation
```

### Batch (5 scenarios)
```
✓ ~60-80% successful negotiations  
✓ Average satisfaction: 0.65-0.85
✓ Statistics for all agents
```

### Training (50 epochs)
```
✓ Loss decreases over time
✓ Satisfaction scores improve
✓ Model learns to maximize global satisfaction
```

---

## 🎯 Learning Outcomes

After running these examples, you'll understand:

1. ✅ How Transformers work (attention mechanism)
2. ✅ How attention encodes "listening" patterns
3. ✅ Multi-agent decision making
4. ✅ Neural networks for optimization
5. ✅ REST API design
6. ✅ Deep learning training pipeline

---

## 🎉 Ready?

```bash
# Run it NOW!
python examples/example_run.py
```

Enjoy exploring multi-agent negotiation with Transformers! 🚀

For more detailed info: **Read README.md**
For technical details: **Read IMPLEMENTATION_SUMMARY.md**
