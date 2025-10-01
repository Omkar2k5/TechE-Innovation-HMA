import React, { useState, useMemo } from 'react'

// ---------------- CARD ----------------
const Card = ({ title, value, className }) => (
  <div className={`flex-1 min-w-[180px] rounded-xl border p-4 ${className || ''}`}>
    <div className="text-sm text-slate-600">{title}</div>
    <div className="text-2xl font-semibold">{value}</div>
  </div>
);

// ---------------- GUEST MODAL ----------------
const GuestModal = ({ table, onClose, onSave }) => {
  const [guest, setGuest] = useState(table.guest || { name: '', phone: '', groupSize: 1 });
  const [status, setStatus] = useState(table.status);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          {table.id === -1 ? 'Add Walk-in Guest' : `Manage Table ${table.id}`}
        </h3>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Guest Name"
            value={guest.name}
            onChange={(e) => setGuest({ ...guest, name: e.target.value })}
            className="w-full border rounded-md p-2"
          />

          <input
            type="number"
            min={1}
            placeholder="Group Size"
            value={guest.groupSize}
            onChange={(e) => setGuest({ ...guest, groupSize: +e.target.value })}
            className="w-full border rounded-md p-2"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-slate-600">Table Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border rounded-md p-2"
          >
            <option value="VACANT">Vacant</option>
            <option value="RESERVED">Reserved</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="BILLING">Billing</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-slate-300 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(guest, status)}
            className="px-4 py-2 rounded-md bg-slate-800 text-white hover:bg-slate-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------- TABLE CARD ----------------
const TableCard = ({ table, onClick }) => {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'vacant': return 'bg-green-100 border-green-300 hover:bg-green-200';
      case 'occupied': return 'bg-blue-100 border-blue-300 hover:bg-blue-200';
      case 'reserved': return 'bg-purple-100 border-purple-300 hover:bg-purple-200';
      case 'billing': return 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200';
      default: return 'bg-gray-100 border-gray-300 hover:bg-gray-200';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status.toLowerCase()) {
      case 'vacant': return 'text-green-800';
      case 'occupied': return 'text-blue-800';
      case 'reserved': return 'text-purple-800';
      case 'billing': return 'text-yellow-800';
      default: return 'text-gray-800';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg p-3 border-2 text-left transition-colors cursor-pointer ${getStatusColor(table.status)}`}
    >
      <div className="font-bold text-lg mb-1">{table.id}</div>
      <div className="text-sm text-gray-600 mb-2">{table.seats} seats</div>
      <div className={`text-sm font-medium uppercase ${getStatusTextColor(table.status)}`}>
        {table.status}
      </div>
      {table.guest && (
        <div className="mt-2 text-xs text-slate-700">
          {table.guest.name} ({table.guest.groupSize})
        </div>
      )}
    </button>
  );
};

// ---------------- FILTER TAB ----------------
const FilterTab = ({ active, onClick, children, count }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
      active
        ? 'bg-slate-800 border-slate-800 text-white'
        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
    }`}
  >
    {children} {count !== undefined && `(${count})`}
  </button>
);

// ---------------- MAIN COMPONENT ----------------
const TableManagement = () => {
  const initialTables = Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    seats: [2, 4, 6][Math.floor(Math.random() * 3)],
    status: 'VACANT',
  }));

  const [tables, setTables] = useState(initialTables);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedTable, setSelectedTable] = useState(null);

  // ---------------- STATS ----------------
  const statusCounts = useMemo(() => ({
    vacant: tables.filter(t => t.status === 'VACANT').length,
    occupied: tables.filter(t => t.status === 'OCCUPIED').length,
    billing: tables.filter(t => t.status === 'BILLING').length,
    reserved: tables.filter(t => t.status === 'RESERVED').length,
  }), [tables]);

  // ---------------- STATUS CYCLING LOGIC ----------------
  const getNextStatus = (currentStatus) => {
    const statusFlow = ['VACANT', 'RESERVED', 'OCCUPIED', 'BILLING'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    return statusFlow[(currentIndex + 1) % statusFlow.length];
  };

  // ---------------- HANDLE TABLE CLICK ----------------
  const handleTableClick = (table) => {
    const nextStatus = getNextStatus(table.status);
    
    // Auto-fill guest info if moving from VACANT to RESERVED/OCCUPIED
    let guest = table.guest;
    if (table.status === 'VACANT' && (nextStatus === 'RESERVED' || nextStatus === 'OCCUPIED')) {
      guest = { name: 'Guest', phone: '', groupSize: table.seats };
    }
    
    // Clear guest info if moving to VACANT
    if (nextStatus === 'VACANT') {
      guest = undefined;
    }

    setTables(prev =>
      prev.map(t =>
        t.id === table.id
          ? { ...t, status: nextStatus, guest }
          : t
      )
    );
  };

  const handleSaveTable = (guest, status) => {
    if (!selectedTable) return;
    setTables(prev =>
      prev.map(t =>
        t.id === selectedTable.id
          ? { ...t, guest: status === 'VACANT' ? undefined : guest, status }
          : t
      )
    );
    setSelectedTable(null);
  };

  // ---------------- FILTERED TABLES ----------------
  const filteredTables = useMemo(() => {
    if (activeFilter === 'all') return tables;
    return tables.filter(t =>
      activeFilter === 'vacant' ? t.status === 'VACANT' :
      activeFilter === 'reserved' ? t.status === 'RESERVED' :
      activeFilter === 'billing' ? t.status === 'BILLING' :
      activeFilter === 'occupied' ? t.status === 'OCCUPIED' :
      true
    );
  }, [tables, activeFilter]);

  return (
    <div className="p-6">
      {/* STATUS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card title="Vacant Tables" value={statusCounts.vacant} className="bg-green-100 text-green-800" />
        <Card title="Occupied" value={statusCounts.occupied} className="bg-blue-100 text-blue-800" />
        <Card title="Billing" value={statusCounts.billing} className="bg-yellow-100 text-yellow-800" />
        <Card title="Reserved" value={statusCounts.reserved} className="bg-purple-100 text-purple-800" />
      </div>

      {/* ACTION BUTTONS (removed View Reservations per request) */}
      <div className="flex gap-3 mb-6" />

      {/* FILTER TABS */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: 'All', count: tables.length },
          { key: 'vacant', label: 'Vacant', count: statusCounts.vacant },
          { key: 'reserved', label: 'Reserved', count: statusCounts.reserved },
          { key: 'billing', label: 'Billing', count: statusCounts.billing },
          { key: 'occupied', label: 'Occupied', count: statusCounts.occupied }
        ].map(f => (
          <FilterTab
            key={f.key}
            active={activeFilter === f.key}
            onClick={() => setActiveFilter(f.key)}
            count={f.count}
          >
            {f.label}
          </FilterTab>
        ))}
      </div>

      {/* TABLE GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredTables.map(table => (
          <TableCard 
            key={table.id} 
            table={table} 
            onClick={() => handleTableClick(table)}
          />
        ))}
      </div>

      {/* MODAL */}
      {selectedTable && (
        <GuestModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
          onSave={handleSaveTable}
        />
      )}
    </div>
  );
};

export default TableManagement;
