"""
Example 3: Training
Demonstrates how to train the SchedulingTransformer model.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import torch
import matplotlib.pyplot as plt
from data_generator.scenario_generator import ScenarioGenerator
from model.scheduler_model import SchedulerModel
from training.train import Trainer
import config


def plot_training_history(histories):
    """Plot training and validation metrics."""
    train_losses = histories['train_losses']
    train_sats = histories['train_satisfactions']
    val_sats = histories['val_satisfactions']
    
    epochs = len(train_losses)
    
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    
    # Plot 1: Loss
    axes[0].plot(train_losses, 'b-', linewidth=2, label='Training Loss')
    axes[0].set_xlabel('Epoch', fontsize=12)
    axes[0].set_ylabel('Loss', fontsize=12)
    axes[0].set_title('Training Loss', fontsize=14)
    axes[0].grid(True, alpha=0.3)
    axes[0].legend()
    
    # Plot 2: Satisfaction
    train_global = [s['global'] for s in train_sats]
    val_global = [s['global'] for s in val_sats]
    
    axes[1].plot(train_global, 'b-', linewidth=2, label='Training Global Satisfaction')
    axes[1].plot(val_global, 'r-', linewidth=2, label='Validation Global Satisfaction')
    axes[1].axhline(y=config.SATISFACTION_THRESHOLD, color='g', linestyle='--', linewidth=2, label='Satisfaction Threshold')
    axes[1].set_xlabel('Epoch', fontsize=12)
    axes[1].set_ylabel('Satisfaction Score', fontsize=12)
    axes[1].set_title('Satisfaction Convergence', fontsize=14)
    axes[1].set_ylim([0, 1.05])
    axes[1].grid(True, alpha=0.3)
    axes[1].legend()
    
    plt.tight_layout()
    plt.savefig('training_history.png', dpi=100, bbox_inches='tight')
    print("✓ Saved training history plot to training_history.png")
    
    return fig


def example_training():
    """Train the model."""
    
    print("=" * 70)
    print("SCHEDULING TRANSFORMER - TRAINING EXAMPLE")
    print("=" * 70)
    
    # Initialize
    print("\n[1] Initializing components...")
    gen = ScenarioGenerator(seed=config.SEED)
    model = SchedulerModel(num_slots=len(gen.all_slots))
    slot_names = gen.all_slots
    
    trainer = Trainer(model, num_slots=len(slot_names))
    
    print(f"✓ Model initialized")
    print(f"✓ Total slots: {len(slot_names)}")
    print(f"✓ Model parameters: {sum(p.numel() for p in model.parameters()):,}")
    
    # Train
    print("\n[2] Starting training...")
    print(f"✓ Training for {config.NUM_EPOCHS} epochs")
    print(f"✓ Batch size: {config.BATCH_SIZE}")
    print(f"✓ Learning rate: {config.LEARNING_RATE}")
    
    histories = trainer.train(num_epochs=config.NUM_EPOCHS, val_split=0.2)
    
    # Plot and save
    print("\n[3] Plotting training history...")
    plot_training_history(histories)
    
    # Final summary
    print("\n" + "=" * 70)
    print("TRAINING SUMMARY")
    print("=" * 70)
    
    final_train_sat = histories['train_satisfactions'][-1]
    final_val_sat = histories['val_satisfactions'][-1]
    
    print(f"\nFinal Training Satisfaction:")
    print(f"  • Room: {final_train_sat['room']:.3f}")
    print(f"  • Teacher: {final_train_sat['teacher']:.3f}")
    print(f"  • Student: {final_train_sat['student']:.3f}")
    print(f"  • Global: {final_train_sat['global']:.3f}")
    
    print(f"\nFinal Validation Satisfaction:")
    print(f"  • Room: {final_val_sat['room']:.3f}")
    print(f"  • Teacher: {final_val_sat['teacher']:.3f}")
    print(f"  • Student: {final_val_sat['student']:.3f}")
    print(f"  • Global: {final_val_sat['global']:.3f}")
    
    print(f"\nBest Validation Satisfaction: {histories['best_val_satisfaction']:.3f}")
    
    # Save model
    print("\n[4] Saving model...")
    torch.save(model.state_dict(), 'trained_model.pth')
    print("✓ Model saved to trained_model.pth")


def example_inference_with_trained_model():
    """Load and use the trained model."""
    
    print("\n" + "=" * 70)
    print("INFERENCE WITH TRAINED MODEL")
    print("=" * 70)
    
    # Initialize
    print("\n[1] Loading model...")
    gen = ScenarioGenerator(seed=config.SEED)
    model = SchedulerModel(num_slots=len(gen.all_slots))
    
    try:
        model.load_state_dict(torch.load('trained_model.pth', map_location='cpu'))
        print("✓ Loaded trained model weights")
    except FileNotFoundError:
        print("✗ trained_model.pth not found. Train the model first!")
        return
    
    slot_names = gen.all_slots
    model.eval()
    
    # Generate test scenario
    print("\n[2] Generating test scenario...")
    scenario = gen.generate_scenario(difficulty="medium")
    print(f"✓ Scenario ID: {scenario['scenario_id']}")
    
    # Run negotiation
    print("\n[3] Running inference...")
    with torch.no_grad():
        result = model.forward(scenario, slot_names)
    
    # Print results
    print("\n" + "=" * 70)
    print("INFERENCE RESULTS")
    print("=" * 70)
    
    print(f"\nFinal Decision: {result['final_slot']}")
    print(f"Success: {'✓ YES' if result['success'] else '✗ NO'}")
    
    print(f"\nSatisfaction Scores:")
    for agent, score in result['final_scores'].items():
        print(f"  • {agent.capitalize()}: {score:.3f}")
    
    print(f"\nNegotiation evolved over {len(result['negotiation_rounds'])} rounds:")
    for round_data in result['negotiation_rounds']:
        print(f"  Round {round_data['round']}: {round_data['proposed_slot']} "
              f"(Global: {round_data['scores']['global']:.3f})")


if __name__ == "__main__":
    # Example 1: Training (this takes a few minutes)
    print("\nStarting training example...")
    print("(This will take ~2-5 minutes depending on your hardware)\n")
    
    example_training()
    
    print("\n\n")
    # Example 2: Inference
    example_inference_with_trained_model()
    
    print("\n\n✓ Training example completed!")
