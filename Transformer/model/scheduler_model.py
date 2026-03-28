"""
Complete Scheduler Model - orchestrates negotiation process.
Converts scenario data into model inputs and generates full negotiation traces.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, List, Any, Tuple
from model.transformer import TransformerScheduler
from utils.satisfaction import SatisfactionEvaluator
import config


class SchedulerModel(nn.Module):
    """
    Complete scheduling model combining Transformer + satisfaction evaluation.
    
    This model:
    1. Takes a scenario (rooms, teacher, students)
    2. Converts to embeddings
    3. Runs negotiation (transformer attention)
    4. Evaluates satisfaction at each round
    5. Returns detailed negotiation trace
    """
    
    def __init__(self, num_slots: int = 40):
        super().__init__()
        
        self.num_slots = num_slots
        self.transformer = TransformerScheduler(
            d_model=config.MODEL_DIM,
            num_heads=config.NUM_HEADS,
            num_layers=config.NUM_LAYERS,
            d_ff=config.FEEDFORWARD_DIM,
            dropout=config.DROPOUT,
            num_slots=num_slots
        )
    
    def scenario_to_tensor(self, scenario: Dict[str, Any], 
                          slot_names: List[str]) -> Dict[str, torch.Tensor]:
        """
        Convert scenario dict to tensors for model input.
        
        Args:
            scenario: Raw scenario from ScenarioGenerator
            slot_names: List of all slot names
        
        Returns:
            Dict with batched tensors for rooms, teacher, students
        """
        slot_to_idx = {slot: i for i, slot in enumerate(slot_names)}
        
        # Initialize tensors (batch_size=1 for single scenario)
        rooms_tensor = torch.zeros(1, self.num_slots)
        teacher_tensor = torch.zeros(1, self.num_slots)
        students_tensor = torch.zeros(1, self.num_slots)
        
        rooms = scenario['room_manager']['rooms']
        teacher = scenario['teacher']
        students = scenario['students']

        # Room Manager: mark available slots
        for room in rooms:
            for slot in room['available_slots']:
                if slot in slot_to_idx:
                    rooms_tensor[0, slot_to_idx[slot]] += 1.0
        
        # Normalize by number of rooms
        if rooms:
            rooms_tensor = rooms_tensor / len(rooms)
        
        preferred_teacher_days = {slot.split('-')[0] for slot in teacher['preferred_slots']}
        preferred_teacher_hours = {slot.split('-')[1] for slot in teacher['preferred_slots']}

        # Teacher: preferred strongest, unavailable zero, related slots mildly positive.
        for slot in slot_to_idx:
            day, hour = slot.split('-')

            if slot in teacher['unavailable_slots']:
                teacher_tensor[0, slot_to_idx[slot]] = 0.0
            elif slot in teacher['preferred_slots']:
                teacher_tensor[0, slot_to_idx[slot]] = 1.0
            else:
                value = 0.2
                if day in preferred_teacher_days:
                    value += 0.15
                if hour in preferred_teacher_hours:
                    value += 0.15
                teacher_tensor[0, slot_to_idx[slot]] = value
        
        preferred_student_days = {slot.split('-')[0] for slot in students['preferred_slots']}
        preferred_student_hours = {slot.split('-')[1] for slot in students['preferred_slots']}
        student_constraints_data = students.get('constraints', {})

        for slot in slot_to_idx:
            day, hour = slot.split('-')

            if slot in students['preferred_slots']:
                students_tensor[0, slot_to_idx[slot]] = 1.0
            else:
                value = 0.25
                if day in preferred_student_days:
                    value += 0.15
                if hour in preferred_student_hours:
                    value += 0.1
                if student_constraints_data.get('preferred_days') and day in student_constraints_data['preferred_days']:
                    value += 0.1
                if student_constraints_data.get('no_early_morning') and hour in ('09:00', '10:00'):
                    value -= 0.2
                if student_constraints_data.get('no_late_afternoon') and hour in ('15:00', '16:00', '17:00'):
                    value -= 0.2
                students_tensor[0, slot_to_idx[slot]] = max(0.0, min(1.0, value))
        
        # Constraint tensors (batch_size=1, 4 features each)
        # Room constraints: [capacity_normalized, availability_ratio, room_count, occupancy_pressure]
        average_capacity = (
            sum(room['capacity'] for room in rooms) / len(rooms)
            if rooms else 0.0
        )
        average_availability = (
            sum(len(room['available_slots']) for room in rooms) / len(rooms)
            if rooms else 0.0
        )

        room_constraints = torch.tensor([[
            min(1.0, average_capacity / 100.0),
            average_availability / self.num_slots,
            min(1.0, float(len(rooms)) / 10.0),
            1.0 - min(1.0, average_availability / self.num_slots)
        ]], dtype=torch.float32)
        
        # Teacher constraints: [preference_count, unavailable_count, importance, flexibility]
        teacher_constraints = torch.tensor([[
            float(len(teacher['preferred_slots'])) / self.num_slots,
            float(len(teacher['unavailable_slots'])) / self.num_slots,
            0.8,
            max(0.0, 1.0 - (float(len(teacher['unavailable_slots'])) / self.num_slots) * 2.0)
        ]], dtype=torch.float32)
        
        # Student constraints: [preference_count, constraint_count, group_size, timing_flexibility]
        constraints = students.get('constraints', {})
        constraint_count = 0
        if constraints.get('no_early_morning'):
            constraint_count += 1
        if constraints.get('no_late_afternoon'):
            constraint_count += 1
        if constraints.get('preferred_days'):
            constraint_count += 1
        if constraints.get('max_days_per_week') is not None:
            constraint_count += 1
        
        student_constraints = torch.tensor([[
            float(len(students['preferred_slots'])) / self.num_slots,
            float(constraint_count) / 4.0,
            1.0,
            max(0.0, 1.0 - float(constraint_count) / 5.0)
        ]], dtype=torch.float32)
        
        return {
            'rooms': rooms_tensor,
            'teacher': teacher_tensor,
            'students': students_tensor,
            'room_constraints': room_constraints,
            'teacher_constraints': teacher_constraints,
            'student_constraints': student_constraints
        }
    
    def forward(self, scenario: Dict[str, Any],
                slot_names: List[str]) -> Dict[str, Any]:
        """
        Run complete negotiation (single scenario).
        
        Args:
            scenario: Negotiation scenario
            slot_names: List of all slot names
        
        Returns:
            Dict with:
            - final_slot: Best proposed slot
            - negotiation_rounds: List of round details
            - success: Whether satisfied (global_score >= threshold)
        """
        # Convert scenario to tensors
        tensor_inputs = self.scenario_to_tensor(scenario, slot_names)
        
        # Get negotiation trace from transformer
        trace = self.transformer.get_negotiation_trace(tensor_inputs)
        
        # Evaluate satisfaction at each round
        evaluator = SatisfactionEvaluator(scenario, slot_names)
        
        rounds = []
        for round_idx, layer_output in enumerate(trace, 1):
            slot_logits = layer_output['slot_logits'][0]  # Remove batch dim
            
            # Get predicted slot (argmax)
            predicted_idx = torch.argmax(slot_logits).item()
            proposed_slot = slot_names[predicted_idx]
            
            # Evaluate satisfaction
            scores = evaluator.evaluate_proposal(proposed_slot)
            
            # Get explanation
            explanation = self._explain_decision(proposed_slot, scores, scenario, slot_names)
            
            # Get attention weights
            attention = layer_output['attention_weights'][0].detach().numpy()
            
            rounds.append({
                'round': round_idx,
                'proposed_slot': proposed_slot,
                'predicted_idx': predicted_idx,
                'slot_logits': slot_logits.detach().numpy(),
                'attention_weights': attention,
                'scores': scores,
                'explanation': explanation
            })
        
        # Final result
        final_round = rounds[-1]
        
        return {
            'scenario_id': scenario.get('scenario_id'),
            'final_slot': final_round['proposed_slot'],
            'negotiation_rounds': rounds,
            'final_scores': final_round['scores'],
            'success': final_round['scores']['global'] >= config.SATISFACTION_THRESHOLD,
            'slot_names': slot_names
        }
    
    def _explain_decision(self, slot: str, scores: Dict[str, float],
                         scenario: Dict[str, Any], slot_names: List[str]) -> str:
        """
        Generate textual explanation of why this slot was chosen.
        
        Args:
            slot: The proposed slot
            scores: Satisfaction scores
            scenario: The scenario
            slot_names: All available slots
        
        Returns:
            Explanation string
        """
        explanation = f"Proposed: {slot}. "
        
        if scores['global'] >= 0.8:
            explanation += "Excellent agreement across all agents. "
        elif scores['global'] >= 0.6:
            explanation += "Good compromise found. "
        else:
            explanation += "Negotiation still in progress. "
        
        # Add details about each agent
        reasons = []
        if scores['room'] >= 0.8:
            reasons.append("room available")
        if scores['teacher'] >= 0.8:
            reasons.append("teacher preferred")
        elif scores['teacher'] >= 0.6:
            reasons.append("teacher acceptable")
        if scores['student'] >= 0.8:
            reasons.append("students satisfied")
        elif scores['student'] >= 0.6:
            reasons.append("students can attend")
        
        if reasons:
            explanation += f"({', '.join(reasons)})"
        
        return explanation
    
    def batch_negotiate(self, scenarios: List[Dict[str, Any]],
                       slot_names: List[str]) -> List[Dict[str, Any]]:
        """Run negotiation for multiple scenarios."""
        results = []
        for scenario in scenarios:
            result = self.forward(scenario, slot_names)
            results.append(result)
        return results


def create_model(num_slots: int = 40) -> SchedulerModel:
    """Factory function to create a scheduler model."""
    return SchedulerModel(num_slots=num_slots)
