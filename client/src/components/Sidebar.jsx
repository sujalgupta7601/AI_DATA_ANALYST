
import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Database,
    Bot,
    BarChart3,
    X,
} from "lucide-react";

const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Datasets", path: "/datasets", icon: Database },
    { name: "AI Copilot", path: "/chat", icon: Bot },
];

export default function Sidebar({ open, setOpen }) {
    return (
        <>
            {open && (
                <div
                    className="fixed inset-0 z-30 bg-black/60 lg:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64
          border-r border-slate-800 bg-[#0d1424]
          p-5 transition-transform duration-300
          lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="mb-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-600 p-2">
                            <BarChart3 size={23} />
                        </div>
                        <div>
                            <h1 className="font-bold">DataPilot AI</h1>
                            <p className="text-xs text-slate-400">
                                Analytics Workspace
                            </p>
                        </div>
                    </div>

                    <button
                        className="lg:hidden"
                        onClick={() => setOpen(false)}
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                <p className="mb-3 px-3 text-xs uppercase text-slate-500">
                    Workspace
                </p>

                <nav className="space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === "/"}
                                onClick={() => setOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-xl px-4 py-3
                  text-sm transition-colors ${isActive
                                        ? "bg-blue-600/20 text-blue-400"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                    }`
                                }
                            >
                                <Icon size={19} />
                                {item.name}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="absolute bottom-6 left-5 right-5 rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-sm font-medium">Free Developer Edition</p>
                    <p className="mt-1 text-xs text-slate-400">
                        Building with React and open-source tools
                    </p>
                </div>
            </aside>
        </>
    );
}
