import { NavLink } from "react-router-dom";

const links = [
    ["Dashboard", "/"],
    ["Containers", "/containers"],
    ["Notifications", "/notifications"],
    ["Announcements", "/announcements"],
    ["Settings", "/settings"],
];

export default function Sidebar() {
    return (
        <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6">
            <h1 className="text-2xl font-bold mb-8">
                🏠 HomeOps
            </h1>

            <nav className="space-y-2">
                {links.map(([name, path]) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            `block rounded-lg px-4 py-3 transition ${
                                isActive
                                    ? "bg-blue-600 text-white"
                                    : "hover:bg-slate-800"
                            }`
                        }
                    >
                        {name}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}
