# SchedulingTransformer API Documentation

Complete REST API reference for the SchedulingTransformer system.

## 🚀 Getting Started

### Start the Server

```bash
python api/main.py
```

Server runs on: **http://localhost:8000**

### Interactive Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## 📡 API Endpoints

### 1. Health Check

**Endpoint:** `GET /health`

Check if API is running.

**Request:**
```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy",
  "model": "SchedulingTransformer",
  "num_slots": 40,
  "num_agents": 3
}
```

---

### 2. Get Configuration

**Endpoint:** `GET /config`

Get model configuration and parameters.

**Request:**
```bash
curl http://localhost:8000/config
```

**Response:**
```json
{
  "model": {
    "embedding_dim": 64,
    "num_heads": 4,
    "num_layers": 3,
    "feedforward_dim": 256,
    "dropout": 0.1
  },
  "training": {
    "batch_size": 32,
    "learning_rate": 0.001,
    "epochs": 50
  },
  "agents": {
    "room_manager": "Provides available rooms and time slots",
    "teacher": "Provides preferred time slots and constraints",
    "students": "Provides group preferences and constraints"
  },
  "satisfaction_threshold": 0.7
}
```

---

### 3. Get Available Slots

**Endpoint:** `GET /slots`

Get all available time slots.

**Request:**
```bash
curl http://localhost:8000/slots
```

**Response:**
```json
{
  "total_slots": 40,
  "days": ["Mo", "Tu", "We", "Th", "Fr"],
  "hours": ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"],
  "slots": [
    "Mo-09:00", "Mo-10:00", "Mo-11:00", "Mo-12:00", "Mo-13:00", "Mo-14:00", "Mo-15:00", "Mo-16:00",
    "Tu-09:00", "Tu-10:00", /* ... */
    "Fr-16:00"
  ]
}
```

---

### 4. Generate Scenario

**Endpoint:** `POST /generate-scenario`

Generate a random negotiation scenario.

**Parameters:**
- `difficulty` (query): "easy", "medium", or "hard" (default: "medium")

**Request:**
```bash
curl -X POST "http://localhost:8000/generate-scenario?difficulty=medium"
```

**Response:**
```json
{
  "scenario_id": "SCENARIO-42857",
  "timestamp": "2026-03-27T10:30:45.123456",
  "difficulty": "medium",
  "room_manager": {
    "rooms": [
      {
        "room_id": "ROOM-001",
        "capacity": 45,
        "available_slots": ["Mo-09:00", "Mo-10:00", "Tu-11:00", /* ... */]
      },
      /* ... more rooms ... */
    ],
    "total_slots_available": 40
  },
  "teacher": {
    "teacher_id": "T001",
    "preferred_slots": ["Mo-10:00", "We-14:00"],
    "unavailable_slots": ["Tu-09:00", "Th-13:00"],
    "min_slots_needed": 1
  },
  "students": {
    "group_id": "GROUP-001",
    "preferred_slots": ["Tu-10:00", "Fr-15:00"],
    "constraints": {
      "no_early_morning": false,
      "no_late_afternoon": true,
      "max_days_per_week": 3,
      "preferred_days": ["Mo", "We", "Fr"]
    }
  },
  "all_possible_slots": [/* all 40 slots */],
  "target_slot": "We-11:00"
}
```

**Difficulty Levels:**
- **easy:** Few conflicts, easy to find consensus
- **medium:** Realistic conflicts and constraints
- **hard:** Many conflicts, challenging negotiation

---

### 5. Run Negotiation

**Endpoint:** `POST /negotiate`

Run negotiation for a given scenario.

**Request Body:** NegotiationScenario (from /generate-scenario)

**Request (Python):**
```python
import requests

scenario = requests.post(
    "http://localhost:8000/generate-scenario?difficulty=medium"
).json()

result = requests.post(
    "http://localhost:8000/negotiate",
    json=scenario
).json()
```

**Request (cURL):**
```bash
curl -X POST http://localhost:8000/negotiate \
  -H "Content-Type: application/json" \
  -d @scenario.json
```

