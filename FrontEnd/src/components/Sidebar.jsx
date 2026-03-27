import { useNavigate, useLocation } from "react-router-dom";
import { BookOpen, User, Settings, LogOut, Menu, X } from "lucide-react";
import { navItems } from "../data/navItems";

const sidebar = [
    { icon: User,     label: "Profil",      path: "/profil"     },
    { icon: Settings, label: "Paramètres",  path: "/parametres" },
    { icon: LogOut,   label: "Déconnexion", path: null          },
];

const Sidebar = ({ open, setOpen }) => {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const isActive = (path) => {
        if (path === "/") return pathname === "/";
        return pathname.startsWith(path);
    };

    return (
        <aside
            className={`${
                open ? "w-56" : "w-16"
            } min-h-screen bg-green-950 flex flex-col fixed top-0 left-0 z-50 transition-all duration-300 shadow-xl`}
        >
            {/* Logo */}
            <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${!open && "justify-center"}`}>
                <div className="w-9 h-9 rounded-xl bg-green-400 flex items-center justify-center shrink-0">
                    <BookOpen size={18} className="text-green-950" />
                </div>
                {open && (
                    <div>
                        <p className="text-white text-sm font-extrabold leading-tight">Scheduling</p>
                        <p className="text-green-400 text-xs font-bold tracking-widest">TRANSFORMER</p>
                    </div>
                )}
            </div>

            {/* Toggle */}
            <button
                onClick={() => setOpen((p) => !p)}
                className={`flex mt-1 py-2 text-green-400 hover:text-white transition-colors ${
                    open ? "justify-end pr-4" : "justify-center"
                }`}
            >
                {open ? <X size={15} /> : <Menu size={15} />}
            </button>

            {/* Nav */}
            <nav className="flex-1 px-2 pt-1 space-y-1">
                {navItems.map(({ id, label, icon: Icon, path }) => {
                    const active = isActive(path);
                    return (
                        <button
                            key={id}
                            onClick={() => navigate(path)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium
                ${!open && "justify-center"}
                ${
                                active
                                    ? "bg-green-400 text-green-950 font-bold shadow"
                                    : "text-green-300 hover:bg-white/10 hover:text-white"
                            }`}
                        >
                            <Icon size={17} className="shrink-0" />
                            {open && <span className="truncate">{label}</span>}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div className="px-2 pb-4 pt-2 border-t border-white/10 space-y-1 mt-2">
                {sidebar.map(({ icon: Icon, label, path }) => (
                    <button
                        key={label}
                        onClick={() => path && navigate(path)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm
              ${!open && "justify-center"}
              ${
                            path && isActive(path)
                                ? "bg-green-400 text-green-950 font-bold"
                                : "text-green-400 hover:bg-white/10 hover:text-white"
                        }`}
                    >
                        <Icon size={16} className="shrink-0" />
                        {open && <span>{label}</span>}
                    </button>
                ))}
            </div>
        </aside>
    );
};

export default Sidebar;