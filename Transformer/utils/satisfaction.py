"""
Satisfaction scoring functions for negotiation evaluation.
Measures how well each agent's preferences are met.
"""

import torch
import numpy as np
from typing import Dict, List, Any, Tuple


class SatisfactionEvaluator:
    """
    Evaluates satisfaction of all agents for a proposed schedule.
    
    Satisfaction scores measure how well a proposed slot satisfies each agent's preferences.
    This is the reward signal that drives model training.
    """
    
    def __init__(self, scenario: Dict[str, Any], slot_names: List[str]):
        """
        Args:
            scenario: Negotiation scenario dict (from ScenarioGenerator)
            slot_names: List of all possible slot names (for indexing)
        """
        self.scenario = scenario
        self.slot_names = slot_names
        self.slot_to_idx = {slot: i for i, slot in enumerate(slot_names)}
    
    def room_satisfaction(self, proposed_slot: str) -> float:
        """
        Room Manager satisfaction.
        
        Criteria:
        - Slot is available
        - Any room has capacity (simplified: assume all can accommodate)
        
        Score: 1.0 if available, 0.5 if partially available, 0.0 if not available
        """
        rooms = self.scenario['room_manager']['rooms']
        
        if not rooms:
            return 0.0

        available_count = sum(1 for room in rooms if proposed_slot in room['available_slots'])
        availability_ratio = available_count / len(rooms)

        # Smooth room reward: more rooms supporting the slot means better flexibility.
        return float(availability_ratio)
    
    def teacher_satisfaction(self, proposed_slot: str) -> float:
        """
        Teacher satisfaction.
        
        Criteria:
        - Preferred slot: +1.0
        - Available (not in unavailable list): +0.6
        - Unavailable slot: 0.0
        """
        teacher = self.scenario['teacher']
        
        unavailable_slots = teacher.get('unavailable_slots', [])
        preferred_slots = teacher.get('preferred_slots', [])

        if proposed_slot in unavailable_slots:
            return 0.0
        if proposed_slot in preferred_slots:
            return 1.0

        # Neutral but allowed slots stay possible, just clearly less attractive.
        score = 0.25

        day, hour = proposed_slot.split('-')
        if preferred_slots:
            preferred_days = {slot.split('-')[0] for slot in preferred_slots}
            preferred_hours = {slot.split('-')[1] for slot in preferred_slots}

            if day in preferred_days:
                score += 0.2
            if hour in preferred_hours:
                score += 0.2

        return min(0.85, score)
    
    def student_satisfaction(self, proposed_slot: str) -> float:
        """
        Student satisfaction.
        
        Criteria:
        - Preferred slot: +1.0
        - Respects constraints: +0.7
        - Violates hard constraints: 0.0
        """
        students = self.scenario['students']
        
        preferred_slots = students.get('preferred_slots', [])

        if proposed_slot in preferred_slots:
            score = 1.0
        else:
            score = 0.35
        
        # Check constraints
        constraints = students.get('constraints', {})
        
        # No early morning (before 10:00)
        day, hour = proposed_slot.split('-')

        if constraints.get('no_early_morning') and hour in ('09:00', '10:00'):
            score -= 0.3

        if constraints.get('no_late_afternoon') and hour in ('15:00', '16:00', '17:00'):
            score -= 0.3

        preferred_days = constraints.get('preferred_days', [])
        if preferred_days:
            if day not in preferred_days:
                score -= 0.25
            else:
                score += 0.15

        if preferred_slots:
            preferred_hours = {slot.split('-')[1] for slot in preferred_slots}
            if hour in preferred_hours:
                score += 0.1

        return max(0.0, min(1.0, score))
    
    def evaluate_proposal(self, proposed_slot: str) -> Dict[str, float]:
        """
        Evaluate a proposed slot across all agents.
        
        Returns:
            {
                'teacher': float,
                'student': float,
                'room': float,
                'global': float (weighted average)
            }
        """
        room_score = self.room_satisfaction(proposed_slot)
        teacher_score = self.teacher_satisfaction(proposed_slot)
        student_score = self.student_satisfaction(proposed_slot)
        
        # Weighted global score
        # Equal weights for simplicity (can be tuned)
        # Slightly favor human stakeholders so the model does not overfit room availability.
        global_score = (0.25 * room_score) + (0.35 * teacher_score) + (0.40 * student_score)
        
        return {
            'room': float(room_score),
            'teacher': float(teacher_score),
            'student': float(student_score),
            'global': float(global_score)
        }
    
    def evaluate_batch(self, proposed_slots: List[str]) -> List[Dict[str, float]]:
        """Evaluate multiple proposals."""
        return [self.evaluate_proposal(slot) for slot in proposed_slots]
    
    def evaluate_logits(self, slot_logits: torch.Tensor) -> Dict[str, Any]:
        """
        Evaluate satisfaction from predicted logits.
        
        Args:
            slot_logits: (num_slots,) logits for each slot
        
        Returns:
            Dict with best proposal and its scores
        """
        # Get argmax prediction
        predicted_idx = torch.argmax(slot_logits).item()
        proposed_slot = self.slot_names[predicted_idx]
        
        scores = self.evaluate_proposal(proposed_slot)
        
        return {
            'proposed_slot': proposed_slot,
            'predicted_idx': predicted_idx,
            'scores': scores
        }


