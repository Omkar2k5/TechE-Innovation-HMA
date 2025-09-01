import { useState } from "react";

export default function POSControl() {
  const [features, setFeatures] = useState([
    { id: 1, name: "Inventory Tracking", enabled: true },
    { id: 2, name: "Payment Gateway", enabled: true },
    { id: 3, name: "Printers", enabled: false },
    { id: 4, name: "CCTV Integration", enabled: false },
  ]);

  const toggleFeature = (id) => {
    setFeatures(
      features.map((f) =>
        f.id === id ? { ...f, enabled: !f.enabled } : f
      )
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">POS Feature Control</h1>
      <ul className="bg-white rounded shadow divide-y">
        {features.map((f) => (
          <li key={f.id} className="flex justify-between p-3">
            <span>{f.name}</span>
            <button
              onClick={() => toggleFeature(f.id)}
              className={`px-3 py-1 rounded ${
                f.enabled ? "bg-green-600 text-white" : "bg-gray-400 text-white"
              }`}
            >
              {f.enabled ? "Enabled" : "Disabled"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
