package com.example.schedule_back_end.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;


@Entity
@Data
public class Negotiation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    private String description;

    @Column(nullable = false)
    private LocalDate dateOuverture;

    private LocalDate dateCloture;

    private Float scoreConsensus;

    @Enumerated(EnumType.STRING)
    private StatutNegotiation statut;
}
