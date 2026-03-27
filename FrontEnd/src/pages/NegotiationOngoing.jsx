import { useState } from "react";
import {
  RefreshCw,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  DoorOpen,
  BookOpen,
  Loader,
} from "lucide-react";
import Section from "../components/ui/Section.jsx";

const ScoreBar = ({ label, value, color }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs font-semibold text-gray-600 w-16">{label}</span>
    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${value * 100}%` }}
      />
    </div>
    <span className="text-xs font-bold text-gray-700 w-12 text-right">
      {(value * 100).toFixed(0)}%
    </span>
  </div>
);

// Form Input Components
const InputField = ({ label, value, onChange, type = "text", placeholder = "" }) => (
  <div className="mb-4">
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
    />
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div className="mb-4">
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const SlotArray = ({ label, slots, onAddSlot, onRemoveSlot }) => (
  <div className="mb-4">
    <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
    <div className="space-y-2 mb-2">
      {slots.map((slot, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="text"
            value={slot}
            readOnly
            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
          />
          <button
            onClick={() => onRemoveSlot(idx)}
            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
    <input
      type="text"
      placeholder="e.g., Mo-09:00"
      onKeyPress={(e) => {
        if (e.key === "Enter" && e.target.value.trim()) {
          onAddSlot(e.target.value.trim());
          e.target.value = "";
        }
      }}
      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
    />
    <p className="text-xs text-gray-500 mt-1">Press Enter to add</p>
  </div>
);

const NegotiationForm = () => {
  const [formStep, setFormStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [expanded, setExpanded] = useState({ details: true, rounds: true, final: true });

  const [form, setForm] = useState({
    scenario_id: "SCEN-0001",
    timestamp: new Date().toISOString(),
    difficulty: "medium",
    room_manager: {
      rooms: [{ room_id: "R001", capacity: 30, available_slots: [] }],
      total_slots_available: 0,
    },
    teacher: {
      teacher_id: "T001",
      preferred_slots: [],
      unavailable_slots: [],
      min_slots_needed: 1,
    },
    students: {
      group_id: "G001",
      preferred_slots: [],
      constraints: {
        no_early_morning: false,
        no_late_afternoon: false,
        max_days_per_week: 2,
        preferred_days: [],
      },
    },
    all_possible_slots: [],
    target_slot: "",
  });

  const updateForm = (path, value) => {
    const keys = path.split(".");
    setForm((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      let current = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  const addRoom = () => {
    const rooms = form.room_manager.rooms;
    updateForm("room_manager.rooms", [
      ...rooms,
      { room_id: `R${rooms.length + 1}`, capacity: 30, available_slots: [] },
    ]);
  };

  const updateRoom = (idx, field, value) => {
    const rooms = form.room_manager.rooms;
    rooms[idx][field] = value;
    updateForm("room_manager.rooms", [...rooms]);
  };

  const removeRoom = (idx) => {
    updateForm(
      "room_manager.rooms",
      form.room_manager.rooms.filter((_, i) => i !== idx)
    );
  };

  const addRoomSlot = (roomIdx, slot) => {
    const rooms = form.room_manager.rooms;
    rooms[roomIdx].available_slots.push(slot);
    updateForm("room_manager.rooms", [...rooms]);
  };

  const removeRoomSlot = (roomIdx, slotIdx) => {
    const rooms = form.room_manager.rooms;
    rooms[roomIdx].available_slots.splice(slotIdx, 1);
    updateForm("room_manager.rooms", [...rooms]);
  };

  const addDayPreference = (day) => {
    const days = form.students.constraints.preferred_days;
    if (!days.includes(day)) {
      updateForm("students.constraints.preferred_days", [...days, day]);
    }
  };

  const removeDayPreference = (day) => {
    updateForm(
      "students.constraints.preferred_days",
      form.students.constraints.preferred_days.filter((d) => d !== day)
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API endpoint
      const res = await fetch("http://your-api.com/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error(err);
      // Mock response for demo
      setResponse({
        scenario_id: form.scenario_id,
        final_slot: "We-16:00",
        success: false,
        negotiation_rounds: [
          {
            round: 1,
            proposed_slot: "Th-09:00",
            predicted_idx: 24,
            scores: { room: 0.0, teacher: 0.6, student: 0.42, global: 0.34 },
            explanation: "Proposed: Th-09:00. Negotiation still in progress.",
          },
        ],
        final_scores: { room: 0.0, teacher: 0.6, student: 0.7, global: 0.43 },
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (response) {
    return (
      <ResultsView response={response} onBack={() => setResponse(null)} />
    );
  }

  const days = ["Mo", "Tu", "We", "Th", "Fr"];

  return (
    <main className="p-7 flex-1">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">Nouvelle Négociation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Remplissez le formulaire pour initier une négociation
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {["Infos", "Salles", "Enseignant", "Étudiants", "Créneaux"].map((step, idx) => (
            <button
              key={idx}
              onClick={() => setFormStep(idx)}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                formStep === idx
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {step}
            </button>
          ))}
        </div>

        {/* Form Steps */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          {/* Step 0: Basic Info */}
          {formStep === 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Informations Générales</h2>
              <InputField
                label="Scenario ID"
                value={form.scenario_id}
                onChange={(e) => updateForm("scenario_id", e.target.value)}
              />
              <InputField
                label="Timestamp"
                type="datetime-local"
                value={form.timestamp.slice(0, 16)}
                onChange={(e) => updateForm("timestamp", new Date(e.target.value).toISOString())}
              />
              <SelectField
                label="Difficulté"
                value={form.difficulty}
                onChange={(e) => updateForm("difficulty", e.target.value)}
                options={["easy", "medium", "hard"]}
              />
            </div>
          )}

          {/* Step 1: Room Manager */}
          {formStep === 1 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Gestion des Salles</h2>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Total de créneaux disponibles
                </label>
                <input
                  type="number"
                  value={form.room_manager.total_slots_available}
                  onChange={(e) =>
                    updateForm("room_manager.total_slots_available", parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>

              <div className="space-y-4">
                {form.room_manager.rooms.map((room, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-gray-900">Salle {idx + 1}</h3>
                      {form.room_manager.rooms.length > 1 && (
                        <button
                          onClick={() => removeRoom(idx)}
                          className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <InputField
                      label="ID Salle"
                      value={room.room_id}
                      onChange={(e) => updateRoom(idx, "room_id", e.target.value)}
                    />
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Capacité
                      </label>
                      <input
                        type="number"
                        value={room.capacity}
                        onChange={(e) => updateRoom(idx, "capacity", parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    <SlotArray
                      label="Créneaux disponibles"
                      slots={room.available_slots}
                      onAddSlot={(slot) => addRoomSlot(idx, slot)}
                      onRemoveSlot={(slotIdx) => removeRoomSlot(idx, slotIdx)}
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={addRoom}
                className="flex items-center gap-2 mt-4 px-4 py-2 bg-green-50 text-green-700 rounded-lg font-semibold hover:bg-green-100 transition-colors"
              >
                <Plus size={16} /> Ajouter une salle
              </button>
            </div>
          )}

          {/* Step 2: Teacher */}
          {formStep === 2 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Enseignant</h2>
              <InputField
                label="ID Enseignant"
                value={form.teacher.teacher_id}
                onChange={(e) => updateForm("teacher.teacher_id", e.target.value)}
              />
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Slots minima requis
                </label>
                <input
                  type="number"
                  value={form.teacher.min_slots_needed}
                  onChange={(e) =>
                    updateForm("teacher.min_slots_needed", parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <SlotArray
                label="Créneaux préférés"
                slots={form.teacher.preferred_slots}
                onAddSlot={(slot) =>
                  updateForm("teacher.preferred_slots", [...form.teacher.preferred_slots, slot])
                }
                onRemoveSlot={(idx) =>
                  updateForm(
                    "teacher.preferred_slots",
                    form.teacher.preferred_slots.filter((_, i) => i !== idx)
                  )
                }
              />
              <SlotArray
                label="Créneaux indisponibles"
                slots={form.teacher.unavailable_slots}
                onAddSlot={(slot) =>
                  updateForm("teacher.unavailable_slots", [...form.teacher.unavailable_slots, slot])
                }
                onRemoveSlot={(idx) =>
                  updateForm(
                    "teacher.unavailable_slots",
                    form.teacher.unavailable_slots.filter((_, i) => i !== idx)
                  )
                }
              />
            </div>
          )}

          {/* Step 3: Students */}
          {formStep === 3 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Étudiants</h2>
              <InputField
                label="ID Groupe"
                value={form.students.group_id}
                onChange={(e) => updateForm("students.group_id", e.target.value)}
              />
              <SlotArray
                label="Créneaux préférés"
                slots={form.students.preferred_slots}
                onAddSlot={(slot) =>
                  updateForm("students.preferred_slots", [...form.students.preferred_slots, slot])
                }
                onRemoveSlot={(idx) =>
                  updateForm(
                    "students.preferred_slots",
                    form.students.preferred_slots.filter((_, i) => i !== idx)
                  )
                }
              />

              <div className="mb-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Contraintes</h3>

                <div className="space-y-2 mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.students.constraints.no_early_morning}
                      onChange={(e) =>
                        updateForm("students.constraints.no_early_morning", e.target.checked)
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Pas de cours le matin</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.students.constraints.no_late_afternoon}
                      onChange={(e) =>
                        updateForm("students.constraints.no_late_afternoon", e.target.checked)
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Pas de cours l'après-midi tard</span>
                  </label>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Jours max par semaine
                  </label>
                  <input
                    type="number"
                    value={form.students.constraints.max_days_per_week}
                    onChange={(e) =>
                      updateForm("students.constraints.max_days_per_week", parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Jours préférés</p>
                  <div className="flex flex-wrap gap-2">
                    {days.map((day) => (
                      <button
                        key={day}
                        onClick={() =>
                          form.students.constraints.preferred_days.includes(day)
                            ? removeDayPreference(day)
                            : addDayPreference(day)
                        }
                        className={`px-3 py-1 rounded-lg font-semibold transition-colors text-sm ${
                          form.students.constraints.preferred_days.includes(day)
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Slots */}
          {formStep === 4 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Créneaux</h2>
              <SlotArray
                label="Tous les créneaux possibles"
                slots={form.all_possible_slots}
                onAddSlot={(slot) =>
                  updateForm("all_possible_slots", [...form.all_possible_slots, slot])
                }
                onRemoveSlot={(idx) =>
                  updateForm(
                    "all_possible_slots",
                    form.all_possible_slots.filter((_, i) => i !== idx)
                  )
                }
              />
              <InputField
                label="Créneau cible"
                value={form.target_slot}
                onChange={(e) => updateForm("target_slot", e.target.value)}
                placeholder="e.g., We-11:00"
              />
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-3">
          <button
            onClick={() => setFormStep(Math.max(0, formStep - 1))}
            disabled={formStep === 0}
            className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Précédent
          </button>

          {formStep < 4 ? (
            <button
              onClick={() => setFormStep(formStep + 1)}
              className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Suivant
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              {loading ? "En cours..." : "Lancer la négociation"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
};

// Results View Component
const ResultsView = ({ response, onBack }) => {
  const [expanded, setExpanded] = useState({ rounds: true, final: true });

  const toggleSection = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getStatusColor = (success) => {
    return success ? "bg-emerald-50 border-emerald-200" : "bg-yellow-50 border-yellow-200";
  };

  const getStatusIcon = (success) => {
    return success ? (
      <CheckCircle2 size={20} className="text-emerald-600" />
    ) : (
      <AlertCircle size={20} className="text-yellow-600" />
    );
  };

  return (
    <main className="p-7 flex-1">
      {/* Header Card */}
      <div className={`rounded-2xl p-6 mb-8 border-l-4 ${getStatusColor(response.success)}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            {getStatusIcon(response.success)}
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">
                Négociation en cours
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-600">ID:</span>
                <span className="font-bold text-green-700">{response.scenario_id}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Créneau final proposé</p>
            <p className="text-xl font-extrabold text-green-700">{response.final_slot}</p>
          </div>
        </div>
      </div>

      {/* Negotiation Rounds */}
      <Section
        title="Rounds de Négociation"
        icon={RefreshCw}
        expanded={expanded.rounds}
        onToggle={() => toggleSection("rounds")}
      >
        <div className="px-5 py-4">
          <div className="space-y-4">
            {response.negotiation_rounds?.map((round, index) => (
              <div key={round.round} className="relative">
                <div className="bg-gradient-to-br from-green-50/50 to-transparent border border-green-100 rounded-xl p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-green-700 text-white font-bold text-sm">
                      {round.round}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-gray-900">Proposition: {round.proposed_slot}</p>
                          <p className="text-xs text-gray-500 mt-1">{round.explanation}</p>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg">
                          Index: {round.predicted_idx}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 space-y-3">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Scores</p>
                    <ScoreBar label="Salles" value={round.scores.room} color="bg-red-400" />
                    <ScoreBar label="Enseignant" value={round.scores.teacher} color="bg-blue-400" />
                    <ScoreBar label="Étudiants" value={round.scores.student} color="bg-emerald-400" />
                    <div className="border-t border-gray-200 pt-2">
                      <ScoreBar label="Global" value={round.scores.global} color="bg-green-600" />
                    </div>
                  </div>
                </div>

                {index < response.negotiation_rounds.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="w-0.5 h-6 bg-gradient-to-b from-green-200 to-transparent" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Final Scores */}
      <Section
        title="Scores Finaux"
        icon={TrendingUp}
        expanded={expanded.final}
        onToggle={() => toggleSection("final")}
      >
        <div className="px-5 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl p-6">
              <p className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-green-700" />
                Score Global
              </p>
              <p className="text-4xl font-extrabold text-green-700 mb-2">
                {(response.final_scores.global * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">Score de satisfaction global</p>
            </div>

            <div className="space-y-3">
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DoorOpen size={16} className="text-gray-600" />
                  <p className="text-sm font-semibold text-gray-700">Salles</p>
                </div>
                <ScoreBar label="Score" value={response.final_scores.room} color="bg-red-400" />
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={16} className="text-gray-600" />
                  <p className="text-sm font-semibold text-gray-700">Enseignant</p>
                </div>
                <ScoreBar label="Score" value={response.final_scores.teacher} color="bg-blue-400" />
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-gray-600" />
                  <p className="text-sm font-semibold text-gray-700">Étudiants</p>
                </div>
                <ScoreBar label="Score" value={response.final_scores.student} color="bg-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Status Summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <p className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <RefreshCw size={16} className="text-green-700" />
          Résumé de la négociation
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-xs text-gray-600 font-semibold mb-1">Total de rounds</p>
            <p className="text-2xl font-extrabold text-blue-700">{response.negotiation_rounds?.length}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
            <p className="text-xs text-gray-600 font-semibold mb-1">Créneau final</p>
            <p className="text-lg font-extrabold text-emerald-700">{response.final_slot}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
            <p className="text-xs text-gray-600 font-semibold mb-1">Statut</p>
            <p className="text-sm font-extrabold text-yellow-700">
              {response.success ? "Accord trouvé" : "En cours"}
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
            <p className="text-xs text-gray-600 font-semibold mb-1">Statut Final</p>
            <p className="text-sm font-extrabold text-purple-700">
              {response.success ? "✓ Succès" : "⟳ Négociation"}
            </p>
          </div>
        </div>

        <button
          onClick={onBack}
          className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
        >
          Nouvelle Négociation
        </button>
      </div>
    </main>
  );
};

const NegotiationOngoing = () => {
  return <NegotiationForm />;
};

export default NegotiationOngoing;
