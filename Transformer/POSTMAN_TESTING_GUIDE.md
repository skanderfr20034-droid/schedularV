# SchedulingTransformer API - Postman Testing Guide

Complete guide to test all API endpoints using Postman with detailed test cases and expected responses.

---

## 📦 Setup

### Step 1: Import Collection

1. Open Postman
2. Click **Import** (top left)
3. Select **SchedulingTransformer_API_Postman.json**
4. Click **Import**

### Step 2: Configure Environment

1. Create new environment: **New** → **Environment**
2. Set `base_url` = `http://localhost:8000`
3. Save and select this environment

### Step 3: Start API Server

```bash
python api/main.py
```

Server will run on: **http://localhost:8000**

Interactive docs: **http://localhost:8000/docs**

---

## 🧪 Test Cases by Category

---

## **SECTION 1: Health & Configuration** (Verify API is running)

### Test 1.1: Health Check
**Endpoint:** `GET /health`

**Expected Status:** `200`

**Expected Response:**
```json
{
  "status": "healthy",
  "model": "SchedulingTransformer",
  "num_slots": 40,
  "num_agents": 3
}
```

**What to verify:**
- ✓ Status is "healthy"
- ✓ Model name matches
- ✓ 40 slots available
- ✓ 3 agents

---

### Test 1.2: Get Configuration
**Endpoint:** `GET /config`

**Expected Status:** `200`

**Expected Response:**
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

**What to verify:**
- ✓ Model has 64 embedding dimensions
- ✓ 4 attention heads
- ✓ 3 transformer layers (rounds)
- ✓ All 3 agents listed

---

### Test 1.3: Get Available Slots
**Endpoint:** `GET /slots`

**Expected Status:** `200`

**Expected Response:**
```json
{
  "total_slots": 40,
  "days": ["Mo", "Tu", "We", "Th", "Fr"],
  "hours": ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"],
  "slots": [
    "Mo-09:00", "Mo-10:00", ..., "Fr-16:00"  // 40 total
  ]
}
```

**What to verify:**
- ✓ Total 40 slots
- ✓ 5 days (Mon-Fri)
- ✓ 8 hours (9 AM - 4 PM)
- ✓ Slot naming format is correct

---

## **SECTION 2: Scenario Generation** (Create negotiation scenarios)

### Test 2.1: Generate Easy Scenario
**Endpoint:** `POST /generate-scenario?difficulty=easy`

**Expected Status:** `200`

**Expected Response Structure:**
```json
{
  "scenario_id": "SCENARIO-XXXXX",
  "timestamp": "2026-03-27T...",
  "difficulty": "easy",
  "room_manager": {
    "rooms": [
      {
        "room_id": "ROOM-001",
        "capacity": 45,
        "available_slots": [...]
      },
      // 5 rooms total
    ],
    "total_slots_available": 40
  },
  "teacher": {
    "teacher_id": "T001",
    "preferred_slots": ["Mo-10:00", "We-14:00"],  // 2 preferred
    "unavailable_slots": ["Tu-09:00"],             // 2 unavailable
    "min_slots_needed": 1
  },
  "students": {
    "group_id": "GROUP-001",
    "preferred_slots": ["Tu-10:00", "Fr-15:00"],
    "constraints": {
      "no_early_morning": true/false,
      "no_late_afternoon": true/false,
      "max_days_per_week": 3,
      "preferred_days": ["Mo", "We", "Fr"]
    }
  },
  "all_possible_slots": [...40 slots...],
  "target_slot": "We-11:00"  // ground truth
}
```

**What to verify:**
- ✓ Scenario ID generated
- ✓ 5 rooms present
- ✓ Teacher has preferred/unavailable slots
- ✓ Students have constraints
- ✓ All 40 slots included
- ✓ Target slot provided

**Save this response for later tests!**

**In Postman:**
- After request, go to **Tests** tab
- Add test to save scenario:
```javascript
pm.environment.set("easy_scenario", JSON.stringify(pm.response.json()));
```

---

### Test 2.2: Generate Medium Scenario
**Endpoint:** `POST /generate-scenario?difficulty=medium`

**Expected Status:** `200`

**Key Differences from Easy:**
- More conflicts between preferences
- More constraints
- More challenging negotiation

**Verification:**
- ✓ Same structure as easy
- ✓ Difficulty = "medium"
- ✓ More unavailable slots for teacher
- ✓ More constraints for students

**Save scenario:**
```javascript
pm.environment.set("medium_scenario", JSON.stringify(pm.response.json()));
```

---

