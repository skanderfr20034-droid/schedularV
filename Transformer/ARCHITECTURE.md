# SchedulingTransformer - Complete Architecture Guide

Detailed technical architecture of the SchedulingTransformer system.

---

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCHEDULING TRANSFORMER                        │
│                   (Multi-Agent Negotiation)                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                        INPUT LAYER                               │
│ ┌─────────────┐  ┌─────────────┐  ┌──────────────┐              │
│ │Room Manager │  │   Teacher   │  │   Students   │              │
│ │ - Rooms     │  │ - Preferred │  │ - Preferred  │              │
│ │ - Slots     │  │ - Unavail   │  │ - Constraints│              │
│ └─────────────┘  └─────────────┘  └──────────────┘              │
└──────────────────────────────────────────────────────────────────┘
                              ↓
                    [Scenario Embedding]
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                   TRANSFORMER ENCODER                             │
│ ┌──────────────────────────────────────────┐                     │
│ │   ROUND 1: Multi-Head Attention          │                     │
│ │  ┌─────────┐  ┌──────────┐  ┌──────────┐│                     │
│ │  │ Attend  │→ │ Aggregate│→ │ Propose  ││                     │
│ │  └─────────┘  └──────────┘  └──────────┘│                     │
│ └──────────────────────────────────────────┘                     │
│                       ↓                                           │
│ ┌──────────────────────────────────────────┐                     │
│ │   ROUND 2: Multi-Head Attention          │                     │
│ │  ┌─────────┐  ┌──────────┐  ┌──────────┐│                     │
│ │  │ Attend  │→ │ Aggregate│→ │ Propose  ││                     │
│ │  └─────────┘  └──────────┘  └──────────┘│                     │
│ └──────────────────────────────────────────┘                     │
│                       ↓                                           │
│ ┌──────────────────────────────────────────┐                     │
│ │   ROUND 3: Multi-Head Attention          │                     │
│ │  ┌─────────┐  ┌──────────┐  ┌──────────┐│                     │
│ │  │ Attend  │→ │ Aggregate│→ │ Propose  ││                     │
│ │  └─────────┘  └──────────┘  └──────────┘│                     │
│ └──────────────────────────────────────────┘                     │
└──────────────────────────────────────────────────────────────────┘
                              ↓
                  [Output Prediction Head]
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                      OUTPUT LAYER                                 │
│ ┌──────────────────────────────────────────┐                     │
│ │ Predicted Slot Logits (40 slots)         │                     │
│ │ → argmax → Final Proposed Slot           │                     │
│ └──────────────────────────────────────────┘                     │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                    EVALUATION LAYER                               │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│ │  Room    │  │ Teacher  │  │ Student  │  │ Global   │          │
│ │ Satisf.  │  │ Satisf.  │  │ Satisf.  │  │ Satisf.  │          │
│ │ Score    │  │ Score    │  │ Score    │  │ Score    │          │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow

### 1. Scenario Generation

```
ScenarioGenerator
    ↓
    ├─ Generate Rooms
    │  └─ Available slots per room
    ├─ Generate Teacher Prefs
    │  └─ Preferred & unavailable slots
    ├─ Generate Student Prefs
    │  └─ Preferred slots & constraints
    └─ Output: NegotiationScenario (JSON)
```

### 2. Model Processing

```
Scenario → Embedding Layer
    ↓
    ├─ Room info (40 dims) + constraints (4 dims) → 64 dims
    ├─ Teacher info (40 dims) + constraints (4 dims) → 64 dims
    └─ Student info (40 dims) + constraints (4 dims) → 64 dims
    ↓
[3 agents × 64 dims] → Positional Encoding
    ↓
ROUND 1: Self-Attention
    ↓ (+ Feedforward)
ROUND 2: Self-Attention
    ↓ (+ Feedforward)
ROUND 3: Self-Attention
    ↓ (+ Feedforward)
Final embeddings (3 × 64) → Mean pooling → (64)
    ↓
Output head: 64 → 40 (slot logits)
    ↓
Softmax → Probabilities
Argmax → Final slot index
```

---

## 🧠 Transformer Architecture Details

### Multi-Head Attention (Single Head)

```
Input: Q, K, V (each 64 dims, split to 16 dims per head)

Attention(Q, K, V) = softmax(Q·K^T / √16) · V

For 3 agents (Room, Teacher, Student):
  Q = [room_embedding, teacher_embedding, student_embedding]
  K = [room_embedding, teacher_embedding, student_embedding]
  V = [room_embedding, teacher_embedding, student_embedding]

Attention weights = 3×3 matrix
  [attention(room→room)      attention(room→teacher)     attention(room→student)    ]
  [attention(teacher→room)   attention(teacher→teacher)  attention(teacher→student) ]
  [attention(student→room)   attention(student→teacher)  attention(student→student)]

Interpretation: How much each agent listens to others
```

