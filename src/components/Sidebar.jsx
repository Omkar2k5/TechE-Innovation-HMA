// src/components/Sidebar.jsx
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Monitor,
  SquarePlus,
} from "lucide-react";

const links = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Hotels", path: "/hotels", icon: Building2 },
  { name: "Add Hotel", path: "/add-hotel", icon: SquarePlus },
  { name: "POS Control", path: "/pos-control", icon: Monitor },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 min-h-screen bg-gray-900 text-gray-200 p-5 flex flex-col">
      <h2 className="text-2xl font-bold mb-8 text-white">SuperAdmin</h2>
      <nav className="flex-1">
        <ul className="space-y-2">
          {links.map(({ name, path, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <li key={path}>
                <Link
                  to={path}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition 
                    ${
                      isActive
                        ? "bg-blue-600 text-white font-semibold"
                        : "hover:bg-gray-700 hover:text-white"
                    }`}
                >
                  <Icon size={20} />
                  {name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <footer className="text-sm text-gray-400 mt-6 border-t border-gray-700 pt-4">
        © 2025 Hotel Management
      </footer>
    </div>
  );
}
