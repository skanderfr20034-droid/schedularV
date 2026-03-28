"""
Training loop for SchedulingTransformer.
Implements satisfaction-based learning.
"""

import torch
import torch.nn as nn
import torch.optim as optim
from typing import List, Dict, Any, Tuple
import numpy as np
from tqdm import tqdm
import config
from model.scheduler_model import SchedulerModel
from data_generator.scenario_generator import ScenarioGenerator
from utils.satisfaction import SatisfactionEvaluator, satisfaction_metric


class Trainer:
    """Trains the SchedulingTransformer model."""
    
    def __init__(self, model: SchedulerModel, num_slots: int):
        self.model = model
        self.num_slots = num_slots
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)
        
        # Optimizer
        self.optimizer = optim.Adam(
            model.parameters(),
            lr=config.LEARNING_RATE,
            weight_decay=config.WEIGHT_DECAY
        )
        
        # Loss function (custom satisfaction loss)
        self.loss_fn = SatisfactionLoss()
        
        # Metrics history
        self.train_losses = []
        self.train_satisfactions = []
        self.val_satisfactions = []

    def build_satisfaction_tensor(self, scenario: Dict[str, Any], slot_names: List[str]) -> torch.Tensor:
        """
        Build a fixed satisfaction vector for all slots in a scenario.

        This keeps the reward signal connected to the softmax probabilities so
        gradients can flow back through the model during training.
        """
        evaluator = SatisfactionEvaluator(scenario, slot_names)
        scores = [evaluator.evaluate_proposal(slot)["global"] for slot in slot_names]
        return torch.tensor(scores, dtype=torch.float32, device=self.device)
    
    def compute_loss(self, predictions: torch.Tensor, 
                    scenarios: List[Dict[str, Any]],
                    slot_names: List[str]) -> torch.Tensor:
        """
        Compute satisfaction-based loss.
        
        Args:
            predictions: Model predictions (batch_size, num_slots)
            scenarios: List of scenarios
            slot_names: Slot names for indexing
        
        Returns:
            Scalar loss
        """
        losses = []

        for i, scenario in enumerate(scenarios):
            logits = predictions[i]
            probabilities = torch.softmax(logits, dim=0)
            satisfaction_vector = self.build_satisfaction_tensor(scenario, slot_names)

            # Expected satisfaction under the model distribution.
            expected_satisfaction = torch.sum(probabilities * satisfaction_vector)
            loss = 1.0 - expected_satisfaction
            losses.append(loss)

        return torch.stack(losses).mean()
    
    def train_epoch(self, train_scenarios: List[Dict[str, Any]],
                   slot_names: List[str]) -> Tuple[float, Dict[str, float]]:
        """
        Train for one epoch.
        
        Args:
            train_scenarios: Training scenarios
            slot_names: Slot names
        
        Returns:
            (average_loss, average_satisfaction_scores)
        """
        self.model.train()
        total_loss = 0
        all_satisfactions = {'room': [], 'teacher': [], 'student': [], 'global': []}
        
        # Mini-batch training
        for batch_start in range(0, len(train_scenarios), config.BATCH_SIZE):
            batch_end = min(batch_start + config.BATCH_SIZE, len(train_scenarios))
            batch_scenarios = train_scenarios[batch_start:batch_end]
            
            self.optimizer.zero_grad()
            
            # Get predictions for batch
            batch_predictions = []
            for scenario in batch_scenarios:
                tensor_inputs = self.model.scenario_to_tensor(scenario, slot_names)
                trace = self.model.transformer.get_negotiation_trace(tensor_inputs)
                final_logits = trace[-1]['slot_logits']  # Last round
                batch_predictions.append(final_logits[0])  # Remove batch dim
            
            batch_predictions = torch.stack(batch_predictions).to(self.device)
            
            # Compute loss
            loss = self.compute_loss(batch_predictions, batch_scenarios, slot_names)
            
            # Backward pass
            loss.backward()
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
            self.optimizer.step()
            
            total_loss += loss.item()
            
            # Record satisfaction scores
            for i, scenario in enumerate(batch_scenarios):
                logits = batch_predictions[i]
                predicted_idx = torch.argmax(logits).item()
                proposed_slot = slot_names[predicted_idx]
                
                evaluator = SatisfactionEvaluator(scenario, slot_names)
                scores = evaluator.evaluate_proposal(proposed_slot)
                
                for key in all_satisfactions:
                    all_satisfactions[key].append(scores[key])
        
        avg_loss = total_loss / max(1, (len(train_scenarios) + config.BATCH_SIZE - 1) // config.BATCH_SIZE)
        
        avg_satisfactions = {
            key: np.mean(values) if values else 0.0
            for key, values in all_satisfactions.items()
        }
        
        return avg_loss, avg_satisfactions
    
    def validate(self, val_scenarios: List[Dict[str, Any]],
                slot_names: List[str]) -> Dict[str, float]:
        """
        Validate on a set of scenarios.
        
        Args:
            val_scenarios: Validation scenarios
            slot_names: Slot names
        
        Returns:
            Dict with validation satisfaction scores
        """
        self.model.eval()
        all_satisfactions = {'room': [], 'teacher': [], 'student': [], 'global': []}
        
        with torch.no_grad():
            for scenario in val_scenarios:
                tensor_inputs = self.model.scenario_to_tensor(scenario, slot_names)
                trace = self.model.transformer.get_negotiation_trace(tensor_inputs)
                final_logits = trace[-1]['slot_logits'][0]
                
                predicted_idx = torch.argmax(final_logits).item()
                proposed_slot = slot_names[predicted_idx]
                
                evaluator = SatisfactionEvaluator(scenario, slot_names)
                scores = evaluator.evaluate_proposal(proposed_slot)
                
                for key in all_satisfactions:
                    all_satisfactions[key].append(scores[key])
        
        return {
            key: np.mean(values) if values else 0.0
            for key, values in all_satisfactions.items()
        }
    
    def train(self, num_epochs: int = config.NUM_EPOCHS,
             val_split: float = 0.2) -> Dict[str, Any]:
        """
        Full training loop.
        
        Args:
            num_epochs: Number of training epochs
            val_split: Fraction of data for validation
        
        Returns:
            Training history
        """
        print(f"Starting training on {self.device}")
        print(f"Model parameters: {sum(p.numel() for p in self.model.parameters()):,}")
        
        # Generate training data
        print("\nGenerating training scenarios...")
        gen = ScenarioGenerator(seed=config.SEED)
        all_scenarios = gen.generate_batch(
            batch_size=num_epochs * 100,  # Generate per-epoch
            difficulty="medium"
        )
        
        # Generate slot names
        slot_names = gen.all_slots
        
        # Split into train/val
        num_train = int(len(all_scenarios) * (1 - val_split))
        train_scenarios = all_scenarios[:num_train]
        val_scenarios = all_scenarios[num_train:]
        
        print(f"Train scenarios: {len(train_scenarios)}, Val scenarios: {len(val_scenarios)}")
        print(f"Total slots available: {len(slot_names)}\n")
        
        # Training loop
        best_val_satisfaction = 0.0
        patience_counter = 0
        patience = 5
        
        for epoch in range(num_epochs):
            # Train
            train_loss, train_sat = self.train_epoch(train_scenarios, slot_names)
            self.train_losses.append(train_loss)
            self.train_satisfactions.append(train_sat)
            
            # Validate
            val_sat = self.validate(val_scenarios, slot_names)
            self.val_satisfactions.append(val_sat)
            
            # Print progress
            if (epoch + 1) % max(1, num_epochs // 10) == 0 or epoch == 0:
                print(f"Epoch {epoch+1}/{num_epochs}")
                print(f"  Loss: {train_loss:.4f}")
                print(f"  Train Satisfaction: G={train_sat['global']:.3f}, R={train_sat['room']:.3f}, T={train_sat['teacher']:.3f}, S={train_sat['student']:.3f}")
                print(f"  Val Satisfaction:   G={val_sat['global']:.3f}, R={val_sat['room']:.3f}, T={val_sat['teacher']:.3f}, S={val_sat['student']:.3f}")
            
            # Early stopping
            if val_sat['global'] > best_val_satisfaction:
                best_val_satisfaction = val_sat['global']
                patience_counter = 0
                # Save best model
                torch.save(self.model.state_dict(), 'best_model.pth')
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    print(f"\nEarly stopping at epoch {epoch+1}")
                    break
        
        # Load best model
        if hasattr(self, 'best_model_state'):
            self.model.load_state_dict(torch.load('best_model.pth'))
        
        print("\nTraining completed!")
        
        return {
            'train_losses': self.train_losses,
            'train_satisfactions': self.train_satisfactions,
            'val_satisfactions': self.val_satisfactions,
            'best_val_satisfaction': best_val_satisfaction
        }


class SatisfactionLoss(nn.Module):
    """Custom loss function based on satisfaction scores."""
    
    def forward(self, predictions: torch.Tensor, targets: torch.Tensor = None) -> torch.Tensor:
        """
        Compute loss as 1 - satisfaction.
        Minimizing this loss maximizes satisfaction.
        """
        # In practice, satisfaction is computed during training
        # This is a placeholder
        return torch.tensor(0.0)


if __name__ == "__main__":
    # Quick test
    print("Testing trainer...")
    from data_generator.scenario_generator import ScenarioGenerator
    
    gen = ScenarioGenerator(seed=config.SEED)
    model = SchedulerModel(num_slots=len(gen.all_slots))
    trainer = Trainer(model, num_slots=len(gen.all_slots))
    
    # Generate small test batch
    test_scenarios = gen.generate_batch(batch_size=4, difficulty="medium")
    
    print(f"Generated {len(test_scenarios)} test scenarios")
    print(f"All slots: {len(gen.all_slots)}")
