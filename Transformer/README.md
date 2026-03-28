# SchedulingTransformer 🤖

An educational AI system that simulates multi-agent negotiation using Transformer attention mechanisms. This is **NOT** a global scheduling optimizer - it's a **negotiation simulator** where three agents collaboratively find acceptable time slots.

## 🎯 Core Concept

The Transformer attention mechanism is reinterpreted as a **negotiation process**:

- **Each agent** = a "token" in the Transformer
- **Attention weights** = how much each agent listens to others
- **Each Transformer layer** = one negotiation round
- **Output evolution** = gradual convergence towards mutual agreement

### The Three Agents

1. **Room Manager** 🏢
   - Controls: Available rooms and time slots
   - Preferences: Prioritizes slot availability and room capacity

2. **Teacher** 👨‍🏫
   - Controls: Time constraints and availability
   - Preferences: Prefers certain slots, has unavailable times

3. **Student Representative** 👨‍🎓
   - Controls: Group availability and learning objectives
   - Preferences: Prefers certain times, has various constraints

## 📁 Project Structure

```
SchedulingTransformer/
├── config.py                      # Configuration settings
├── requirements.txt               # Python dependencies
│
├── data_generator/
│   └── scenario_generator.py      # Generate synthetic negotiation scenarios
│
├── model/
│   ├── attention.py              # Multi-head self-attention mechanism
│   ├── transformer.py            # Transformer layers and architecture
│   └── scheduler_model.py        # Complete scheduler model
│
├── training/
│   └── train.py                  # Training loop with satisfaction-based loss
│
├── utils/
│   ├── satisfaction.py           # Satisfaction scoring functions
│   └── visualization.py          # Plotting and visualization utilities
│
├── api/
│   └── main.py                   # FastAPI server with REST endpoints
│
└── examples/
    ├── example_run.py            # Single and batch negotiation examples
    ├── example_api.py            # API usage examples
    └── example_training.py       # Training and inference examples
```

## 🚀 Quick Start

### 1. Installation

```bash
# Clone/Navigate to project directory
cd SchedulingTransformer

# Install dependencies
pip install -r requirements.txt
```

### 2. Run Examples

#### Example 1: Basic Negotiation
```bash
python examples/example_run.py
```

Output:
- Single negotiation with full trace
- Batch negotiation with statistics
- Visualizations: attention matrices, satisfaction convergence, slot probabilities

#### Example 2: API Server
```bash
# Terminal 1: Start the server
python api/main.py

# Terminal 2: Run API examples
python examples/example_api.py
```

Endpoints:
- `GET /health` - Health check
- `GET /config` - Model configuration
- `GET /slots` - Available time slots
- `POST /generate-scenario` - Generate random scenario
- `POST /negotiate` - Run negotiation
- `POST /explain-decision` - Get detailed explanation
- `POST /batch-negotiate` - Batch negotiation

#### Example 3: Training
```bash
python examples/example_training.py
```

Trains the model on synthetic scenarios and saves:
- `trained_model.pth` - Trained weights
- `training_history.png` - Loss and satisfaction plots

## 🧠 How It Works

### Negotiation Flow

```
SCENARIO INPUT
    ↓
[Embed scenario info into agent embeddings]
    ↓
ROUND 1: Self-Attention
  • Room Manager, Teacher, Student attend to each other
  • Each proposes a slot based on other's information
  • Satisfaction scores computed
    ↓
ROUND 2: Refined Attention
  • Agents re-attend based on previous round's output
  • Better understanding of constraints
  • New proposals generated
    ↓
ROUND 3: Final Negotiation
  • Convergence towards mutual agreement
  • Final decision made
    ↓
FINAL RESULT
  • Proposed slot
  • Satisfaction scores (each agent + global)
  • Full negotiation trace
```

### Satisfaction Scoring

Each agent's satisfaction is measured on a 0-1 scale:

**Room Manager Satisfaction:**
- 1.0 if slot available in all rooms
- 0.5 if available in some rooms
- 0.0 if not available

