import { useEffect, useState } from "react";
import {
    Award,
    CheckCircle,
    ClipboardList,
    Edit3,
    GraduationCap,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    Save,
    Shield,
    TrendingUp,
    User,
    Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const Profile = () => {
    const { currentUser, updateProfile } = useAuth();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        nom: "Sarah Martinez",
        username: "demo",
        email: "s.martinez@univ-edu.fr",
        phone: "+33 6 12 34 56 78",
        ville: "Paris, France",
        promo: "Licence 2 Informatique",
        annee: "2024-2025",
        bio: "Representante des etudiants de L2 Informatique. Engagee pour ameliorer les conditions d'apprentissage et defendre les interets de la promotion.",
    });
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!currentUser) return;

        setForm((prev) => ({
            ...prev,
            nom: `${currentUser.firstName} ${currentUser.lastName}`,
            username: currentUser.username,
            email:
                prev.email === "s.martinez@univ-edu.fr"
                    ? `${currentUser.username}@univ-edu.fr`
                    : prev.email,
        }));
    }, [currentUser]);

    const handleSave = () => {
        const [firstName = "", ...rest] = form.nom.trim().split(" ");
        const lastName = rest.join(" ") || currentUser?.lastName || "";

        updateProfile({ firstName, lastName });
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const inp =
        "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400";
    const ro =
        "w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700";

    const stats = [
        { label: "Demandes soumises", value: 12, icon: ClipboardList, color: "text-green-700 bg-green-50" },
        { label: "Negociations actives", value: 5, icon: RefreshCw, color: "text-amber-600 bg-amber-50" },
        { label: "Accords obtenus", value: 8, icon: Award, color: "text-blue-600 bg-blue-50" },
        { label: "Taux de reussite", value: "67%", icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
    ];

    const activity = [
        { action: "Demande REQ-082 soumise", time: "Il y a 2h", color: "bg-green-400" },
        { action: "NEG-003 - Accord proche atteint", time: "Il y a 5h", color: "bg-emerald-400" },
        { action: "REQ-081 rejetee par le systeme", time: "Hier", color: "bg-red-400" },
        { action: "NEG-001 - Tour 3 complete", time: "Il y a 2j", color: "bg-amber-400" },
        { action: "Connexion au systeme", time: "Il y a 3j", color: "bg-gray-300" },
    ];

    return (
        <main className="flex-1 p-7">
            {saved && (
                <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
                    <CheckCircle size={16} className="text-green-600" /> Profil mis a jour avec succes
                </div>
            )}

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-1 flex flex-col gap-5">
                    <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
                        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-300 to-green-600 shadow-md">
                            <User size={44} className="text-white" />
                        </div>
                        <h2 className="text-base font-extrabold text-green-900">{form.nom}</h2>
                        <p className="mt-1 text-xs text-gray-500">{form.promo}</p>
                        <div className="mt-3 flex items-center gap-1.5 rounded-full border border-green-100 bg-green-50 px-3 py-1">
                            <Shield size={12} className="text-green-600" />
                            <span className="text-xs font-bold text-green-700">@{form.username}</span>
                        </div>
                        <div className="mt-4 w-full space-y-2 border-t border-gray-100 pt-4 text-left">
                            {[
                                { icon: Mail, val: form.email },
                                { icon: Phone, val: form.phone },
                                { icon: MapPin, val: form.ville },
                                { icon: GraduationCap, val: form.annee },
                            ].map(({ icon: Icon, val }) => (
                                <div key={val} className="flex items-center gap-2 text-xs text-gray-500">
                                    <Icon size={13} className="shrink-0 text-green-500" />
                                    <span className="truncate">{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <p className="mb-4 text-xs font-bold uppercase tracking-wide text-gray-500">
                            Activite globale
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {stats.map(({ label, value, icon: Icon, color }) => (
                                <div key={label} className={`flex flex-col items-center gap-1 rounded-xl p-3 ${color.split(" ")[1]}`}>
                                    <Icon size={16} className={color.split(" ")[0]} />
                                    <span className={`text-xl font-extrabold ${color.split(" ")[0]}`}>{value}</span>
                                    <span className="text-center text-xs leading-tight text-gray-500">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="col-span-2 flex flex-col gap-5">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-green-900">Informations personnelles</h3>
                                <p className="mt-0.5 text-xs text-gray-400">Gerez vos informations de compte</p>
                            </div>
                            {!editing ? (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-green-800"
                                >
                                    <Edit3 size={13} /> Modifier
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEditing(false)}
                                        className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-50"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-green-800"
                                    >
                                        <Save size={13} /> Sauvegarder
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: "Nom complet", key: "nom" },
                                { label: "Nom d'utilisateur", key: "username" },
                                { label: "Email", key: "email" },
                                { label: "Telephone", key: "phone" },
                                { label: "Localisation", key: "ville" },
                                { label: "Promotion", key: "promo" },
                                { label: "Annee scolaire", key: "annee" },
                            ].map(({ label, key }) => (
                                <div key={key}>
                                    <label className="mb-1 block text-xs font-semibold text-gray-500">{label}</label>
                                    {editing && key !== "username" ? (
                                        <input
                                            className={inp}
                                            value={form[key]}
                                            onChange={(event) =>
                                                setForm((prev) => ({ ...prev, [key]: event.target.value }))
                                            }
                                        />
                                    ) : (
                                        <div className={ro}>{form[key]}</div>
                                    )}
                                </div>
                            ))}
                            <div className="col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-gray-500">Biographie</label>
                                {editing ? (
                                    <textarea
                                        className={`${inp} h-20 resize-none`}
                                        value={form.bio}
                                        onChange={(event) =>
                                            setForm((prev) => ({ ...prev, bio: event.target.value }))
                                        }
                                    />
                                ) : (
                                    <div className={`${ro} h-20 leading-relaxed`}>{form.bio}</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-sm font-bold text-green-900">Activite recente</h3>
                        <div className="space-y-3">
                            {activity.map(({ action, time, color }, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
                                    <div className="flex flex-1 items-center justify-between">
                                        <span className="text-xs font-medium text-gray-700">{action}</span>
                                        <span className="ml-4 whitespace-nowrap text-xs text-gray-400">{time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-sm font-bold text-green-900">Securite du compte</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                {
                                    label: "Changer le mot de passe",
                                    desc: "Derniere modification il y a 3 mois",
                                    icon: Shield,
                                    color: "text-green-700 border-green-200 hover:bg-green-50",
                                },
                                {
                                    label: "Sessions actives",
                                    desc: "1 session active actuellement",
                                    icon: Users,
                                    color: "text-blue-600 border-blue-200 hover:bg-blue-50",
                                },
                            ].map(({ label, desc, icon: Icon, color }) => (
                                <button
                                    key={label}
                                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${color}`}
                                >
                                    <Icon size={18} className="shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold">{label}</p>
                                        <p className="mt-0.5 text-xs text-gray-400">{desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Profile;
