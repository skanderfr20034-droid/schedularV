"""
Visualization utilities for SchedulingTransformer.
Helps understand the negotiation process and attention weights.
"""

import torch
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from typing import List, Dict, Any
import os


class NegotiationVisualizer:
    """Visualizes negotiation process and attention patterns."""
    
    AGENT_NAMES = {
        0: "Room Manager",
        1: "Teacher",
        2: "Students"
    }
    
    @staticmethod
    def plot_attention_matrix(attention_weights: torch.Tensor, 
                             round_num: int,
                             save_path: str = None):
        """
        Plot attention weights matrix for a negotiation round.
        
        Args:
            attention_weights: (seq_len, seq_len) attention matrix for this round
            round_num: Which negotiation round this is
            save_path: If provided, save figure to this path
        """
        # Convert to numpy
        if isinstance(attention_weights, torch.Tensor):
            attn_np = attention_weights.numpy()
        else:
            attn_np = attention_weights
        
        # Average over batch if needed
        if attn_np.ndim == 3:
            attn_np = attn_np[0]  # Take first batch item
        
        # Create figure
        fig, ax = plt.subplots(figsize=(8, 6))
        
        # Plot heatmap
        sns.heatmap(attn_np, 
                   annot=True, 
                   fmt='.2f', 
                   cmap='YlOrRd',
                   cbar_kws={'label': 'Attention Weight'},
                   xticklabels=[NegotiationVisualizer.AGENT_NAMES[i] for i in range(len(attn_np))],
                   yticklabels=[NegotiationVisualizer.AGENT_NAMES[i] for i in range(len(attn_np))],
                   ax=ax)
        
        ax.set_title(f"Attention Weights - Round {round_num}")
        ax.set_ylabel("Agent (Query)")
        ax.set_xlabel("Agent (Key/Value)")
        
        plt.tight_layout()
        
        if save_path:
            os.makedirs(os.path.dirname(save_path) or ".", exist_ok=True)
            plt.savefig(save_path, dpi=100, bbox_inches='tight')
            print(f"Saved attention plot to {save_path}")
        
        return fig
    
    @staticmethod
    def plot_satisfaction_convergence(satisfaction_history: List[Dict[str, float]],
                                     save_path: str = None):
        """
        Plot how satisfaction scores change across negotiation rounds.
        
        Args:
            satisfaction_history: List of score dicts (one per round)
            save_path: If provided, save figure
        """
        rounds = list(range(1, len(satisfaction_history) + 1))
        
        room_scores = [h['room'] for h in satisfaction_history]
        teacher_scores = [h['teacher'] for h in satisfaction_history]
        student_scores = [h['student'] for h in satisfaction_history]
        global_scores = [h['global'] for h in satisfaction_history]
        
        fig, ax = plt.subplots(figsize=(10, 6))
        
        ax.plot(rounds, room_scores, 'o-', label='Room Manager', linewidth=2, markersize=8)
        ax.plot(rounds, teacher_scores, 's-', label='Teacher', linewidth=2, markersize=8)
        ax.plot(rounds, student_scores, '^-', label='Students', linewidth=2, markersize=8)
        ax.plot(rounds, global_scores, 'D--', label='Global', linewidth=2.5, markersize=8, color='black')
        
        ax.set_xlabel('Negotiation Round', fontsize=12)
        ax.set_ylabel('Satisfaction Score', fontsize=12)
        ax.set_title('Satisfaction Convergence Across Negotiation Rounds', fontsize=14)
        ax.legend(loc='best', fontsize=10)
        ax.grid(True, alpha=0.3)
        ax.set_ylim([0, 1.05])
        ax.set_xticks(rounds)
        
        plt.tight_layout()
        
        if save_path:
            os.makedirs(os.path.dirname(save_path) or ".", exist_ok=True)
            plt.savefig(save_path, dpi=100, bbox_inches='tight')
            print(f"Saved convergence plot to {save_path}")
        
        return fig
    
    @staticmethod
    def plot_slot_probabilities(slot_logits: List[torch.Tensor],
                               slot_names: List[str],
                               top_k: int = 5,
                               save_path: str = None):
        """
        Plot evolution of predicted slot probabilities across rounds.
        
        Args:
            slot_logits: List of logits tensors (one per round)
            slot_names: Names of all slots
            top_k: Show top K slots
            save_path: If provided, save figure
        """
        rounds = len(slot_logits)
        
        # Get probabilities from logits
        probs = [torch.softmax(logit, dim=-1) for logit in slot_logits]
        probs = [p.detach().numpy() if isinstance(p, torch.Tensor) else p for p in probs]
        
        # Get top K slots from final round
        final_probs = probs[-1]
        top_indices = np.argsort(final_probs)[-top_k:][::-1]
        top_slots = [slot_names[i] for i in top_indices]
        
        # Collect probabilities for top slots across rounds
        fig, ax = plt.subplots(figsize=(12, 6))
        
        for idx in top_indices:
            probs_over_time = [p[idx] for p in probs]
            ax.plot(range(1, rounds + 1), probs_over_time, 'o-', label=slot_names[idx], linewidth=2, markersize=8)
        
        ax.set_xlabel('Negotiation Round', fontsize=12)
        ax.set_ylabel('Probability', fontsize=12)
        ax.set_title('Predicted Slot Probabilities Across Rounds (Top 5)', fontsize=14)
        ax.legend(loc='best', fontsize=10)
        ax.grid(True, alpha=0.3)
        ax.set_xticks(range(1, rounds + 1))
        
        plt.tight_layout()
        
        if save_path:
            os.makedirs(os.path.dirname(save_path) or ".", exist_ok=True)
            plt.savefig(save_path, dpi=100, bbox_inches='tight')
            print(f"Saved slot probabilities plot to {save_path}")
        
        return fig
    
    @staticmethod
    def create_negotiation_report(negotiation_trace: Dict[str, Any],
                                 output_dir: str = "./negotiation_report"):
        """
        Create comprehensive visualization report of a negotiation.
        
        Args:
            negotiation_trace: Full trace from negotiation
            output_dir: Directory to save all plots
        """
        os.makedirs(output_dir, exist_ok=True)
        
        print(f"\nGenerating negotiation report in {output_dir}")
        
        # Plot 1: Attention matrices for each round
        for round_num, round_data in enumerate(negotiation_trace['rounds'], 1):
            attn = round_data['attention_weights']
            NegotiationVisualizer.plot_attention_matrix(
                attn, 
                round_num,
                save_path=f"{output_dir}/attention_round_{round_num}.png"
            )
            plt.close()
        
        # Plot 2: Satisfaction convergence
        satisfaction_history = [r['scores'] for r in negotiation_trace['rounds']]
        NegotiationVisualizer.plot_satisfaction_convergence(
            satisfaction_history,
            save_path=f"{output_dir}/satisfaction_convergence.png"
        )
        plt.close()
        
        # Plot 3: Slot probability evolution
        slot_logits = [torch.tensor(r['slot_logits']) if not isinstance(r['slot_logits'], torch.Tensor) 
                      else r['slot_logits'] for r in negotiation_trace['rounds']]
        NegotiationVisualizer.plot_slot_probabilities(
            slot_logits,
            negotiation_trace['slot_names'],
            save_path=f"{output_dir}/slot_probabilities.png"
        )
        plt.close()
        
        # Save summary text
        with open(f"{output_dir}/summary.txt", 'w') as f:
            f.write("=" * 60 + "\n")
            f.write("NEGOTIATION SUMMARY\n")
            f.write("=" * 60 + "\n\n")
            
            f.write(f"Final Proposed Slot: {negotiation_trace['final_slot']}\n")
            final_scores = negotiation_trace['rounds'][-1]['scores']
            f.write(f"Final Scores:\n")
            f.write(f"  - Room: {final_scores['room']:.3f}\n")
            f.write(f"  - Teacher: {final_scores['teacher']:.3f}\n")
            f.write(f"  - Student: {final_scores['student']:.3f}\n")
            f.write(f"  - Global: {final_scores['global']:.3f}\n\n")
            
            f.write("Round-by-Round Evolution:\n")
            for i, round_data in enumerate(negotiation_trace['rounds'], 1):
                f.write(f"\nRound {i}:\n")
                f.write(f"  Proposed: {round_data['proposed_slot']}\n")
                scores = round_data['scores']
                f.write(f"  Scores: R={scores['room']:.3f}, T={scores['teacher']:.3f}, S={scores['student']:.3f}, G={scores['global']:.3f}\n")
                f.write(f"  Explanation: {round_data.get('explanation', 'N/A')}\n")
        
        print("Report generation complete!")