### Multi-Head Processing

```
4 Attention Heads in Parallel:
  Head 1: Focuses on availability (certain weight patterns)
  Head 2: Focuses on preferences (certain weight patterns)
  Head 3: Focuses on constraints (certain weight patterns)
  Head 4: Focuses on overall fit (certain weight patterns)

Output = Concat(Head1, Head2, Head3, Head4) → Linear Projection → d_model
```

### Transformer Layer

```
TransformerLayer(input):
    x = input                           # (3, 64) for 3 agents
    
    # Multi-head self-attention
    attn_output, attn_weights = MultiHeadAttention(x, x, x)
    x = LayerNorm(x + attn_output)     # Residual + normalize
    
    # Feed-forward network
    ff_output = FFN(x)                 # 64 → 256 → 64
    x = LayerNorm(x + ff_output)       # Residual + normalize
    
    return x, attn_weights             # (3, 64), (3, 3)
```

---

## 📦 Module Breakdown

### data_generator/scenario_generator.py

```
ScenarioGenerator
├── __init__(seed)
├── generate_all_slots()          # Returns 40 slots
├── _generate_rooms()             # 5 rooms with ~70% availability
├── _generate_teacher_preferences()
├── _generate_student_preferences()
├── generate_scenario(difficulty)  # Returns scenario dict
├── generate_batch(batch_size)     # Multiple scenarios
├── save_scenario(scenario, path)
└── load_scenario(path)

Output format:
{
  "scenario_id": str,
  "room_manager": {...},
  "teacher": {...},
  "students": {...},
  "all_possible_slots": [...],
  "target_slot": str or None,
  "difficulty": str
}
```

### model/attention.py

```
SingleHeadAttention(d_model, d_k)
├── __init__()
│   ├── W_q = Linear(d_model → d_k)
│   ├── W_k = Linear(d_model → d_k)
│   └── W_v = Linear(d_model → d_k)
└── forward(query, key, value, mask)
    ├── Q = W_q(query)
    ├── K = W_k(key)
    ├── V = W_v(value)
    ├── scores = Q·K^T / √d_k
    ├── attn_weights = softmax(scores)
    └── output = attn_weights·V

MultiHeadAttention(d_model, num_heads)
├── heads: ModuleList[SingleHeadAttention] × num_heads
├── W_o = Linear(d_model → d_model)
└── forward(query, key, value, mask)
    ├── For each head: output, weights = head(Q, K, V, mask)
    ├── Concatenate outputs
    ├── output = W_o(concat)
    └── Return output, avg_weights
```

### model/transformer.py

```
PositionalEncoding(d_model, max_length)
├── Initialize PE matrix (max_length × d_model)
├── PE[pos, 2i]   = sin(pos / 10000^(2i/d_model))
├── PE[pos, 2i+1] = cos(pos / 10000^(2i/d_model))
└── forward(x): return x + PE

TransformerLayer(d_model, num_heads, d_ff)
├── attention: MultiHeadAttention
├── feedforward: Linear → ReLU → Linear
├── norm1, norm2: LayerNorm
└── forward(x, mask):
    ├── attn_out = attention(x, x, x, mask)
    ├── x = norm1(x + attn_out)
    ├── ff_out = feedforward(x)
    ├── x = norm2(x + ff_out)
    └── return x, attn_weights

TransformerScheduler(d_model, num_heads, num_layers, d_ff)
├── input_projection: Linear((num_slots+4) → d_model)
├── positional_encoding: PositionalEncoding
├── layers: ModuleList[TransformerLayer] × num_layers
├── output_layer: Linear(d_model → num_slots)
└── forward(scenario):
    ├── embeddings = embed_scenario(scenario)
    ├── For each layer:
    │   ├── embeddings, attn = layer(embeddings)
    │   └── Store attn_weights
    ├── aggregated = mean(embeddings, dim=agents)
    ├── slot_logits = output_layer(aggregated)
    └── return {predicted_slot, attention_weights, ...}
```

### model/scheduler_model.py

```
SchedulerModel(num_slots)
├── transformer: TransformerScheduler
├── scenario_to_tensor(scenario, slot_names)
│   └── Convert scenario → torch tensors for model input
├── forward(scenario, slot_names)
│   ├── Get negotiation trace from transformer
│   ├── Evaluate satisfaction at each round
│   ├── Generate explanations
│   └── Return full result dict
├── batch_negotiate(scenarios, slot_names)
└── _explain_decision(slot, scores, scenario, slot_names)
```