### Test 2.3: Generate Hard Scenario
**Endpoint:** `POST /generate-scenario?difficulty=hard`

**Expected Status:** `200`

**Key Differences:**
- Many conflicting preferences
- Restrictive constraints
- Difficult to find consensus

**Verification:**
- ✓ Same structure
- ✓ Difficulty = "hard"
- ✓ More unavailable slots
- ✓ More constraints

**Save scenario:**
```javascript
pm.environment.set("hard_scenario", JSON.stringify(pm.response.json()));
```

---

## **SECTION 3: Single Negotiation** (Main functionality)

### Test 3.1: Negotiate Easy Scenario
**Endpoint:** `POST /negotiate`

**Body:** (Use easy scenario from Test 2.1)
```json
{
  // Paste the entire scenario from 2.1 here
}
```

**Expected Status:** `200`

**Expected Response:**
```json
{
  "scenario_id": "SCENARIO-XXXXX",
  "final_slot": "We-11:00",  // Proposed time slot
  "success": true,            // If global_score >= 0.7
  "final_scores": {
    "room": 0.85,             // 0-1 scale
    "teacher": 0.92,
    "student": 0.78,
    "global": 0.85            // Average
  },
  "negotiation_rounds": [
    {
      "round": 1,
      "proposed_slot": "Mo-10:00",
      "predicted_idx": 5,      // Index in slots array
      "scores": {
        "room": 0.667,
        "teacher": 0.6,
        "student": 0.7,
        "global": 0.656
      },
      "explanation": "Negotiation still in progress. (room available, students can attend)"
    },
    // Round 2
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
      "explanation": "Good compromise found..."
    },
    // Round 3
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
      "explanation": "Excellent agreement across all agents..."
    }
  ]
}
```

**What to verify:**
- ✓ Three negotiation rounds
- ✓ Proposed slot is valid (from slots list)
- ✓ Scores between 0 and 1
- ✓ Global score is average of three agents
- ✓ Success = true if global >= 0.7
- ✓ Scores improve over rounds (usually)
- ✓ Round 1 < Round 2 < Round 3 (convergence)

**Test Script:**
```javascript
// Add to Tests tab
const resp = pm.response.json();

pm.test("Response has required fields", function() {
    pm.expect(resp).to.have.property('final_slot');
    pm.expect(resp).to.have.property('final_scores');
    pm.expect(resp).to.have.property('negotiation_rounds');
});

pm.test("Final scores are valid", function() {
    pm.expect(resp.final_scores.global).to.be.below(1.1);
    pm.expect(resp.final_scores.global).to.be.above(-0.1);
});

pm.test("Has 3 negotiation rounds", function() {
    pm.expect(resp.negotiation_rounds).to.have.lengthOf(3);
});

pm.test("Success flag matches threshold", function() {
    const threshold = 0.7;
    pm.expect(resp.success).to.equal(resp.final_scores.global >= threshold);
});
```

---

### Test 3.2: Negotiate Medium Scenario
**Endpoint:** `POST /negotiate`

**Body:** Use medium scenario from Test 2.2

**Expected Status:** `200`

**Verification:**
- ✓ Same structure as Test 3.1
- ✓ Scores may be lower (more conflicts)
- ✓ Success might be false
- ✓ More rounds to converge

---

### Test 3.3: Negotiate Hard Scenario
**Endpoint:** `POST /negotiate`

**Body:** Use hard scenario from Test 2.3

**Expected Status:** `200`

**Verification:**
- ✓ Same structure
- ✓ Scores typically lower
- ✓ Success = false is acceptable
- ✓ Final slot represents best compromise

---

## **SECTION 4: Detailed Explanation** (Why this slot?)

### Test 4.1: Explain Decision - Easy
**Endpoint:** `POST /explain-decision`

**Body:** Easy scenario

**Expected Status:** `200`

**Expected Response:**
```json
{
  "scenario_id": "SCENARIO-XXXXX",
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
      "scores": {...},
      "explanation": "...",
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
    // Rounds 2, 3 with attention weights
  ]
}
```

**Key Features to Verify:**
- ✓ Convergence info provided
- ✓ Attention weights for each agent
- ✓ Weights sum close to 1.0 (softmax)
- ✓ Shows "listening patterns"
- ✓ Explainability of decision process

**Interpret Attention Weights:**
- `room_manager.attends_to_teacher = 0.35` → Room manager heavily influenced by teacher
- `teacher.attends_to_room = 0.2` → Teacher less influenced by room manager
- `students.attends_to_teacher = 0.25` → Students listen to teacher

