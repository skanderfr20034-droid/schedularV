# SchedulingTransformer API - Quick Test Checklist

## ⚡ 5-Minute Quick Start

### 1️⃣ Import & Setup (1 min)
- [ ] Import `SchedulingTransformer_API_Postman.json` into Postman
- [ ] Create environment with `base_url = http://localhost:8000`
- [ ] Select environment (top right dropdown)

### 2️⃣ Start Server (30 sec)
```bash
cd Transformer
python api/main.py
```
Server runs at: `http://localhost:8000`
Interactive docs: `http://localhost:8000/docs`

### 3️⃣ Run Test Groups (3.5 min)
Run in order - each takes ~30 seconds:

```
Group 1: Health & Config          [1 min]
  ✓ GET  /health
  ✓ GET  /config
  ✓ GET  /slots

Group 2: Generate Scenarios       [1 min]
  ✓ POST /generate-scenario?difficulty=easy
  ✓ POST /generate-scenario?difficulty=medium
  ✓ POST /generate-scenario?difficulty=hard

Group 3: Negotiate                [1 min]
  ✓ POST /negotiate (use easy scenario)
  ✓ POST /negotiate (use medium scenario)
  ✓ POST /negotiate (use hard scenario)

Group 4: Error Handling           [0.5 min]
  ✓ POST /generate-scenario?difficulty=invalid
```

---

## 📊 All Endpoints Reference

### ✅ Working Endpoints

| Method | Endpoint | Purpose | Response |
|--------|----------|---------|----------|
| `GET` | `/health` | API status | `{status, model, num_slots, num_agents}` |
| `GET` | `/config` | Model configuration | `{model, training, agents, threshold}` |
| `GET` | `/slots` | All available slots | `{total_slots: 40, days[], hours[], slots[]}` |
| `POST` | `/generate-scenario?difficulty=easy` | Create easy scenario | Scenario JSON |
| `POST` | `/generate-scenario?difficulty=medium` | Create medium scenario | Scenario JSON |
| `POST` | `/generate-scenario?difficulty=hard` | Create hard scenario | Scenario JSON |
| `POST` | `/negotiate` | Run negotiation | `{final_slot, success, final_scores, rounds[]}` |
| `POST` | `/batch-negotiate` | Batch negotiation | `[{...}, {...}]` |
| `POST` | `/explain-decision` | Explain with attention | `{decision, convergence, trace[]}` |

---

## 🧪 Test Case Matrix

### Easy Difficulty
```
Input:  Few conflicts between preferences
Output: High satisfaction (0.8+)
Result: Success ✓
Time:   ~50ms
```

### Medium Difficulty
```
Input:  Realistic conflicts
Output: Medium satisfaction (0.6-0.8)
Result: Often success
Time:   ~50ms
```

### Hard Difficulty
```
Input:  Many conflicting preferences
Output: Lower satisfaction (0.4-0.6)
Result: May fail
Time:   ~50ms
```

---

## 📋 Step-by-Step Test Walkthroughs

### Test A: Complete Easy Flow (3 minutes)

**Step 1:** Generate Easy Scenario
```
Endpoint: POST /generate-scenario?difficulty=easy
Status:   200
Save:     Copy response → Environment variable `easy_scenario`
```

**Step 2:** Negotiate
```
Endpoint: POST /negotiate
Body:     {{easy_scenario}}
Response: {
  "final_slot": "We-11:00",
  "success": true,
  "final_scores": {"room": 0.85, "teacher": 0.92, "student": 0.78, "global": 0.85}
  "negotiation_rounds": [
    {"round": 1, "global_score": 0.656},
    {"round": 2, "global_score": 0.833},
    {"round": 3, "global_score": 0.85}
  ]
}
Check:    ✓ success=true
          ✓ global_score >= 0.7
          ✓ 3 rounds
          ✓ Improving scores
```

**Step 3:** Get Explanation
```
Endpoint: POST /explain-decision
Body:     {{easy_scenario}}
Response: {
  "final_decision": "We-11:00",
  "convergence": {"converged": true, "rounds": 3},
  "attention_weights": {...}
}
Check:    ✓ Has attention weights
          ✓ Converged
```

---

### Test B: Compare Difficulties (2 minutes)

**Run all 3:**
1. Generate easy → Negotiate
   - Expected: success=true, score 0.8+
   
2. Generate medium → Negotiate
   - Expected: success=maybe, score 0.6-0.8
   
3. Generate hard → Negotiate
   - Expected: success=maybe, score <0.7

**Compare results:**
- Easy always wins
- Hard always hardest
- Pattern consistent

---

### Test C: Batch Processing (1 minute)

