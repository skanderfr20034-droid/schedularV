import { useNavigate, useLocation } from "react-router-dom";
import { Bell, User } from "lucide-react";

const pageTitles = {
    "/":              { title: "Dashboard",             sub: "Vue d'ensemble — S2 2024-2025"   },
    "/negociations":  { title: "Négociations en cours", sub: "Toutes les négociations actives" },
    "/demandes":      { title: "Mes demandes",          sub: "Suivi de vos demandes soumises"  },
    "/emplois":       { title: "Emplois du temps",      sub: "Gestion des emplois du temps"    },
    "/statistiques":  { title: "Statistiques",          sub: "Analyse et indicateurs"          },
    "/profil":        { title: "Mon Profil",            sub: "Informations personnelles"        },
    "/parametres":    { title: "Paramètres",            sub: "Configuration du compte"         },
};

const Topbar = () => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { title, sub } = pageTitles[pathname] || pageTitles["/"];

    return (
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-7 sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-3">
                <h1 className="text-base font-bold text-green-900">{title}</h1>
                <span className="text-xs text-gray-400 font-medium hidden sm:block">{sub}</span>
            </div>
            <div className="flex items-center gap-4">
                <button className="relative text-gray-500 hover:text-green-700 transition-colors">
                    <Bell size={19} />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            3
          </span>
                </button>
                <button
                    onClick={() => navigate("/profil")}
                    className="flex items-center gap-2.5 bg-green-50 border border-green-100 rounded-full pl-1 pr-4 py-1 hover:bg-green-100 transition-colors"
                >
                    <div className="w-7 h-7 rounded-full bg-green-200 flex items-center justify-center">
                        <User size={13} className="text-green-800" />
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-bold text-green-900 leading-tight">Sarah Martinez</p>
                        <p className="text-xs text-green-600">Représentant L2 Info</p>
                    </div>
                </button>
            </div>
        </header>
    );
};

export default Topbar;