---

### Test 4.2: Explain Decision - Medium
**Endpoint:** `POST /explain-decision`

**Body:** Medium scenario

**Expected Status:** `200`

**Verification:**
- ✓ Attention weights may be different
- ✓ Convergence may show false
- ✓ More variation in agent listening patterns

---

## **SECTION 5: Batch Operations** (Process multiple scenarios)

### Test 5.1: Batch Negotiate - 3 Easy
**Endpoint:** `POST /batch-negotiate`

**Setup:**
1. Run Test 2.1 three times to get 3 easy scenarios
2. Save each: `s1`, `s2`, `s3`

**Body:**
```json
[
  // Paste scenario 1
  {},
  // Paste scenario 2
  {},
  // Paste scenario 3
  {}
]
```

**Expected Status:** `200`

**Expected Response:**
```json
[
  { // Result 1
    "scenario_id": "SCENARIO-xxxxx",
    "final_slot": "...",
    "success": true,
    "final_scores": {...},
    "negotiation_rounds": [...]
  },
  { // Result 2
    ...
  },
  { // Result 3
    ...
  }
]
```

**What to verify:**
- ✓ Returns array of 3 results
- ✓ Each has complete negotiation data
- ✓ Takes longer than single request

**Response time expectation:**
- Single: ~50-100ms
- Batch 3: ~150-300ms
- Batch 10: ~500-1000ms

---

### Test 5.2: Batch Negotiate - Mixed Difficulty
**Endpoint:** `POST /batch-negotiate`

**Body:**
```json
[
  // Easy scenario
  {},
  // Medium scenario
  {},
  // Hard scenario
  {}
]
```

**Expected Status:** `200`

**What to verify:**
- ✓ Processes all three
- ✓ Easy shows high success rate
- ✓ Medium shows mixed
- ✓ Hard shows lower satisfaction

---

## **SECTION 6: Error Cases** (Test error handling)

### Test 6.1: Invalid Difficulty
**Endpoint:** `POST /generate-scenario?difficulty=impossible`

**Expected Status:** `400`

**Expected Response:**
```json
{
  "detail": "Difficulty must be 'easy', 'medium', or 'hard'"
}
```

**Test Script:**
```javascript
pm.test("Returns 400 for invalid difficulty", function() {
    pm.response.to.have.status(400);
});

pm.test("Error message is clear", function() {
    const resp = pm.response.json();
    pm.expect(resp.detail).to.include("Difficulty");
});
```

---

### Test 6.2: Invalid Scenario Format
**Endpoint:** `POST /negotiate`

**Body:**
```json
{
  "invalid": "data",
  "missing": "all required fields"
}
```

**Expected Status:** `500` or `422`

**What happens:**
- API tries to process invalid scenario
- Either validation error (422) or processing error (500)

**Test Script:**
```javascript
pm.test("Returns error for invalid scenario", function() {
    const status = pm.response.code;
    pm.expect([422, 500]).to.include(status);
});
```

---

### Test 6.3: Empty Batch
**Endpoint:** `POST /batch-negotiate`

**Body:**
```json
[]
```

**Expected Status:** `200` (or 400)

**What to verify:**
- ✓ Either processes empty batch (returns [])
- ✓ Or returns appropriate error

---

## **SECTION 7: Performance Tests**

### Test 7.1: Single Request Timing
**Endpoint:** `POST /negotiate`

**Setup:**
1. Prepare medium scenario
2. Go to collection settings
3. Set timeout to 5000ms

**Verify Response Time:**
```javascript
pm.test("Negotiation completes in <100ms", function() {
    pm.expect(pm.response.responseTime).to.be.below(100);
});
```

**Expected:** <100ms

---

### Test 7.2: Batch Performance
**Endpoint:** `POST /batch-negotiate`

**Body:** 10 medium scenarios

**Test Script:**
```javascript
pm.test("Batch of 10 completes in <1000ms", function() {
    pm.expect(pm.response.responseTime).to.be.below(1000);
});

pm.test("Average time per scenario", function() {
    const totalTime = pm.response.responseTime;
    const avgTime = totalTime / 10;
    console.log(`Average: ${avgTime.toFixed(2)}ms per scenario`);
    pm.expect(avgTime).to.be.below(100);
});
```

**Expected:** ~50-100ms per scenario

---

## **COMPLETE TEST WORKFLOW** (Do this end-to-end)

### Quick Full Test (10 minutes)

