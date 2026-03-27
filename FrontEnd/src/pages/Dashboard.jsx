import { useState } from "react";
import {
    RefreshCw, ClipboardList, Calendar, BarChart2,
    Eye, MessageSquare, Clock,
} from "lucide-react";

import { negociations } from "../data/negociations.js";
import { demandes } from "../data/demandes.js";
import { emplois } from "../data/emplois.js";
import { statCards } from "../data/statCards.js";

import StatusBadge from "../components/ui/StatusBadge.jsx";
import PriorityBadge from "../components/ui/PriorityBadge.jsx";
import ProgressBar from "../components/ui/ProgressBar.jsx";
import SatBar from "../components/ui/SatBar.jsx";
import IconBtn from "../components/ui/IconBtn.jsx";
import { Th, Td } from "../components/ui/Table.jsx";
import Section from "../components/ui/Section.jsx";

const Dashboard = () => {
    const [tables, setTables] = useState({ neg: true, dem: true, emp: true });
    const toggle = (k) => setTables((p) => ({ ...p, [k]: !p[k] }));

    return (
        <main className="p-7 flex-1">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-5 mb-8 lg:grid-cols-4">
                {statCards.map(({ label, value, icon: Icon, border, iconBg, iconColor, val }) => (
                    <div
                        key={label}
                        className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-4 flex items-center gap-4 ${border}`}
                    >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                            <Icon size={21} className={iconColor} />
                        </div>
                        <div>
                            <p className={`text-2xl font-extrabold ${val}`}>{value}</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table 1 – Négociations */}
            <Section
                title="Négociations en cours"
                icon={RefreshCw}
                expanded={tables.neg}
                onToggle={() => toggle("neg")}
                action="Voir toutes"
            >
                <table className="w-full text-sm">
                    <thead>
                    <tr>
                        {["ID", "Sujet", "Promotion", "Parties", "Tour / Progression", "Statut", "Priorité", "Dernière activité", "Actions"].map(
                            (h) => <Th key={h} c={h} />
                        )}
                    </tr>
                    </thead>
                    <tbody>
                    {negociations.map((n, i) => (
                        <tr
                            key={n.id}
                            className={`border-b border-gray-50 hover:bg-green-50/60 transition-colors ${
                                i % 2 !== 0 ? "bg-gray-50/40" : ""
                            }`}
                        >
                            <Td><span className="font-bold text-green-700 text-xs">{n.id}</span></Td>
                            <Td>
                                <p className="font-semibold text-gray-800 text-xs">{n.sujet}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{n.detail}</p>
                            </Td>
                            <Td><span className="text-xs text-gray-600">{n.promotion}</span></Td>
                            <Td>
                  <span className="bg-green-50 text-green-700 border border-green-100 text-xs font-semibold px-2 py-0.5 rounded-lg">
                    {n.parties}
                  </span>
                            </Td>
                            <Td>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-gray-600">{n.tour}</span>
                                    <ProgressBar pct={n.pct} statut={n.statut} />
                                </div>
                            </Td>
                            <Td><StatusBadge status={n.statut} /></Td>
                            <Td><PriorityBadge p={n.priorite} /></Td>
                            <Td>
                  <span className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
                    <Clock size={11} />{n.activite}
                  </span>
                            </Td>
                            <Td>
                                <div className="flex gap-1.5">
                                    <IconBtn icon={Eye} />
                                    <IconBtn icon={MessageSquare} cls="text-blue-500 border-blue-200 hover:bg-blue-50" />
                                </div>
                            </Td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </Section>

            {/* Table 2 – Demandes */}
            <Section
                title="Statut des demandes soumises"
                icon={ClipboardList}
                expanded={tables.dem}
                onToggle={() => toggle("dem")}
                action="Voir toutes"
            >
                <table className="w-full text-sm">
                    <thead>
                    <tr>
                        {["ID", "Date", "Objet de la demande", "Promotion", "Type", "Statut", "Réponse Transformer", "Actions"].map(
                            (h) => <Th key={h} c={h} />
                        )}
                    </tr>
                    </thead>
                    <tbody>
                    {demandes.map((d, i) => (
                        <tr
                            key={d.id}
                            className={`border-b border-gray-50 hover:bg-green-50/60 transition-colors ${
                                i % 2 !== 0 ? "bg-gray-50/40" : ""
                            }`}
                        >
                            <Td><span className="font-bold text-green-700 text-xs">{d.id}</span></Td>
                            <Td><span className="text-xs text-gray-500 whitespace-nowrap">{d.date}</span></Td>
                            <Td><p className="font-semibold text-gray-800 text-xs max-w-xs">{d.objet}</p></Td>
                            <Td><span className="text-xs text-gray-600">{d.promotion}</span></Td>
                            <Td>
                                <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-lg">{d.type}</span>
                            </Td>
                            <Td><StatusBadge status={d.statut} /></Td>
                            <Td><span className="text-xs text-gray-500 max-w-xs block">{d.reponse}</span></Td>
                            <Td>
                                <div className="flex gap-1.5">
                                    <IconBtn icon={Eye} />
                                    {d.statut === "Rejetée" && (
                                        <IconBtn icon={RefreshCw} cls="text-amber-500 border-amber-200 hover:bg-amber-50" />
                                    )}
                                </div>
                            </Td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </Section>

            {/* Table 3 – Emplois */}
            <Section
                title="Emplois du temps"
                icon={Calendar}
                expanded={tables.emp}
                onToggle={() => toggle("emp")}
                action="Voir tous"
            >
                <table className="w-full text-sm">
                    <thead>
                    <tr>
                        {["Promotion", "Semestre", "Version", "Date génération", "Statut", "Satisfaction", "Conflits", "Actions"].map(
                            (h) => <Th key={h} c={h} />
                        )}
                    </tr>
                    </thead>
                    <tbody>
                    {emplois.map((e, i) => (
                        <tr
                            key={e.promotion}
                            className={`border-b border-gray-50 hover:bg-green-50/60 transition-colors ${
                                i % 2 !== 0 ? "bg-gray-50/40" : ""
                            }`}
                        >
                            <Td><p className="font-semibold text-gray-800 text-xs">{e.promotion}</p></Td>
                            <Td><span className="text-xs text-gray-500">{e.semestre}</span></Td>
                            <Td>
                  <span className="bg-green-50 text-green-700 border border-green-100 text-xs font-bold px-2 py-0.5 rounded-lg">
                    {e.version}
                  </span>
                            </Td>
                            <Td><span className="text-xs text-gray-500 whitespace-nowrap">{e.date}</span></Td>
                            <Td><StatusBadge status={e.statut} /></Td>
                            <Td><SatBar val={e.satisfaction} /></Td>
                            <Td>
                  <span
                      className={`text-sm font-bold ${
                          e.conflits === 0 ? "text-green-600" : e.conflits <= 2 ? "text-amber-500" : "text-red-500"
                      }`}
                  >
                    {e.conflits}
                  </span>
                            </Td>
                            <Td>
                                <div className="flex gap-1.5">
                                    <IconBtn icon={Eye} />
                                    <IconBtn icon={BarChart2} cls="text-blue-500 border-blue-200 hover:bg-blue-50" />
                                    {e.statut === "Rejeté" && (
                                        <IconBtn icon={RefreshCw} cls="text-amber-500 border-amber-200 hover:bg-amber-50" />
                                    )}
                                </div>
                            </Td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </Section>
        </main>
    );
};

export default Dashboard;