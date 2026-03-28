import { useEffect, useState } from "react";
import {
    AlertCircle,
    BookOpen,
    CheckCircle2,
    DoorOpen,
    Loader,
    Plus,
    RefreshCw,
    TrendingUp,
    Users,
    X,
} from "lucide-react";
import Section from "../components/ui/Section.jsx";

const DAYS = ["Mo", "Tu", "We", "Th", "Fr"];
const HOURS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];
const SLOT_OPTIONS = DAYS.flatMap((day) => HOURS.map((hour) => `${day}-${hour}`));
const API_URL = "http://localhost:8080/api/negotiate/start";
const createRoom = (index) => ({ room_id: `R${String(index + 1).padStart(3, "0")}`, capacity: 30, available_slots: [] });

const ScoreBar = ({ label, value, color }) => (
    <div className="flex items-center gap-3">
        <span className="w-16 text-xs font-semibold text-gray-600">{label}</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value * 100}%` }} />
        </div>
        <span className="w-12 text-right text-xs font-bold text-gray-700">{(value * 100).toFixed(0)}%</span>
    </div>
);

const InputField = ({ label, value, onChange, type = "text", placeholder = "" }) => (
    <div className="mb-4">
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
        />
    </div>
);

const SelectField = ({ label, value, onChange, options, placeholder }) => (
    <div className="mb-4">
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</label>
        <select
            value={value}
            onChange={onChange}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
        >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </select>
    </div>
);

const SelectionChips = ({ values, onRemove }) => (
    <div className="mt-3 flex flex-wrap gap-2">
        {values.map((value) => (
            <span key={value} className="inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                {value}
                <button type="button" onClick={() => onRemove(value)} className="text-green-700 hover:text-green-900">
                    <X size={13} />
                </button>
            </span>
        ))}
    </div>
);

const SlotSelector = ({ label, selectedSlots, onToggleSlot, helperText }) => (
    <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-4">
        <div className="mb-3 flex items-start justify-between gap-4">
            <div>
                <p className="text-sm font-bold text-gray-900">{label}</p>
                <p className="mt-1 text-xs text-gray-500">{helperText}</p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{selectedSlots.length} selection{selectedSlots.length > 1 ? "s" : ""}</span>
        </div>
        <div className="overflow-x-auto">
            <div className="grid min-w-[520px] grid-cols-5 gap-2">
                {DAYS.map((day) => (
                    <div key={day} className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{day}</p>
                        {HOURS.map((hour) => {
                            const slot = `${day}-${hour}`;
                            const active = selectedSlots.includes(slot);
                            return (
                                <button
                                    key={slot}
                                    type="button"
                                    onClick={() => onToggleSlot(slot)}
                                    className={`w-full rounded-xl border px-2 py-2 text-xs font-semibold transition-colors ${
                                        active
                                            ? "border-green-600 bg-green-600 text-white"
                                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                                    }`}
                                >
                                    {hour}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
        {selectedSlots.length > 0 && <SelectionChips values={selectedSlots} onRemove={onToggleSlot} />}
    </div>
);

const ResultsView = ({ response, onBack }) => {
    const [expanded, setExpanded] = useState({ rounds: true, final: true });
    const toggleSection = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
    const statusCard = response.success ? "bg-emerald-50 border-emerald-200" : "bg-yellow-50 border-yellow-200";
    const statusIcon = response.success ? <CheckCircle2 size={20} className="text-emerald-600" /> : <AlertCircle size={20} className="text-yellow-600" />;

    return (
        <main className="flex-1 p-7">
            <div className={`mb-8 rounded-2xl border-l-4 p-6 ${statusCard}`}>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-1 items-start gap-4">
                        {statusIcon}
                        <div>
                            <h1 className="text-2xl font-extrabold text-gray-900">Negociation en cours</h1>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-sm text-gray-600">ID:</span>
                                <span className="font-bold text-green-700">{response.scenario_id}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="mb-1 text-xs text-gray-500">Creneau final propose</p>
                        <p className="text-xl font-extrabold text-green-700">{response.final_slot}</p>
                    </div>
                </div>
            </div>

            <Section title="Rounds de Negociation" icon={RefreshCw} expanded={expanded.rounds} onToggle={() => toggleSection("rounds")}>
                <div className="px-5 py-4">
                    <div className="space-y-4">
                        {response.negotiation_rounds?.map((round, index) => (
                            <div key={round.round} className="relative">
                                <div className="rounded-xl border border-green-100 bg-gradient-to-br from-green-50/50 to-transparent p-5">
                                    <div className="mb-4 flex items-start gap-4">
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-700 text-sm font-bold text-white">{round.round}</div>
                                        <div className="flex-1">
                                            <div className="mb-2 flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-gray-900">Proposition: {round.proposed_slot}</p>
                                                    <p className="mt-1 text-xs text-gray-500">{round.explanation}</p>
                                                </div>
                                                <span className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Index: {round.predicted_idx}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3 rounded-lg bg-white p-4">
                                        <p className="text-xs font-bold uppercase tracking-wide text-gray-700">Scores</p>
                                        <ScoreBar label="Salles" value={round.scores.room} color="bg-red-400" />
                                        <ScoreBar label="Enseignant" value={round.scores.teacher} color="bg-blue-400" />
                                        <ScoreBar label="Etudiants" value={round.scores.student} color="bg-emerald-400" />
                                        <div className="border-t border-gray-200 pt-2">
                                            <ScoreBar label="Global" value={round.scores.global} color="bg-green-600" />
                                        </div>
                                    </div>
                                </div>
                                {index < response.negotiation_rounds.length - 1 && (
                                    <div className="flex justify-center py-1">
                                        <div className="h-6 w-0.5 bg-gradient-to-b from-green-200 to-transparent" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            <Section title="Scores Finaux" icon={TrendingUp} expanded={expanded.final} onToggle={() => toggleSection("final")}>
                <div className="px-5 py-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="rounded-xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-600"><TrendingUp size={16} className="text-green-700" />Score Global</p>
                            <p className="mb-2 text-4xl font-extrabold text-green-700">{(response.final_scores.global * 100).toFixed(1)}%</p>
                            <p className="text-xs text-gray-500">Score de satisfaction global</p>
                        </div>
                        <div className="space-y-3">
                            <div className="rounded-xl border border-gray-100 bg-white p-4">
                                <div className="mb-2 flex items-center gap-2"><DoorOpen size={16} className="text-gray-600" /><p className="text-sm font-semibold text-gray-700">Salles</p></div>
                                <ScoreBar label="Score" value={response.final_scores.room} color="bg-red-400" />
                            </div>
                            <div className="rounded-xl border border-gray-100 bg-white p-4">
                                <div className="mb-2 flex items-center gap-2"><BookOpen size={16} className="text-gray-600" /><p className="text-sm font-semibold text-gray-700">Enseignant</p></div>
                                <ScoreBar label="Score" value={response.final_scores.teacher} color="bg-blue-400" />
                            </div>
                            <div className="rounded-xl border border-gray-100 bg-white p-4">
                                <div className="mb-2 flex items-center gap-2"><Users size={16} className="text-gray-600" /><p className="text-sm font-semibold text-gray-700">Etudiants</p></div>
                                <ScoreBar label="Score" value={response.final_scores.student} color="bg-emerald-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <p className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-700"><RefreshCw size={16} className="text-green-700" />Resume de la negociation</p>
                <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4"><p className="mb-1 text-xs font-semibold text-gray-600">Total de rounds</p><p className="text-2xl font-extrabold text-blue-700">{response.negotiation_rounds?.length}</p></div>
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4"><p className="mb-1 text-xs font-semibold text-gray-600">Creneau final</p><p className="text-lg font-extrabold text-emerald-700">{response.final_slot}</p></div>
                    <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-4"><p className="mb-1 text-xs font-semibold text-gray-600">Statut</p><p className="text-sm font-extrabold text-yellow-700">{response.success ? "Accord trouve" : "En cours"}</p></div>
                    <div className="rounded-lg border border-purple-100 bg-purple-50 p-4"><p className="mb-1 text-xs font-semibold text-gray-600">Statut final</p><p className="text-sm font-extrabold text-purple-700">{response.success ? "Succes" : "Negociation"}</p></div>
                </div>
                <button onClick={onBack} className="w-full rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700">Nouvelle Negociation</button>
            </div>
        </main>
    );
};

const NegotiationForm = () => {
    const [formStep, setFormStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState(null);
    const [requestError, setRequestError] = useState("");
    const [validationErrors, setValidationErrors] = useState([]);
    const [form, setForm] = useState({
        scenario_id: "SCEN-0001",
        timestamp: new Date().toISOString(),
        difficulty: "medium",
        room_manager: { rooms: [createRoom(0)], total_slots_available: 0 },
        teacher: { teacher_id: "T001", preferred_slots: [], unavailable_slots: [], min_slots_needed: 1 },
        students: {
            group_id: "G001",
            preferred_slots: [],
            constraints: { no_early_morning: false, no_late_afternoon: false, max_days_per_week: 2, preferred_days: [] },
        },
        all_possible_slots: [],
        target_slot: "",
    });

    useEffect(() => {
        const uniqueSlots = Array.from(new Set([
            ...form.room_manager.rooms.flatMap((room) => room.available_slots),
            ...form.teacher.preferred_slots,
            ...form.students.preferred_slots,
            ...form.all_possible_slots,
        ])).sort();
        const totalSlotsAvailable = form.room_manager.rooms.reduce((total, room) => total + room.available_slots.length, 0);
        setForm((prev) => {
            const nextTargetSlot = prev.target_slot && uniqueSlots.includes(prev.target_slot) ? prev.target_slot : uniqueSlots[0] || "";
            if (
                JSON.stringify(prev.all_possible_slots) === JSON.stringify(uniqueSlots) &&
                prev.room_manager.total_slots_available === totalSlotsAvailable &&
                prev.target_slot === nextTargetSlot
            ) {
                return prev;
            }
            return {
                ...prev,
                room_manager: { ...prev.room_manager, total_slots_available: totalSlotsAvailable },
                all_possible_slots: uniqueSlots,
                target_slot: nextTargetSlot,
            };
        });
    }, [form.room_manager.rooms, form.teacher.preferred_slots, form.teacher.unavailable_slots, form.students.preferred_slots]);

    const updateForm = (path, value) => {
        const keys = path.split(".");
        setForm((prev) => {
            const copy = structuredClone(prev);
            let current = copy;
            for (let index = 0; index < keys.length - 1; index += 1) current = current[keys[index]];
            current[keys[keys.length - 1]] = value;
            return copy;
        });
    };

    const toggleSlot = (path, slot) => {
        const values = path.split(".").reduce((acc, key) => acc[key], form);
        updateForm(path, values.includes(slot) ? values.filter((value) => value !== slot) : [...values, slot].sort());
    };

    const addRoom = () => updateForm("room_manager.rooms", [...form.room_manager.rooms, createRoom(form.room_manager.rooms.length)]);
    const removeRoom = (index) => updateForm("room_manager.rooms", form.room_manager.rooms.filter((_, roomIndex) => roomIndex !== index));
    const updateRoom = (index, field, value) => updateForm("room_manager.rooms", form.room_manager.rooms.map((room, roomIndex) => roomIndex === index ? { ...room, [field]: value } : room));
    const toggleRoomSlot = (roomIndex, slot) => updateForm("room_manager.rooms", form.room_manager.rooms.map((room, index) => index !== roomIndex ? room : {
        ...room,
        available_slots: room.available_slots.includes(slot) ? room.available_slots.filter((value) => value !== slot) : [...room.available_slots, slot].sort(),
    }));
    const toggleDay = (day) => {
        const current = form.students.constraints.preferred_days;
        updateForm("students.constraints.preferred_days", current.includes(day) ? current.filter((value) => value !== day) : [...current, day]);
    };

    const validateForm = () => {
        const errors = [];
        if (!form.room_manager.rooms.length) errors.push("Ajoutez au moins une salle.");
        form.room_manager.rooms.forEach((room, index) => {
            if (!room.room_id.trim()) errors.push(`La salle ${index + 1} doit avoir un identifiant.`);
            if (!room.capacity || room.capacity < 1) errors.push(`La salle ${index + 1} doit avoir une capacite valide.`);
            if (!room.available_slots.length) errors.push(`La salle ${index + 1} doit avoir au moins un creneau disponible.`);
        });
        if (!form.teacher.preferred_slots.length) errors.push("L'enseignant doit avoir au moins un creneau prefere.");
        if (!form.students.preferred_slots.length) errors.push("Les etudiants doivent avoir au moins un creneau prefere.");
        if (!form.students.constraints.preferred_days.length) errors.push("Selectionnez au moins un jour prefere pour les etudiants.");
        if (!form.all_possible_slots.length) errors.push("Aucun creneau global n'est disponible pour la negociation.");
        if (!form.target_slot) errors.push("Choisissez un creneau cible.");
        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleSubmit = async () => {
        setRequestError("");
        if (!validateForm()) return;
        setLoading(true);
        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const payload = await res.json().catch(() => null);
            if (!res.ok) throw new Error(payload?.error || payload?.detail || `${res.status} ${res.statusText}`);
            setResponse(payload);
        } catch (error) {
            console.error("Negotiation request failed:", error);
            setRequestError(`${error.message}. Verifiez que le backend tourne sur http://localhost:8080 et que le service Transformer tourne sur http://localhost:8000.`);
        } finally {
            setLoading(false);
        }
    };

    if (response) return <ResultsView response={response} onBack={() => setResponse(null)} />;

    return (
        <main className="flex-1 p-7">
            <div className="max-w-5xl">
                <div className="mb-8">
                    <h1 className="text-2xl font-extrabold text-gray-900">Nouvelle Negociation</h1>
                    <p className="mt-1 text-sm text-gray-500">Utilisez les selections de creneaux pour eviter les erreurs de saisie avant l'appel du modele.</p>
                </div>

                <div className="mb-8 flex gap-2 overflow-x-auto">
                    {["Infos", "Salles", "Enseignant", "Etudiants", "Creneaux"].map((step, index) => (
                        <button key={step} type="button" onClick={() => setFormStep(index)} className={`whitespace-nowrap rounded-lg px-4 py-2 font-semibold transition-colors ${formStep === index ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                            {step}
                        </button>
                    ))}
                </div>

                {(validationErrors.length > 0 || requestError) && (
                    <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-5">
                        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-red-700"><AlertCircle size={16} />Verifications a corriger</div>
                        {validationErrors.map((error) => <p key={error} className="text-sm text-red-600">{error}</p>)}
                        {requestError && <p className="mt-3 text-sm text-red-600">{requestError}</p>}
                    </div>
                )}

                <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    {formStep === 0 && (
                        <div>
                            <h2 className="mb-4 text-lg font-bold text-gray-900">Informations Generales</h2>
                            <InputField label="Scenario ID" value={form.scenario_id} onChange={(event) => updateForm("scenario_id", event.target.value)} />
                            <InputField label="Timestamp" type="datetime-local" value={form.timestamp.slice(0, 16)} onChange={(event) => updateForm("timestamp", new Date(event.target.value).toISOString())} />
                            <SelectField label="Difficulte" value={form.difficulty} onChange={(event) => updateForm("difficulty", event.target.value)} options={["easy", "medium", "hard"]} />
                        </div>
                    )}

                    {formStep === 1 && (
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Gestion des Salles</h2>
                                    <p className="mt-1 text-sm text-gray-500">Selectionnez les creneaux disponibles pour chaque salle.</p>
                                </div>
                                <div className="rounded-xl bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">{form.room_manager.total_slots_available} creneaux disponibles</div>
                            </div>
                            <div className="space-y-4">
                                {form.room_manager.rooms.map((room, index) => (
                                    <div key={room.room_id + index} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="font-semibold text-gray-900">Salle {index + 1}</h3>
                                            {form.room_manager.rooms.length > 1 && (
                                                <button type="button" onClick={() => removeRoom(index)} className="rounded-lg p-1 text-red-500 transition-colors hover:bg-red-50">
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                        <InputField label="ID Salle" value={room.room_id} onChange={(event) => updateRoom(index, "room_id", event.target.value)} />
                                        <InputField label="Capacite" type="number" value={room.capacity} onChange={(event) => updateRoom(index, "capacity", Number(event.target.value))} />
                                        <SlotSelector label="Creneaux disponibles" selectedSlots={room.available_slots} onToggleSlot={(slot) => toggleRoomSlot(index, slot)} helperText="Cliquez sur les heures ou retirez-les depuis les badges selectionnes." />
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addRoom} className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 font-semibold text-green-700 transition-colors hover:bg-green-100"><Plus size={16} />Ajouter une salle</button>
                        </div>
                    )}

                    {formStep === 2 && (
                        <div>
                            <h2 className="mb-4 text-lg font-bold text-gray-900">Enseignant</h2>
                            <InputField label="ID Enseignant" value={form.teacher.teacher_id} onChange={(event) => updateForm("teacher.teacher_id", event.target.value)} />
                            <InputField label="Nombre minimal de slots" type="number" value={form.teacher.min_slots_needed} onChange={(event) => updateForm("teacher.min_slots_needed", Number(event.target.value))} />
                            <SlotSelector label="Creneaux preferes" selectedSlots={form.teacher.preferred_slots} onToggleSlot={(slot) => toggleSlot("teacher.preferred_slots", slot)} helperText="Ces creneaux augmentent la satisfaction de l'enseignant." />
                            <SlotSelector label="Creneaux indisponibles" selectedSlots={form.teacher.unavailable_slots} onToggleSlot={(slot) => toggleSlot("teacher.unavailable_slots", slot)} helperText="Ces creneaux seront evites pendant la negociation." />
                        </div>
                    )}

                    {formStep === 3 && (
                        <div>
                            <h2 className="mb-4 text-lg font-bold text-gray-900">Etudiants</h2>
                            <InputField label="ID Groupe" value={form.students.group_id} onChange={(event) => updateForm("students.group_id", event.target.value)} />
                            <SlotSelector label="Creneaux preferes" selectedSlots={form.students.preferred_slots} onToggleSlot={(slot) => toggleSlot("students.preferred_slots", slot)} helperText="Selectionnez les heures les plus confortables pour le groupe." />
                            <div className="border-t border-gray-200 pt-4">
                                <h3 className="mb-3 text-sm font-semibold text-gray-700">Contraintes</h3>
                                <div className="mb-4 space-y-2">
                                    <label className="flex items-center gap-2"><input type="checkbox" checked={form.students.constraints.no_early_morning} onChange={(event) => updateForm("students.constraints.no_early_morning", event.target.checked)} className="h-4 w-4" /><span className="text-sm text-gray-700">Pas de cours le matin</span></label>
                                    <label className="flex items-center gap-2"><input type="checkbox" checked={form.students.constraints.no_late_afternoon} onChange={(event) => updateForm("students.constraints.no_late_afternoon", event.target.checked)} className="h-4 w-4" /><span className="text-sm text-gray-700">Pas de cours l'apres-midi tard</span></label>
                                </div>
                                <InputField label="Jours max par semaine" type="number" value={form.students.constraints.max_days_per_week} onChange={(event) => updateForm("students.constraints.max_days_per_week", Number(event.target.value))} />
                                <div>
                                    <p className="mb-2 text-sm font-semibold text-gray-700">Jours preferes</p>
                                    <div className="flex flex-wrap gap-2">
                                        {DAYS.map((day) => (
                                            <button key={day} type="button" onClick={() => toggleDay(day)} className={`rounded-lg px-3 py-1 text-sm font-semibold transition-colors ${form.students.constraints.preferred_days.includes(day) ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {formStep === 4 && (
                        <div>
                            <h2 className="mb-4 text-lg font-bold text-gray-900">Creneaux calcules</h2>
                            <div className="mb-5 rounded-2xl border border-green-100 bg-green-50 p-4">
                                <p className="text-sm font-semibold text-green-900">Les creneaux globaux sont construits automatiquement a partir des selections precedentes.</p>
                                <p className="mt-1 text-xs text-green-700">Cela reduit les erreurs de format avant l'appel du backend et du modele.</p>
                                {form.all_possible_slots.length > 0 ? <SelectionChips values={form.all_possible_slots} onRemove={(slot) => updateForm("all_possible_slots", form.all_possible_slots.filter((value) => value !== slot))} /> : <p className="mt-3 text-sm text-green-800">Aucun creneau disponible pour le moment.</p>}
                            </div>
                            <SelectField label="Creneau cible" value={form.target_slot} onChange={(event) => updateForm("target_slot", event.target.value)} options={form.all_possible_slots.length ? form.all_possible_slots : SLOT_OPTIONS} placeholder="Choisissez un creneau" />
                        </div>
                    )}
                </div>

                <div className="flex justify-between gap-3">
                    <button type="button" onClick={() => setFormStep(Math.max(0, formStep - 1))} disabled={formStep === 0} className="rounded-lg bg-gray-100 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50">Precedent</button>
                    {formStep < 4 ? (
                        <button type="button" onClick={() => setFormStep(formStep + 1)} className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700">Suivant</button>
                    ) : (
                        <button type="button" onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
                            {loading && <Loader size={16} className="animate-spin" />}
                            {loading ? "En cours..." : "Lancer la negociation"}
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
};

const NegotiationOngoing = () => <NegotiationForm />;

export default NegotiationOngoing;
