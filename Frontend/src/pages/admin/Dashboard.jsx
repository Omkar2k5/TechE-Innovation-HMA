import React, { useState } from 'react';
import InventoryDashboard from './inventory/InventoryDashboard.jsx'
import DashboardOverview from './DashboardOverview.jsx'
import InventoryAnalytics from './inventory/InventoryAnalytics.jsx'

const Sidebar = ({ activeSection, setActiveSection }) => {
  const [expanded, setExpanded] = useState(null);
  const items = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'inventory-dashboard', label: 'Inventory' },
    { id: 'reports', label: 'Reports' }
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold">Admin</h2>
      </div>
      <nav className="mt-4">
        {items.map(it => (
          <div key={it.id}>
            <button
              onClick={() => { if (it.sub) setExpanded(expanded === it.id ? null : it.id); else setActiveSection(it.id); }}
              className={`w-full text-left px-6 py-3 hover:bg-gray-700 ${activeSection === it.id ? 'bg-gray-900' : ''}`}
            >
              {it.label}
            </button>

            {it.sub && expanded === it.id && (
              <div className="bg-gray-900">
                {it.sub.map(s => (
                  <button key={s.id} onClick={() => setActiveSection(s.id)} className={`w-full text-left px-12 py-2 hover:bg-gray-600 ${activeSection === s.id ? 'bg-gray-600' : ''}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <main className="flex-1 p-6">
  {activeSection === 'dashboard' && <DashboardOverview />}
  {activeSection === 'inventory-dashboard' && <InventoryDashboard />}
  {activeSection === 'reports' && <InventoryAnalytics />}
      </main>
    </div>
  );
}
