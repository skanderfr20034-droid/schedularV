"""
Example 2: API Usage
Demonstrates how to interact with the SchedulingTransformer API.

Run the API first:
  python api/main.py

Then in another terminal:
  python examples/example_api.py
"""

import requests
import json
import time
from typing import Dict, List, Any

# API base URL
API_URL = "http://localhost:8000"


def print_response(title: str, response: Dict[str, Any], indent: int = 0):
    """Pretty print API response."""
    prefix = "  " * indent
    print(f"{prefix}{title}")
    print(f"{prefix}{'-' * (len(title))}")
    print(json.dumps(response, indent=2))


def example_health_check():
    """Check if API is healthy."""
    print("\n" + "=" * 70)
    print("EXAMPLE 1: Health Check")
    print("=" * 70)
    
    print("\n→ GET /health")
    try:
        response = requests.get(f"{API_URL}/health")
        response.raise_for_status()
        print_response("Response:", response.json())
        return True
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to API. Make sure the server is running!")
        print("  Run: python api/main.py")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def example_get_config():
    """Get model configuration."""
    print("\n" + "=" * 70)
    print("EXAMPLE 2: Get Configuration")
    print("=" * 70)
    
    print("\n→ GET /config")
    response = requests.get(f"{API_URL}/config")
    response.raise_for_status()
    print_response("Response:", response.json())


def example_get_slots():
    """Get all available time slots."""
    print("\n" + "=" * 70)
    print("EXAMPLE 3: Get All Time Slots")
    print("=" * 70)
    
    print("\n→ GET /slots")
    response = requests.get(f"{API_URL}/slots")
    response.raise_for_status()
    data = response.json()
    
    print(f"Total slots: {data['total_slots']}")
    print(f"Days: {data['days']}")
    print(f"Hours: {data['hours']}")
    print(f"Slot examples: {data['slots'][:5]} ... (showing first 5 of {len(data['slots'])})")


def example_generate_scenario():
    """Generate a random scenario."""
    print("\n" + "=" * 70)
    print("EXAMPLE 4: Generate Scenario")
    print("=" * 70)
    
    print("\n→ POST /generate-scenario?difficulty=medium")
    response = requests.post(f"{API_URL}/generate-scenario?difficulty=medium")
    response.raise_for_status()
    scenario = response.json()
    
    print(f"Scenario ID: {scenario['scenario_id']}")
    print(f"Difficulty: {scenario['difficulty']}")
    print(f"Rooms: {len(scenario['room_manager']['rooms'])}")
    print(f"Teacher preferred slots: {scenario['teacher']['preferred_slots']}")
    print(f"Teacher unavailable slots: {scenario['teacher']['unavailable_slots']}")
    print(f"Student preferred slots: {scenario['students']['preferred_slots']}")
    print(f"Student constraints: {scenario['students']['constraints']}")
    
    return scenario


def example_negotiate(scenario: Dict[str, Any]):
    """Run negotiation on a scenario."""
    print("\n" + "=" * 70)
    print("EXAMPLE 5: Run Negotiation")
    print("=" * 70)
    
    print(f"\n→ POST /negotiate (scenario_id: {scenario['scenario_id']})")
    
    response = requests.post(
        f"{API_URL}/negotiate",
        json=scenario
    )
    response.raise_for_status()
    result = response.json()
    
    print(f"\nFinal Decision: {result['final_slot']}")
    print(f"Successful: {'YES' if result['success'] else 'NO'}")
    
    print(f"\nFinal Satisfaction Scores:")
    for agent, score in result['final_scores'].items():
        print(f"  • {agent.capitalize()}: {score:.3f}")
    
    print(f"\nNegotiation Trace:")
    for round_data in result['negotiation_rounds']:
        print(f"\n  Round {round_data['round']}:")
        print(f"    Proposed: {round_data['proposed_slot']}")
        print(f"    Scores: Room={round_data['scores']['room']:.3f}, "
              f"Teacher={round_data['scores']['teacher']:.3f}, "
              f"Student={round_data['scores']['student']:.3f}, "
              f"Global={round_data['scores']['global']:.3f}")
        print(f"    {round_data['explanation']}")
    
    return result