**Teacher Satisfaction:**
- 1.0 if slot in preferred list
- 0.6 if available (not unavailable)
- 0.0 if in unavailable list

**Student Satisfaction:**
- 1.0 if slot in preferred list
- 0.7 base score adjusted by constraints:
  - No early morning (-50%)
  - No late afternoon (-50%)
  - Not in preferred days (-40%)

**Global Satisfaction:**
```
global_score = (room + teacher + student) / 3
```

### Attention Mechanism

For each round, the model tracks how much each agent "listens" to others:

```
Attention_ij = softmax(Query_i · Key_j / sqrt(d_k))

Interpretation:
- attention[room][teacher] = how much room mgr listens to teacher
- attention[teacher][room] = how much teacher listens to room mgr
- etc.
```

## 📊 Example Output

### Single Negotiation Output:

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
    → Excellent agreement across all agents. (room available, teacher preferred, students satisfied)
```

### API Response Example:

```json
{
  "scenario_id": "SCENARIO-42857",
  "final_slot": "We-11:00",
  "success": true,
  "final_scores": {
    "room": 0.85,
    "teacher": 0.92,
    "student": 0.78,
    "global": 0.85
  },
  "negotiation_rounds": [
    {
      "round": 1,
      "proposed_slot": "Mo-10:00",
      "scores": {...},
      "explanation": "Negotiation still in progress..."
    },
    ...
  ]
}
```

## 📚 Key Components Explained

### 1. Scenario Generator (`data_generator/scenario_generator.py`)

Generates realistic negotiation scenarios:

```python
from data_generator.scenario_generator import ScenarioGenerator

gen = ScenarioGenerator(seed=42)

# Single scenario
scenario = gen.generate_scenario(difficulty="medium")
# Returns: {room_manager, teacher, students, all_possible_slots, target_slot}

# Batch
scenarios = gen.generate_batch(batch_size=32, difficulty="hard")
```

**Difficulty Levels:**
- **easy**: Lots of overlapping preferences (easy to find consensus)
- **medium**: Some conflicts (realistic scenarios)
- **hard**: Many conflicts (challenging negotiation)

### 2. Transformer Model (`model/`)

#### `attention.py` - Multi-Head Attention
- Single head: Q·K^T / sqrt(d_k) → softmax
- Multiple heads: Parallel attention patterns
- Output: Attended values + attention weights

#### `transformer.py` - Transformer Architecture
- Positional encoding: Maintains agent identity
- Stacked layers: Each layer = one negotiation round
- Residual connections: Smooth information flow

#### `scheduler_model.py` - Complete Model
- Scenario → Embeddings
- Transformer forward pass
- Round-by-round decisions with satisfaction

### 3. Satisfaction Evaluator (`utils/satisfaction.py`)

Score each proposed slot:

```python
from utils.satisfaction import SatisfactionEvaluator

evaluator = SatisfactionEvaluator(scenario, slot_names)
scores = evaluator.evaluate_proposal("We-11:00")
# Returns: {room, teacher, student, global}
```

### 4. Training (`training/train.py`)

Satisfaction-based training:

```python
from training.train import Trainer
from model.scheduler_model import SchedulerModel

model = SchedulerModel(num_slots=40)
trainer = Trainer(model, num_slots=40)

history = trainer.train(num_epochs=50, val_split=0.2)
# Learns to maximize satisfaction scores
```

**Loss Function:**
```
Loss = 1 - global_satisfaction
```

### 5. Visualization (`utils/visualization.py`)

```python
from utils.visualization import NegotiationVisualizer

# Plot attention matrices
NegotiationVisualizer.plot_attention_matrix(attn, round_num)

# Plot satisfaction convergence
NegotiationVisualizer.plot_satisfaction_convergence(history)

# Plot slot probability evolution
NegotiationVisualizer.plot_slot_probabilities(logits, slot_names)
```

### 6. FastAPI Server (`api/main.py`)

```bash
# Start server
python api/main.py
# Runs on http://localhost:8000