### utils/satisfaction.py

```
SatisfactionEvaluator(scenario, slot_names)
├── room_satisfaction(slot)
│   └── Returns 0.0 - 1.0
├── teacher_satisfaction(slot)
│   └── Returns 0.0 - 1.0
├── student_satisfaction(slot)
│   └── Returns 0.0 - 1.0
├── evaluate_proposal(slot)
│   └── Returns {room, teacher, student, global}
└── evaluate_batch(slots)
    └── Returns list of evaluation dicts

LossFunction(scenarios, slot_names)
└── forward(predictions) → scalar loss

Metrics:
├── slot_accuracy(predictions, targets)
└── satisfaction_metric(predictions, evaluators)
```

### training/train.py

```
Trainer(model, num_slots)
├── optimizer: Adam
├── loss_fn: SatisfactionLoss
├── train_epoch(scenarios, slot_names)
│   └── Returns avg_loss, avg_satisfaction_scores
├── validate(scenarios, slot_names)
│   └── Returns validation satisfaction scores
└── train(num_epochs, val_split)
    ├── Generate training data
    ├── For each epoch:
    │   ├── train_epoch()
    │   ├── validate()
    │   └── Early stopping check
    └── Return training history

SatisfactionLoss
└── Custom loss that maximizes satisfaction
```

### api/main.py

```
FastAPI App
├── Startup: Initialize generator, model, slots
├── GET /health
├── GET /config
├── GET /slots
├── POST /generate-scenario(difficulty)
├── POST /negotiate(scenario)
├── POST /batch-negotiate(scenarios)
└── POST /explain-decision(scenario)

Pydantic Models:
├── NegotiationScenario
├── NegotiationRound
└── NegotiationResult
```

---

## 🔄 Negotiation Process Flow

### Step-by-Step Execution

```
1. INPUT
   scenario = {
     room_manager: {...},
     teacher: {...},
     students: {...}
   }

2. ENCODE
   embeddings = [room_64d, teacher_64d, student_64d]
   + positional_encoding

3. ROUND 1
   attention_1 = self_attention(embeddings)
   # Room manager attends to teacher/student info
   # Teacher attends to room/student info
   # Students attend to room/teacher info
   embeddings = feedforward(attention_output + embeddings)
   
   slot_logits_1 = output_layer(mean(embeddings))
   proposal_1 = argmax(slot_logits_1)
   
   satisf_1 = evaluate(proposal_1)

4. ROUND 2
   embeddings = apply_layer_2(embeddings)
   slot_logits_2 = output_layer(mean(embeddings))
   proposal_2 = argmax(slot_logits_2)
   satisf_2 = evaluate(proposal_2)

5. ROUND 3
   embeddings = apply_layer_3(embeddings)
   slot_logits_3 = output_layer(mean(embeddings))
   proposal_3 = argmax(slot_logits_3)
   satisf_3 = evaluate(proposal_3)

6. OUTPUT
   final_result = {
     final_slot: proposal_3,
     rounds: [
       {round: 1, proposal: proposal_1, scores: satisf_1, ...},
       {round: 2, proposal: proposal_2, scores: satisf_2, ...},
       {round: 3, proposal: proposal_3, scores: satisf_3, ...}
     ],
     success: global_satisf_3 >= THRESHOLD
   }
```

---

## 🎓 Learning Process

### Training Loop

```
FOR each epoch:
    FOR each batch of scenarios:
        1. Forward pass: get predictions
        2. Compute satisfaction for predicted slots
        3. Loss = 1 - mean(satisfaction)
        4. Backprop & update parameters
    
    Validation:
        FOR each validation scenario:
            1. Get predictions
            2. Evaluate satisfaction
        3. Average validation satisfaction

IF validation improves:
    Save best model weights
ELSE IF no improvement for 5 epochs:
    Stop training (early stopping)
```

### What Model Learns

```
Layer 1 (Round 1):
  - Basic understanding of agent constraints
  - Initial proposal formation
  - Low satisfaction (~0.6 avg)

Layer 2 (Round 2):
  - Refined understanding through attention
  - Compromise proposals
  - Better satisfaction (~0.75 avg)

Layer 3 (Round 3):
  - Convergence to acceptable solutions
  - Balanced satisfaction across agents
  - High satisfaction (~0.8+ avg)
```

---

## 💾 Data Structure Examples

