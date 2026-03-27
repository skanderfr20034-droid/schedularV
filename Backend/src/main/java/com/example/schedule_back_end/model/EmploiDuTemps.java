package com.example.schedule_back_end.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class EmploiDuTemps {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Float scoreSatisfaction;

    @Column(nullable = false)
    private String anneeUniversitaire;

    @Column(nullable = false)
    private String promotion;

    @Enumerated(EnumType.STRING)
    private StatutEmploi statut;
}