# Docs
http://localhost:8000/docs  # Swagger UI
http://localhost:8000/redoc # ReDoc
```

## 🔧 Configuration

Edit `config.py` to adjust:

```python
# Model
MODEL_DIM = 64              # Embedding dimension
NUM_HEADS = 4               # Attention heads
NUM_LAYERS = 3              # Negotiation rounds
FEEDFORWARD_DIM = 256       # Hidden layer size
DROPOUT = 0.1               # Regularization

# Training
BATCH_SIZE = 32
LEARNING_RATE = 0.001
NUM_EPOCHS = 50

# Dataset
NUM_ROOMS = 5
AVAILABLE_HOURS = 8         # 09:00 to 16:00
AVAILABLE_DAYS = 5          # Mon-Fri

# Satisfaction threshold for "success"
SATISFACTION_THRESHOLD = 0.7
```

## 📈 Advanced Usage

### Custom Scenario

```python
from data_generator.scenario_generator import ScenarioGenerator
from model.scheduler_model import SchedulerModel

# Create custom scenario
scenario = {
    "room_manager": {
        "rooms": [
            {"room_id": "R001", "capacity": 50, "available_slots": ["Mo-09:00", "Mo-10:00", ...]},
            ...
        ]
    },
    "teacher": {
        "teacher_id": "T001",
        "preferred_slots": ["Mo-10:00", "We-14:00"],
        "unavailable_slots": ["Tu-09:00"],
        "min_slots_needed": 1
    },
    "students": {
        "group_id": "G001",
        "preferred_slots": ["Tu-10:00", "Fr-15:00"],
        "constraints": {"no_early_morning": True, "preferred_days": ["Mo", "We", "Fr"]}
    },
    "all_possible_slots": [...]
}

# Run negotiation
model = SchedulerModel(num_slots=40)
result = model.forward(scenario, slot_names)
```

### Attention Visualization

```python
import matplotlib.pyplot as plt
import seaborn as sns

# Get negotiation trace
result = model.forward(scenario, slot_names)

# Plot attention from round 2
round2_attn = result['negotiation_rounds'][1]['attention_weights']

plt.figure(figsize=(8, 6))
sns.heatmap(round2_attn, 
           xticklabels=["Room Mgr", "Teacher", "Students"],
           yticklabels=["Room Mgr", "Teacher", "Students"],
           annot=True, fmt='.2f')
plt.title("Round 2 Attention Weights")
plt.show()
```

## 🎓 Educational Value

This project teaches:

1. **Transformer Architecture**
   - Self-attention mechanism
   - Multi-head attention
   - Positional encoding
   - Residual connections

2. **Negotiation as Neural Computation**
   - How attention can model group decision-making
   - Information flow in multi-agent systems
   - Convergence properties

3. **Deep Learning Techniques**
   - Custom loss functions (satisfaction-based)
   - Training loops and optimization
   - Model evaluation and visualization

4. **Software Engineering**
   - Modular architecture
   - API design with FastAPI
   - Data generation and handling

## ⚙️ Performance Notes

- **Model Size**: ~200K parameters (educational, small for fast iteration)
- **Training Time**: ~2-5 minutes on CPU for 50 epochs
- **Inference**: <100ms per negotiation on CPU
- **No GPU required** (but optional for faster training)

## 🐛 Troubleshooting

### Import errors
```bash
# Make sure you're in the project root
cd SchedulingTransformer
python examples/example_run.py
```

### API connection errors
```bash
# Make sure server is running
python api/main.py

# In another terminal, test connectivity
curl http://localhost:8000/health
```

### CUDA issues
```python
# Force CPU
import torch
device = torch.device('cpu')
model.to(device)
```

## 📝 License

Educational project for learning. Free to use and modify.

## 🙏 Acknowledgments

- Inspired by "Attention is All You Need" (Vaswani et al., 2017)
- Educational focus on explainability and understanding
- Built with PyTorch and FastAPI

## 📞 Questions?

Try the examples:
1. `python examples/example_run.py` - See single negotiation
2. `python api/main.py` then `python examples/example_api.py` - Test API
3. `python examples/example_training.py` - Train the model

Good luck! 🚀