### Scenario Dict
```python
{
  "scenario_id": "SCENARIO-42857",
  "timestamp": "2026-03-27T10:30:45",
  "difficulty": "medium",
  "room_manager": {
    "rooms": [
      {
        "room_id": "ROOM-001",
        "capacity": 50,
        "available_slots": ["Mo-09:00", "Mo-10:00", ...]
      },
      ...
    ],
    "total_slots_available": 40
  },
  "teacher": {
    "teacher_id": "T001",
    "preferred_slots": ["Mo-10:00", "We-14:00"],
    "unavailable_slots": ["Tu-09:00"],
    "min_slots_needed": 1
  },
  "students": {
    "group_id": "GROUP-001",
    "preferred_slots": ["Tu-10:00", "Fr-15:00"],
    "constraints": {
      "no_early_morning": False,
      "no_late_afternoon": True,
      "max_days_per_week": 3,
      "preferred_days": ["Mo", "We", "Fr"]
    }
  },
  "all_possible_slots": ["Mo-09:00", ..., "Fr-16:00"],
  "target_slot": "We-11:00"
}
```

### Negotiation Result Dict
```python
{
  "scenario_id": "SCENARIO-42857",
  "final_slot": "We-11:00",
  "negotiation_rounds": [
    {
      "round": 1,
      "proposed_slot": "Mo-10:00",
      "predicted_idx": 5,
      "slot_logits": [0.1, 0.2, ..., 0.05],  # 40 dims
      "attention_weights": [  # 3x3 matrix
        [0.4, 0.35, 0.25],   # Room manager
        [0.2, 0.6, 0.2],     # Teacher
        [0.15, 0.25, 0.6]    # Students
      ],
      "scores": {
        "room": 0.667,
        "teacher": 0.6,
        "student": 0.7,
        "global": 0.656
      },
      "explanation": "Negotiation still in progress..."
    },
    {...},  # Round 2
    {...}   # Round 3
  ],
  "final_scores": {
    "room": 0.85,
    "teacher": 0.92,
    "student": 0.78,
    "global": 0.85
  },
  "success": True
}
```

---

## 🚀 Execution Paths

### Path 1: Generate & Negotiate

```
python examples/example_run.py
    → ScenarioGenerator.generate_scenario()
    → SchedulerModel.forward()
    → SatisfactionEvaluator.evaluate_proposal()
    → NegotiationVisualizer.plot_*()
```

### Path 2: API Usage

```
HTTP Client
    → api/main.py (FastAPI)
    → POST /generate-scenario
    → ScenarioGenerator.generate_scenario()
    → Return scenario JSON
    
    → POST /negotiate
    → SchedulerModel.forward()
    → SatisfactionEvaluator.evaluate_*()
    → Return result JSON
```

### Path 3: Training

```
python examples/example_training.py
    → Trainer.train()
    → FOR epoch:
        → Trainer.train_epoch()
        → SchedulerModel.forward()
        → SatisfactionLoss computation
        → Backprop & parameter update
        → Trainer.validate()
    → Trainer.plot_training_history()
```

---

## ⚙️ Configuration Impact

```
MODEL_DIM = D
NUM_HEADS = H
NUM_LAYERS = L

Model Size ≈ D × (D + 4×D + L×(D×D + D×4×D))
           ≈ D² × (1 + 4 + L×(1 + 4))
           ≈ D² × (5 + 5L)

For D=64, H=4, L=3:
Size ≈ 4096 × (5 + 15) = 81,920 ≈ 200K params

NUM_LAYERS = number of negotiation rounds
- More layers = longer negotiation = better convergence (usually)
- But also more computation and parameters

NUM_HEADS = more parallel attention patterns
- More heads = more diverse negotiations
- But also more computation
```

---

## 🎯 Design Decisions

### Why These Choices?

| Choice | Reason |
|--------|--------|
| 64 dims | Small enough for education, large enough for expressiveness |
| 4 heads | Balance: 16 dims/head preserves detail |
| 3 layers | Matches 3 negotiation rounds conceptually |
| Satisfaction loss | Direct alignment with goal (maximize agreement) |
| Mean pooling | Aggregates agent perspectives equally |
| Positional encoding | Maintains agent identity across rounds |
| Residual connections | Stable gradient flow |
| Layer normalization | Training stability |

---

## 📈 Scalability Considerations

### Current Design (Educational)
- Fixed 3 agents (Room, Teacher, Student)
- Fixed 40 time slots
- Small model (~200K params)

### To Scale Up
```
For more agents:
  - Increase sequence length in attention
  - Adjust input projection dimensions

For more slots:
  - Increase output layer dimension
  - Might need larger d_model

For production:
  - Add caching/batching in API
  - Use GPU acceleration
  - Add database for scenario storage
  - Add authentication
```

---

This architecture balances **educational clarity** with **functional completeness** for demonstrating multi-agent negotiation via Transformers.