**Response:**
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
      "predicted_idx": 5,
      "scores": {
        "room": 0.667,
        "teacher": 0.6,
        "student": 0.7,
        "global": 0.656
      },
      "explanation": "Negotiation still in progress. (room available, students can attend)"
    },
    {
      "round": 2,
      "proposed_slot": "We-11:00",
      "predicted_idx": 19,
      "scores": {
        "room": 0.85,
        "teacher": 0.9,
        "student": 0.75,
        "global": 0.833
      },
      "explanation": "Good compromise found. (room available, teacher preferred, students satisfied)"
    },
    {
      "round": 3,
      "proposed_slot": "We-11:00",
      "predicted_idx": 19,
      "scores": {
        "room": 0.85,
        "teacher": 0.92,
        "student": 0.78,
        "global": 0.85
      },
      "explanation": "Excellent agreement across all agents. (room available, teacher preferred, students satisfied)"
    }
  ]
}
```

**Response Fields:**
- `scenario_id` - Unique scenario ID
- `final_slot` - Proposed final time slot
- `success` - True if global_score >= satisfaction_threshold
- `final_scores` - Satisfaction scores (0-1)
- `negotiation_rounds` - List of rounds with details

---

### 6. Batch Negotiation

**Endpoint:** `POST /batch-negotiate`

Run negotiation on multiple scenarios at once.

**Request Body:** List[NegotiationScenario]

**Request (Python):**
```python
import requests

# Generate 3 scenarios
scenarios = [
    requests.post("http://localhost:8000/generate-scenario").json()
    for _ in range(3)
]

# Batch negotiate
results = requests.post(
    "http://localhost:8000/batch-negotiate",
    json=scenarios
).json()
```

**Response:**
```json
[
  {
    "scenario_id": "SCENARIO-42857",
    "final_slot": "We-11:00",
    "success": true,
    /* ... same as /negotiate response ... */
  },
  {
    "scenario_id": "SCENARIO-51234",
    "final_slot": "Mo-14:00",
    "success": true,
    /* ... */
  },
  {
    "scenario_id": "SCENARIO-67890",
    "final_slot": "Fr-10:00",
    "success": false,
    /* ... */
  }
]
```

---

### 7. Explain Decision

**Endpoint:** `POST /explain-decision`

Get detailed explanation of negotiation process including attention patterns.

**Request:**
```python
import requests

scenario = requests.post(
    "http://localhost:8000/generate-scenario"
).json()

explanation = requests.post(
    "http://localhost:8000/explain-decision",
    json=scenario
).json()
```

**Response:**
```json
{
  "scenario_id": "SCENARIO-42857",
  "final_decision": "We-11:00",
  "final_satisfaction": {
    "room": 0.85,
    "teacher": 0.92,
    "student": 0.78,
    "global": 0.85
  },
  "success": true,
  "convergence": {
    "converged": true,
    "final_global_score": 0.85,
    "num_rounds": 3
  },
  "negotiation_trace": [
    {
      "round": 1,
      "proposed_slot": "Mo-10:00",
      "scores": {
        "room": 0.667,
        "teacher": 0.6,
        "student": 0.7,
        "global": 0.656
      },
      "explanation": "Negotiation still in progress...",
      "attention_weights_summary": {
        "room_manager": {
          "attends_to_teacher": 0.35,
          "attends_to_students": 0.25
        },
        "teacher": {
          "attends_to_room": 0.2,
          "attends_to_students": 0.2
        },
        "students": {
          "attends_to_room": 0.15,
          "attends_to_teacher": 0.25
        }
      }
    },
    /* ... more rounds ... */
  ]
}
```

**Key Information:**
- `final_decision` - Proposed time slot
- `convergence` - Did negotiation converge?
- `negotiation_trace` - Round-by-round with attention analysis
- `attention_weights_summary` - How much each agent listened to others

---

## 💻 Usage Examples

### Example 1: Complete Workflow in Python

```python
import requests
import json

BASE_URL = "http://localhost:8000"

# Step 1: Get config
config = requests.get(f"{BASE_URL}/config").json()
print("Model configuration:", config['model'])

# Step 2: Generate scenario
scenario = requests.post(
    f"{BASE_URL}/generate-scenario?difficulty=hard"
).json()
print(f"Generated scenario: {scenario['scenario_id']}")

# Step 3: Run negotiation
result = requests.post(
    f"{BASE_URL}/negotiate",
    json=scenario
).json()
print(f"\nFinal decision: {result['final_slot']}")
print(f"Successful: {result['success']}")
print(f"Global satisfaction: {result['final_scores']['global']:.3f}")

