package com.example.schedule_back_end.service;

import com.example.schedule_back_end.dto.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class NegotiationService {

    @Value("${transformer.api.url}")
    private String transformerApiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public NegotiationDTO startNegotiation(NegotiationDTO request) {
        NegotiationDTO negotiationRequest = buildRequest(request);
        String negotiateUrl = transformerApiUrl + "/negotiate";
        return restTemplate.postForObject(negotiateUrl, negotiationRequest, NegotiationDTO.class);
    }

    private NegotiationDTO buildRequest(NegotiationDTO input) {
        NegotiationDTO dto = new NegotiationDTO();

        dto.setScenarioId(
                input.getScenarioId() != null && !input.getScenarioId().isBlank()
                        ? input.getScenarioId()
                        : "SCEN-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase()
        );
        dto.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) + "Z");
        dto.setDifficulty(input.getDifficulty() != null ? input.getDifficulty() : "medium");

        dto.setRoomManager(buildRoomManager(input.getRoomManager()));
        dto.setTeacher(input.getTeacher() != null ? input.getTeacher() : buildDefaultTeacher());
        dto.setStudents(input.getStudents() != null ? input.getStudents() : buildDefaultStudents());

        List<String> computedSlots = collectSlots(input, dto);
        dto.setAllPossibleSlots(computedSlots);
        dto.setTargetSlot(
                input.getTargetSlot() != null && !input.getTargetSlot().isBlank()
                        ? input.getTargetSlot()
                        : (computedSlots.isEmpty() ? "We-11:00" : computedSlots.get(0))
        );

        return dto;
    }

    private RoomManager buildRoomManager(RoomManager input) {
        if (input != null && input.getRooms() != null && !input.getRooms().isEmpty()) {
            Integer totalSlots = input.getTotalSlotsAvailable() != null && input.getTotalSlotsAvailable() > 0
                    ? input.getTotalSlotsAvailable()
                    : input.getRooms().stream()
                    .filter(Objects::nonNull)
                    .map(Room::getAvailableSlots)
                    .filter(Objects::nonNull)
                    .mapToInt(List::size)
                    .sum();

            return new RoomManager(input.getRooms(), totalSlots);
        }

        List<Room> rooms = new ArrayList<>();
        rooms.add(new Room("R001", 30, Arrays.asList("Mo-09:00", "Mo-10:00", "We-11:00")));
        rooms.add(new Room("R002", 50, Arrays.asList("Tu-10:00", "We-11:00", "Fr-14:00")));
        rooms.add(new Room("R003", 100, Arrays.asList("Mo-14:00", "Th-15:00", "Fr-16:00")));

        RoomManager roomManager = new RoomManager();
        roomManager.setRooms(rooms);
        roomManager.setTotalSlotsAvailable(40);
        return roomManager;
    }

    private Teacher buildDefaultTeacher() {
        Teacher teacher = new Teacher();
        teacher.setTeacherId("T001");
        teacher.setPreferredSlots(Arrays.asList("We-11:00", "Mo-10:00", "Fr-14:00"));
        teacher.setUnavailableSlots(Arrays.asList("Tu-09:00", "Th-08:00"));
        teacher.setMinSlotsNeeded(1);
        return teacher;
    }

    private Students buildDefaultStudents() {
        Constraints constraints = new Constraints();
        constraints.setNoEarlyMorning(false);
        constraints.setNoLateAfternoon(false);
        constraints.setMaxDaysPerWeek(2);
        constraints.setPreferredDays(Arrays.asList("Mo", "We", "Fr"));
        
        Students students = new Students();
        students.setGroupId("G001");
        students.setPreferredSlots(Arrays.asList("Mo-10:00", "We-11:00", "Fr-14:00"));
        students.setConstraints(constraints);
        
        return students;
    }

    private List<String> collectSlots(NegotiationDTO input, NegotiationDTO dto) {
        LinkedHashSet<String> slots = new LinkedHashSet<>();

        if (input.getAllPossibleSlots() != null) {
            slots.addAll(input.getAllPossibleSlots());
        }

        if (dto.getRoomManager() != null && dto.getRoomManager().getRooms() != null) {
            dto.getRoomManager().getRooms().stream()
                    .filter(Objects::nonNull)
                    .map(Room::getAvailableSlots)
                    .filter(Objects::nonNull)
                    .forEach(slots::addAll);
        }

        if (dto.getTeacher() != null) {
            if (dto.getTeacher().getPreferredSlots() != null) {
                slots.addAll(dto.getTeacher().getPreferredSlots());
            }
        }

        if (dto.getStudents() != null && dto.getStudents().getPreferredSlots() != null) {
            slots.addAll(dto.getStudents().getPreferredSlots());
        }

        if (slots.isEmpty()) {
            slots.addAll(generateDefaultSlots());
        }

        return new ArrayList<>(slots);
    }

    private List<String> generateDefaultSlots() {
        List<String> slots = new ArrayList<>();
        String[] days = {"Mo", "Tu", "We", "Th", "Fr"};
        int[] hours = {9, 10, 11, 12, 14, 15, 16, 17};

        for (String day : days) {
            for (int hour : hours) {
                slots.add(day + "-" + String.format("%02d:00", hour));
            }
        }

        return slots;
    }
}
