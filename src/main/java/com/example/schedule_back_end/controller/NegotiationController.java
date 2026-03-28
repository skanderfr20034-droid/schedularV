package com.example.schedule_back_end.controller;

import com.example.schedule_back_end.dto.NegotiationDTO;
import com.example.schedule_back_end.service.NegotiationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/negotiate")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class NegotiationController {

    private final NegotiationService negotiationService;

    public NegotiationController(NegotiationService negotiationService) {
        this.negotiationService = negotiationService;
    }

    @PostMapping("/start")
    public ResponseEntity<?> startNegotiation(@RequestBody NegotiationDTO request) {
        try {
            NegotiationDTO result = negotiationService.startNegotiation(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Negotiation failed: " + e.getMessage()));
        }
    }
}

class ErrorResponse {
    public String error;
    
    public ErrorResponse(String error) {
        this.error = error;
    }
}
