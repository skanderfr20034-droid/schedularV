"""
Example 1: Basic Negotiation
Demonstrates how to use SchedulingTransformer for a single negotiation.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import torch
import json
from data_generator.scenario_generator import ScenarioGenerator
from model.scheduler_model import SchedulerModel
from utils.visualization import NegotiationVisualizer
import config


def example_single_negotiation():
    """Run a single negotiation example."""
    
    print("=" * 70)
    print("SCHEDULING TRANSFORMER - SINGLE NEGOTIATION EXAMPLE")
    print("=" * 70)
    
    # Initialize
    print("\n[1] Initializing components...")
    gen = ScenarioGenerator(seed=config.SEED)
    model = SchedulerModel(num_slots=len(gen.all_slots))
    slot_names = gen.all_slots
    
    print(f"✓ Generated {len(slot_names)} available time slots")
    print(f"✓ Model initialized with {config.NUM_LAYERS} negotiation rounds")
    
    # Generate scenario
    print("\n[2] Generating negotiation scenario...")
    scenario = gen.generate_scenario(difficulty="medium")
    
    print(f"✓ Scenario ID: {scenario['scenario_id']}")
    print(f"✓ Available rooms: {len(scenario['room_manager']['rooms'])}")
    print(f"✓ Teacher preferred slots: {scenario['teacher']['preferred_slots']}")
    print(f"✓ Student preferred slots: {scenario['students']['preferred_slots']}")
    print(f"✓ Student constraints: {scenario['students'].get('constraints', {})}")
    
    # Run negotiation
    print("\n[3] Running negotiation...")
    print("-" * 70)
    
    result = model.forward(scenario, slot_names)
    
    # Print results
    print("\n" + "=" * 70)
    print("NEGOTIATION RESULTS")
    print("=" * 70)
    
    print(f"\nFINAL DECISION: {result['final_slot']}")
    print(f"NEGOTIATION SUCCESSFUL: {'✓ YES' if result['success'] else '✗ NO'}")
    
    print("\nFINAL SATISFACTION SCORES:")
    print(f"  • Room Manager:    {result['final_scores']['room']:.3f}")
    print(f"  • Teacher:         {result['final_scores']['teacher']:.3f}")
    print(f"  • Student Group:   {result['final_scores']['student']:.3f}")
    print(f"  • Global Average:  {result['final_scores']['global']:.3f}")
    
    print("\nNEGOTIATION TRACE:")
    print("-" * 70)
    for round_data in result['negotiation_rounds']:
        print(f"\n  Round {round_data['round']}:")
        print(f"    Proposed: {round_data['proposed_slot']}")
        scores = round_data['scores']
        print(f"    Scores: R={scores['room']:.3f} | T={scores['teacher']:.3f} | S={scores['student']:.3f} | G={scores['global']:.3f}")
        print(f"    → {round_data['explanation']}")
    
    # Visualizations
    print("\n[4] Generating visualizations...")
    
    # Create output directory
    os.makedirs("./negotiation_report", exist_ok=True)
    
    # Plot 1: Attention matrices
    print("  • Plotting attention weights...")
    for round_idx, round_data in enumerate(result['negotiation_rounds'], 1):
        attn = round_data['attention_weights']
        NegotiationVisualizer.plot_attention_matrix(
            attn,
            round_idx,
            save_path=f"./negotiation_report/attention_round_{round_idx}.png"
        )
    
    # Plot 2: Satisfaction convergence
    print("  • Plotting satisfaction convergence...")
    satisfaction_history = [r['scores'] for r in result['negotiation_rounds']]
    NegotiationVisualizer.plot_satisfaction_convergence(
        satisfaction_history,
        save_path="./negotiation_report/satisfaction_convergence.png"
    )
    
    # Plot 3: Slot probabilities
    print("  • Plotting slot probabilities...")
    slot_logits = [torch.tensor(r['slot_logits']) for r in result['negotiation_rounds']]
    NegotiationVisualizer.plot_slot_probabilities(
        slot_logits,
        slot_names,
        save_path="./negotiation_report/slot_probabilities.png"
    )
    
    # Save detailed report
    print("  • Saving detailed report...")
    with open("./negotiation_report/full_report.json", 'w') as f:
        report = {
            "scenario": scenario,
            "result": {
                "final_slot": result['final_slot'],
                "final_scores": result['final_scores'],
                "success": result['success'],
                "negotiation_rounds": [
                    {
                        "round": r['round'],
                        "proposed_slot": r['proposed_slot'],
                        "scores": r['scores'],
                        "explanation": r['explanation']
                    }
                    for r in result['negotiation_rounds']
                ]
            }
        }
        json.dump(report, f, indent=2)
    
    print("\n✓ All visualizations saved to ./negotiation_report/")
    print("\nFiles generated:")
    print("  - attention_round_1.png, attention_round_2.png, attention_round_3.png")
    print("  - satisfaction_convergence.png")
    print("  - slot_probabilities.png")
    print("  - full_report.json")
    
    return result


def example_multiple_negotiations():
    """Run multiple negotiation examples with statistics."""
    
    print("\n" + "=" * 70)
    print("SCHEDULING TRANSFORMER - BATCH NEGOTIATION EXAMPLE")
    print("=" * 70)
    
    # Initialize
    print("\n[1] Initializing components...")
    gen = ScenarioGenerator(seed=config.SEED)
    model = SchedulerModel(num_slots=len(gen.all_slots))
    slot_names = gen.all_slots
    
    # Generate multiple scenarios
    print("\n[2] Generating 5 scenarios...")
    scenarios = gen.generate_batch(batch_size=5, difficulty="medium")
    
    # Run negotiation on all
    print("\n[3] Running negotiations...")
    results = model.batch_negotiate(scenarios, slot_names)
    
    # Aggregate statistics
    print("\n" + "=" * 70)
    print("BATCH RESULTS SUMMARY")
    print("=" * 70)
    
    successful = sum(1 for r in results if r['success'])
    avg_scores = {
        'room': sum(r['final_scores']['room'] for r in results) / len(results),
        'teacher': sum(r['final_scores']['teacher'] for r in results) / len(results),
        'student': sum(r['final_scores']['student'] for r in results) / len(results),
        'global': sum(r['final_scores']['global'] for r in results) / len(results),
    }
    
    print(f"\nTotal negotiations: {len(results)}")
    print(f"Successful: {successful}/{len(results)} ({100*successful/len(results):.1f}%)")
    
    print(f"\nAverage Satisfaction Scores:")
    print(f"  • Room Manager:    {avg_scores['room']:.3f}")
    print(f"  • Teacher:         {avg_scores['teacher']:.3f}")
    print(f"  • Student Group:   {avg_scores['student']:.3f}")
    print(f"  • Global Average:  {avg_scores['global']:.3f}")
    
    print(f"\nPer-Scenario Results:")
    print("-" * 70)
    for i, result in enumerate(results, 1):
        status = "✓" if result['success'] else "✗"
        print(f"{status} Scenario {i}: {result['final_slot']} | Global: {result['final_scores']['global']:.3f}")
    
    return results


if __name__ == "__main__":
    # Run both examples
    print("\n")
    example_single_negotiation()
    
    print("\n\n")
    example_multiple_negotiations()
    
    print("\n\n✓ All examples completed successfully!")