class LossFunction(torch.nn.Module):
    """
    Custom loss function for satisfaction-based learning.
    
    Loss is inverse of satisfaction:
    L = 1 - global_satisfaction_score
    
    The model learns to maximize satisfaction by minimizing this loss.
    """
    
    def __init__(self, scenario_list: List[Dict[str, Any]], 
                 slot_names: List[str]):
        super().__init__()
        self.evaluators = [
            SatisfactionEvaluator(scenario, slot_names)
            for scenario in scenario_list
        ]
        self.slot_names = slot_names
        self.slot_to_idx = {slot: i for i, slot in enumerate(slot_names)}
    
    def forward(self, predictions: torch.Tensor, targets: torch.Tensor = None) -> torch.Tensor:
        """
        Compute loss based on satisfaction.
        
        Args:
            predictions: Batch of logits (batch_size, num_slots)
            targets: If provided, use as ground truth (batch_size,) with slot indices
        
        Returns:
            Scalar loss value
        """
        batch_size = predictions.size(0)
        losses = []
        
        for i in range(batch_size):
            # Get best prediction for this sample
            logits = predictions[i]
            predicted_idx = torch.argmax(logits).item()
            proposed_slot = self.slot_names[predicted_idx]
            
            # Compute satisfaction
            evaluator = self.evaluators[i % len(self.evaluators)]
            scores = evaluator.evaluate_proposal(proposed_slot)
            
            # Loss is 1 - satisfaction
            loss = 1.0 - scores['global']
            losses.append(loss)
        
        return torch.tensor(losses).mean()


def slot_accuracy(predictions: torch.Tensor, targets: torch.Tensor) -> float:
    """
    Compute accuracy (exact match of predicted slot).
    
    Args:
        predictions: (batch_size, num_slots) logits
        targets: (batch_size,) target slot indices
    
    Returns:
        Accuracy between 0 and 1
    """
    predicted_idx = torch.argmax(predictions, dim=1)
    return (predicted_idx == targets).float().mean().item()


def satisfaction_metric(predictions: torch.Tensor, 
                       evaluators: List[SatisfactionEvaluator]) -> Dict[str, float]:
    """
    Compute average satisfaction scores across batch.
    
    Args:
        predictions: (batch_size, num_slots) logits
        evaluators: List of SatisfactionEvaluator for each sample
    
    Returns:
        Dict with average scores
    """
    batch_size = predictions.size(0)
    all_scores = {'room': [], 'teacher': [], 'student': [], 'global': []}
    
    for i in range(batch_size):
        logits = predictions[i]
        predicted_idx = torch.argmax(logits).item()
        proposed_slot = evaluators[i].slot_names[predicted_idx]
        
        scores = evaluators[i].evaluate_proposal(proposed_slot)
        for key in all_scores:
            all_scores[key].append(scores[key])
    
    # Compute averages
    return {
        'room': np.mean(all_scores['room']),
        'teacher': np.mean(all_scores['teacher']),
        'student': np.mean(all_scores['student']),
        'global': np.mean(all_scores['global'])
    }