def example_explain_decision(scenario: Dict[str, Any]):
    """Get detailed explanation of negotiation."""
    print("\n" + "=" * 70)
    print("EXAMPLE 6: Detailed Explanation")
    print("=" * 70)
    
    print(f"\n→ POST /explain-decision (scenario_id: {scenario['scenario_id']})")
    
    response = requests.post(
        f"{API_URL}/explain-decision",
        json=scenario
    )
    response.raise_for_status()
    explanation = response.json()
    
    print(f"\nFinal Decision: {explanation['final_decision']}")
    print(f"Converged: {explanation['convergence']['converged']}")
    print(f"Number of rounds: {explanation['convergence']['num_rounds']}")
    print(f"Final global score: {explanation['convergence']['final_global_score']:.3f}")
    
    print(f"\nAttention Analysis (Final Round):")
    last_round = explanation['negotiation_trace'][-1]
    attn = last_round['attention_weights_summary']
    
    print(f"  Room Manager:")
    print(f"    • Attends to Teacher: {attn['room_manager']['attends_to_teacher']:.3f}")
    print(f"    • Attends to Students: {attn['room_manager']['attends_to_students']:.3f}")
    
    print(f"  Teacher:")
    print(f"    • Attends to Room Manager: {attn['teacher']['attends_to_room']:.3f}")
    print(f"    • Attends to Students: {attn['teacher']['attends_to_students']:.3f}")
    
    print(f"  Students:")
    print(f"    • Attends to Room Manager: {attn['students']['attends_to_room']:.3f}")
    print(f"    • Attends to Teacher: {attn['students']['attends_to_teacher']:.3f}")


def example_batch_negotiate():
    """Run negotiation on multiple scenarios."""
    print("\n" + "=" * 70)
    print("EXAMPLE 7: Batch Negotiation")
    print("=" * 70)
    
    # Generate 3 scenarios
    print("\nGenerating 3 scenarios...")
    scenarios = []
    for _ in range(3):
        response = requests.post(f"{API_URL}/generate-scenario?difficulty=medium")
        response.raise_for_status()
        scenarios.append(response.json())
    
    # Batch negotiate
    print(f"\n→ POST /batch-negotiate (3 scenarios)")
    response = requests.post(
        f"{API_URL}/batch-negotiate",
        json=scenarios
    )
    response.raise_for_status()
    results = response.json()
    
    # Print summary
    successful = sum(1 for r in results if r['success'])
    print(f"\nResults:")
    print(f"  Total: {len(results)}")
    print(f"  Successful: {successful}/{len(results)}")
    
    for i, result in enumerate(results, 1):
        status = "✓" if result['success'] else "✗"
        print(f"  {status} Scenario {i}: {result['final_slot']} "
              f"(Global satisfaction: {result['final_scores']['global']:.3f})")


def main():
    """Run all examples."""
    
    print("\n")
    print("╔" + "=" * 68 + "╗")
    print("║" + " " * 68 + "║")
    print("║" + "  SCHEDULING TRANSFORMER - API EXAMPLES".center(68) + "║")
    print("║" + " " * 68 + "║")
    print("╚" + "=" * 68 + "╝")
    
    # Check if API is available
    if not example_health_check():
        print("\n✗ API is not available. Please start the server first:")
        print("  python api/main.py")
        return
    
    # Run examples
    try:
        example_get_config()
        example_get_slots()
        scenario = example_generate_scenario()
        result = example_negotiate(scenario)
        example_explain_decision(scenario)
        example_batch_negotiate()
        
        print("\n" + "=" * 70)
        print("✓ All examples completed successfully!")
        print("=" * 70 + "\n")
        
    except requests.exceptions.RequestException as e:
        print(f"\n✗ Request error: {e}")
    except Exception as e:
        print(f"\n✗ Error: {e}")


if __name__ == "__main__":
    main()
