import { LayoutDashboard, RefreshCw, ClipboardList, Calendar, BarChart2 } from "lucide-react";

export const navItems = [
    { id: "dashboard",    label: "Dashboard",             icon: LayoutDashboard, path: "/"              },
    { id: "negociations", label: "Négociations en cours", icon: RefreshCw,       path: "/negociations"  },
    { id: "demandes",     label: "Mes demandes",          icon: ClipboardList,   path: "/demandes"      },
    { id: "emplois",      label: "Emplois du temps",      icon: Calendar,        path: "/emplois"       },
    { id: "statistiques", label: "Statistiques",          icon: BarChart2,       path: "/statistiques"  },
];