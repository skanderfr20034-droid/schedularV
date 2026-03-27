import { useState } from "react";
import {
    User, Mail, Phone, MapPin, GraduationCap, Shield,
    ClipboardList, RefreshCw, Award, TrendingUp,
    Edit3, Save, CheckCircle, Users,
} from "lucide-react";

const Profile = () => {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        nom: "Sarah Martinez",
        email: "s.martinez@univ-edu.fr",
        phone: "+33 6 12 34 56 78",
        ville: "Paris, France",
        promo: "Licence 2 Informatique",
        annee: "2024-2025",
        bio: "Représentante des étudiants de L2 Informatique. Engagée pour améliorer les conditions d'apprentissage et défendre les intérêts de la promotion.",
    });
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const inp =
        "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white";
    const ro =
        "w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-700";

    const stats = [
        { label: "Demandes soumises",    value: 12,   icon: ClipboardList, color: "text-green-700 bg-green-50"   },
        { label: "Négociations actives", value: 5,    icon: RefreshCw,     color: "text-amber-600 bg-amber-50"   },
        { label: "Accords obtenus",      value: 8,    icon: Award,         color: "text-blue-600 bg-blue-50"     },
        { label: "Taux de réussite",     value: "67%",icon: TrendingUp,    color: "text-emerald-600 bg-emerald-50"},
    ];

    const activity = [
        { action: "Demande REQ-082 soumise",          time: "Il y a 2h",  color: "bg-green-400"   },
        { action: "NEG-003 — Accord proche atteint",  time: "Il y a 5h",  color: "bg-emerald-400" },
        { action: "REQ-081 rejetée par le système",   time: "Hier",       color: "bg-red-400"     },
        { action: "NEG-001 — Tour 3 complété",        time: "Il y a 2j",  color: "bg-amber-400"   },
        { action: "Connexion au système",             time: "Il y a 3j",  color: "bg-gray-300"    },
    ];

    return (
        <main className="p-7 flex-1">
            {saved && (
                <div className="mb-5 bg-green-50 border border-green-200 text-green-800 text-sm font-semibold rounded-xl px-4 py-3 flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" /> Profil mis à jour avec succès
                </div>
            )}

            <div className="grid grid-cols-3 gap-6">
                {/* LEFT – Avatar + stats */}
                <div className="col-span-1 flex flex-col gap-5">
                    {/* Avatar Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-300 to-green-600 flex items-center justify-center shadow-md mb-4">
                            <User size={44} className="text-white" />
                        </div>
                        <h2 className="text-base font-extrabold text-green-900">{form.nom}</h2>
                        <p className="text-xs text-gray-500 mt-1">{form.promo}</p>
                        <div className="mt-3 flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-full px-3 py-1">
                            <Shield size={12} className="text-green-600" />
                            <span className="text-xs font-bold text-green-700">Représentant Étudiant</span>
                        </div>
                        <div className="mt-4 w-full border-t border-gray-100 pt-4 space-y-2 text-left">
                            {[
                                { icon: Mail,          val: form.email },
                                { icon: Phone,         val: form.phone },
                                { icon: MapPin,        val: form.ville },
                                { icon: GraduationCap, val: form.annee },
                            ].map(({ icon: Icon, val }) => (
                                <div key={val} className="flex items-center gap-2 text-xs text-gray-500">
                                    <Icon size={13} className="text-green-500 shrink-0" />
                                    <span className="truncate">{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Activité globale</p>
                        <div className="grid grid-cols-2 gap-3">
                            {stats.map(({ label, value, icon: Icon, color }) => (
                                <div key={label} className={`rounded-xl p-3 flex flex-col items-center gap-1 ${color.split(" ")[1]}`}>
                                    <Icon size={16} className={color.split(" ")[0]} />
                                    <span className={`text-xl font-extrabold ${color.split(" ")[0]}`}>{value}</span>
                                    <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT – Form + Activity */}
                <div className="col-span-2 flex flex-col gap-5">
                    {/* Info Form */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-sm font-bold text-green-900">Informations personnelles</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Gérez vos informations de compte</p>
                            </div>
                            {!editing ? (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                                >
                                    <Edit3 size={13} /> Modifier
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEditing(false)}
                                        className="text-xs font-semibold text-gray-500 border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                                    >
                                        <Save size={13} /> Sauvegarder
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: "Nom complet",    key: "nom"   },
                                { label: "Email",          key: "email" },
                                { label: "Téléphone",      key: "phone" },
                                { label: "Localisation",   key: "ville" },
                                { label: "Promotion",      key: "promo" },
                                { label: "Année scolaire", key: "annee" },
                            ].map(({ label, key }) => (
                                <div key={key}>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">{label}</label>
                                    {editing ? (
                                        <input
                                            className={inp}
                                            value={form[key]}
                                            onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                                        />
                                    ) : (
                                        <div className={ro}>{form[key]}</div>
                                    )}
                                </div>
                            ))}
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Biographie</label>
                                {editing ? (
                                    <textarea
                                        className={`${inp} h-20 resize-none`}
                                        value={form.bio}
                                        onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                                    />
                                ) : (
                                    <div className={`${ro} h-20 leading-relaxed`}>{form.bio}</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-sm font-bold text-green-900 mb-4">Activité récente</h3>
                        <div className="space-y-3">
                            {activity.map(({ action, time, color }, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
                                    <div className="flex-1 flex items-center justify-between">
                                        <span className="text-xs text-gray-700 font-medium">{action}</span>
                                        <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Security */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-sm font-bold text-green-900 mb-4">Sécurité du compte</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                {
                                    label: "Changer le mot de passe",
                                    desc: "Dernière modification il y a 3 mois",
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
                                    className={`flex items-center gap-3 border rounded-xl p-4 text-left transition-colors ${color}`}
                                >
                                    <Icon size={18} className="shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold">{label}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
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