**Create batch of 3:**
```
POST /batch-negotiate
Body: [scenario1, scenario2, scenario3]

Response: [{result1}, {result2}, {result3}]
Time: ~200ms vs 3×50ms individual = parallel processing ✓
```

---

## ⚠️ Common Pitfalls

| Issue | Solution |
|-------|----------|
| Connection refused | Start API: `python api/main.py` |
| {{variable}} not replaced | Check environment selected (top right) |
| Timeout error | Increase timeout in Postman Settings |
| Invalid JSON body | Use Postman's Format tool (Ctrl+Shift+P) |
| Empty response | Check API logs for errors |

---

## 🎯 Success Criteria

### All tests pass if:
- [ ] Health check returns status="healthy"
- [ ] Can generate scenarios (all 3 difficulties)
- [ ] Can negotiate (returns valid slots)
- [ ] Scores are 0-1 range
- [ ] Global score = (room + teacher + student) / 3
- [ ] Success = (global >= 0.7)
- [ ] 3 negotiation rounds each
- [ ] Batch processes multiple scenarios
- [ ] Invalid requests return errors
- [ ] Response time <100ms

---

## 📊 Expected Scores by Difficulty

```
EASY SCENARIO
Room:      0.80 - 1.00
Teacher:   0.85 - 1.00
Student:   0.75 - 0.95
Global:    0.80 - 0.98
Success:   ✓ (98%)

MEDIUM SCENARIO
Room:      0.60 - 0.90
Teacher:   0.60 - 0.90
Student:   0.55 - 0.85
Global:    0.60 - 0.88
Success:   ✓ (70%)

HARD SCENARIO
Room:      0.40 - 0.80
Teacher:   0.40 - 0.80
Student:   0.30 - 0.70
Global:    0.40 - 0.77
Success:   ✓ (30%)
```

---

## 🔍 Reading Attention Weights

### What Attention Means
`room_manager.attends_to_teacher = 0.35`
→ Room manager allocates 35% of decision-making weight to teacher preferences

### Healthy Pattern
```
Round 1: Agents exploring = distributed attention
         room_manager: [0.3 teacher, 0.25-0.3 students]
         
Round 2: Agents adapting = attention concentrates
         room_manager: [0.4 teacher, 0.2 students]
         
Round 3: Agents agreed = stable attention
         room_manager: [0.35 teacher, 0.25 students]
         (same as round 2-3)
```

### Unhealthy Pattern
```
No change in attention = Not learning / negotiating
All agents highest attention to self = Ignoring others
Extremely low attention = Dismissing others
```

---

## 💾 Data to Collect (Optional)

Run all tests and save:

```javascript
// After each test group, run in Console:
console.table({
  test: "Group 3 - Easy",
  response_time: pm.response.responseTime,
  success_rate: "100%",
  avg_score: 0.85
});
```

Then compile results:

| Group | Tests | Avg Time | Success | Avg Score |
|-------|-------|----------|---------|-----------|
| Configuration | 3 | 8ms | 100% | N/A |
| Scenarios | 3 | 45ms | 100% | N/A |
| Easy Negotiate | 1 | 52ms | ✓ | 0.85 |
| Medium Negotiate | 1 | 48ms | ✓ | 0.72 |
| Hard Negotiate | 1 | 51ms | ✗ | 0.55 |
| Batch (3) | 1 | 180ms | ✓ | 0.70 |
| Errors | 2 | 5ms | ✓ | N/A |

---

## 🚀 Next After Testing

Once all tests pass:

1. **Review API patterns** - How to integrate into your app
2. **Test with custom scenarios** - Modify preferences, see AI adapt
3. **Performance test** - Send 100 requests, check timing
4. **Error recovery** - Test partial failures, retries
5. **Production deployment** - Docker/cloud setup

---

## 📚 Additional Resources

- **Full testing guide:** `POSTMAN_TESTING_GUIDE.md`
- **API documentation:** `API_DOCUMENTATION.md`
- **Architecture details:** `ARCHITECTURE.md`
- **Implementation checklist:** `IMPLEMENTATION_SUMMARY.md`
- **Interactive docs:** `http://localhost:8000/docs`

---

## ✨ Tips for Most Success

1. **Run in order** - Later tests depend on earlier ones
2. **Check response format** - Not just status, but structure too
3. **Understand scores** - Not "right/wrong" but "satisfaction"
4. **Watch the rounds** - See negotiation evolution
5. **Try variations** - Change scenarios slightly, see adaptability

---

**Ready to test? Start here:**

```bash
# Terminal 1: Start API
python api/main.py

# Terminal 2: Or Postman UI
# 1. Import collection
# 2. Select environment
# 3. Run tests in order
```

Good luck! 🎯