# Step 4: Get detailed explanation
explanation = requests.post(
    f"{BASE_URL}/explain-decision",
    json=scenario
).json()

print("\nAttention patterns (final round):")
attn = explanation['negotiation_trace'][-1]['attention_weights_summary']
print(f"  Room Manager listens to Teacher: {attn['room_manager']['attends_to_teacher']:.3f}")
print(f"  Teacher listens to Room Manager: {attn['teacher']['attends_to_room']:.3f}")
print(f"  Students listen to Teacher: {attn['students']['attends_to_teacher']:.3f}")
```

### Example 2: Batch Processing

```python
import requests

BASE_URL = "http://localhost:8000"

# Generate 10 scenarios
print("Generating 10 scenarios...")
scenarios = []
for i in range(10):
    s = requests.post(
        f"{BASE_URL}/generate-scenario?difficulty=medium"
    ).json()
    scenarios.append(s)

# Batch negotiate
print("Running batch negotiation...")
results = requests.post(
    f"{BASE_URL}/batch-negotiate",
    json=scenarios
).json()

# Statistics
successful = sum(1 for r in results if r['success'])
avg_satisfaction = sum(r['final_scores']['global'] for r in results) / len(results)

print(f"\nResults:")
print(f"  Successful: {successful}/10 ({100*successful/10:.0f}%)")
print(f"  Average satisfaction: {avg_satisfaction:.3f}")
```

### Example 3: cURL Commands

```bash
# Get health
curl http://localhost:8000/health

# Get config
curl http://localhost:8000/config | jq .

# Generate scenario
curl -X POST "http://localhost:8000/generate-scenario?difficulty=hard" > scenario.json

# Negotiate
curl -X POST http://localhost:8000/negotiate \
  -H "Content-Type: application/json" \
  -d @scenario.json | jq .

# Explain decision
curl -X POST http://localhost:8000/explain-decision \
  -H "Content-Type: application/json" \
  -d @scenario.json | jq '.negotiation_trace[-1]'
```

---

## 🔍 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (e.g., invalid difficulty) |
| 503 | Service unavailable (model not initialized) |
| 500 | Internal server error |

---

## ⚡ Performance

- **Response time:** <100ms per negotiation (CPU)
- **Batch processing:** ~20ms overhead per scenario
- **Concurrent requests:** Handled sequentially (FastAPI default)

---

## 🔒 Notes

- No authentication required (development API)
- No rate limiting
- CORS enabled (accept all origins)
- No data persistence (in-memory)

---

## 🚀 Integration Examples

### With Your Web App

```javascript
// JavaScript/Fetch
async function generateScenario() {
  const response = await fetch('http://localhost:8000/generate-scenario', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'}
  });
  return response.json();
}

async function negotiate(scenario) {
  const response = await fetch('http://localhost:8000/negotiate', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(scenario)
  });
  return response.json();
}
```

### With Your Backend

```python
# Python/FastAPI
from httpx import AsyncClient

async def call_scheduler(scenario):
    async with AsyncClient() as client:
        result = await client.post(
            "http://localhost:8000/negotiate",
            json=scenario
        )
        return result.json()
```

---

## 📚 Data Models

### NegotiationScenario
```python
{
  "scenario_id": str,
  "timestamp": str,
  "difficulty": str,  # "easy", "medium", "hard"
  "room_manager": {
    "rooms": List[Room],
    "total_slots_available": int
  },
  "teacher": {
    "teacher_id": str,
    "preferred_slots": List[str],
    "unavailable_slots": List[str],
    "min_slots_needed": int
  },
  "students": {
    "group_id": str,
    "preferred_slots": List[str],
    "constraints": Dict[str, Any]
  },
  "all_possible_slots": List[str],
  "target_slot": Optional[str]
}
```

### NegotiationResult
```python
{
  "scenario_id": str,
  "final_slot": str,
  "success": bool,
  "final_scores": {
    "room": float,        # 0-1
    "teacher": float,     # 0-1
    "student": float,     # 0-1
    "global": float       # 0-1
  },
  "negotiation_rounds": List[NegotiationRound]
}
```

---

## 🎯 Next Steps

1. Start API: `python api/main.py`
2. Visit: http://localhost:8000/docs (interactive docs)
3. Run tests: `python examples/example_api.py`
4. Integrate into your app!

---

**Happy negotiating!** 🚀