```
1. Start API
   → python api/main.py

2. Run Health Check (1.1)
   → Should return healthy

3. Get Config (1.2)
   → Verify model dimensions

4. Generate 3 Scenarios (2.1, 2.2, 2.3)
   → Save easy, medium, hard

5. Negotiate Easy (3.1)
   → Verify 3 rounds, increasing satisfaction

6. Negotiate Medium (3.2)
   → Should show some conflicts

7. Negotiate Hard (3.3)
   → May not reach high satisfaction

8. Explain Easy (4.1)
   → Check attention weights

9. Batch 3 Scenarios (5.1)
   → Process all at once

10. Error Case (6.1)
    → Test invalid difficulty

11. Performance (7.1)
    → Check timing <100ms
```

---

## **Data Interpretation Guide**

### Room Manager Satisfaction
- **1.0** = Room available in all rooms
- **0.5** = Available in some rooms
- **0.0** = Not available anywhere

### Teacher Satisfaction
- **1.0** = Slot in preferred list
- **0.6** = Available (not in unavailable)
- **0.0** = In unavailable slots

### Student Satisfaction
- **1.0** = Slot in preferred list
- **0.7** = Available, fits constraints
- **0.5** = Conflicts with some constraints

### Global Satisfaction
- **≥0.8** = Excellent agreement
- **0.6-0.8** = Good compromise
- **0.4-0.6** = Acceptable
- **<0.4** = Poor fit

### Success Threshold
- **Global ≥ 0.7** = Success ✓
- **Global < 0.7** = Needs more negotiation

---

## **Common Issues & Solutions**

### Issue: Connection Refused
```
Error: Cannot reach http://localhost:8000
Solution: Start API server first
  python api/main.py
```

### Issue: Timeout
```
Error: Request timeout
Solution: Increase Postman timeout
  Settings → General → Request timeout: 10000ms
```

### Issue: Invalid JSON in Body
```
Error: Invalid JSON
Solution: Use Postman's pretty-print
  Body tab → Format option (Ctrl+Shift+P)
```

### Issue: Environment Variables Not Working
```
Error: {{variable}} not replaced
Solution: Check if environment is selected
  Top right → Dropdown should show environment name
```

---

## **Postman Tips & Tricks**

### 1. Save Responses as Variables
```javascript
// In Tests tab
pm.environment.set("last_result", JSON.stringify(pm.response.json()));
```

### 2. Chain Requests (Run Generate then Negotiate)
```javascript
// After Generate request succeeds
pm.environment.set("scenario", JSON.stringify(pm.response.json()));

// Include in next request body
// Use {{scenario}} in body
```

### 3. Run Collection Sequentially
1. Click collection name
2. Click **Run**
3. Select folder (e.g., "SECTION 1")
4. Click **Run** button

### 4. Export Results
1. After running tests
2. Click **Results** → **Export**
3. Save as HTML

### 5. Monitor Performance
1. Open **Console** (bottom left)
2. Run request
3. Check response time

---

## **Expected Test Results Summary**

```
[SECTION 1] Health & Config
  ✓ 1.1 Health Check             200 OK
  ✓ 1.2 Configuration             200 OK
  ✓ 1.3 Slots                     200 OK

[SECTION 2] Scenario Generation
  ✓ 2.1 Easy Scenario             200 OK
  ✓ 2.2 Medium Scenario           200 OK
  ✓ 2.3 Hard Scenario             200 OK

[SECTION 3] Single Negotiation
  ✓ 3.1 Easy Negotiation          200 OK (high success)
  ✓ 3.2 Medium Negotiation        200 OK (medium success)
  ✓ 3.3 Hard Negotiation          200 OK (low success)

[SECTION 4] Explanation
  ✓ 4.1 Explain Easy              200 OK
  ✓ 4.2 Explain Medium            200 OK

[SECTION 5] Batch
  ✓ 5.1 Batch 3 Easy              200 OK
  ✓ 5.2 Batch Mixed               200 OK

[SECTION 6] Errors
  ✓ 6.1 Invalid Difficulty        400 Bad Request
  ✓ 6.2 Invalid Scenario          500/422 Error
  ✓ 6.3 Empty Batch               200 OK

[SECTION 7] Performance
  ✓ 7.1 Single ~50ms              ✓
  ✓ 7.2 Batch 10 ~600ms           ✓
```

---

## 🎯 **Next Steps**

1. **Import collection** in Postman
2. **Set base_url** environment variable
3. **Start API** server
4. **Run all tests** in order
5. **Check responses** against expected
6. **Analyze results** for correctness

**Happy Testing!** 🚀
