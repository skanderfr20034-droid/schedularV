package com.example.schedule_back_end.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NegotiationDTO {
    @JsonProperty("scenario_id")
    private String scenarioId;
    
    @JsonProperty("timestamp")
    private String timestamp;
    
    @JsonProperty("difficulty")
    private String difficulty;
    
    @JsonProperty("room_manager")
    private RoomManager roomManager;
    
    @JsonProperty("teacher")
    private Teacher teacher;
    
    @JsonProperty("students")
    private Students students;
    
    @JsonProperty("all_possible_slots")
    private List<String> allPossibleSlots;
    
    @JsonProperty("target_slot")
    private String targetSlot;
    
    // Response fields
    @JsonProperty("final_slot")
    private String finalSlot;
    
    @JsonProperty("negotiation_rounds")
    private List<NegotiationRound> negotiationRounds;
    
    @JsonProperty("final_scores")
    private Scores finalScores;
    
    @JsonProperty("success")
    private Boolean success;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class NegotiationRound {
    @JsonProperty("round")
    private Integer round;
    
    @JsonProperty("proposed_slot")
    private String proposedSlot;
    
    @JsonProperty("predicted_idx")
    private Integer predictedIdx;
    
    @JsonProperty("scores")
    private Scores scores;
    
    @JsonProperty("explanation")
    private String explanation;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class Scores {
    @JsonProperty("room")
    private Double room;
    
    @JsonProperty("teacher")
    private Double teacher;
    
    @JsonProperty("student")
    private Double student;
    
    @JsonProperty("global")
    private Double global;
}
