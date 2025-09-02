import { useState } from "react";

export default function Hotels() {
  const [hotels, setHotels] = useState([
    { id: 1, name: "Hotel Sunrise", plan: "Premium", active: true },
    { id: 2, name: "Grand Palace", plan: "Basic", active: false },
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Hotels</h1>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2">Name</th>
            <th className="p-2">Plan</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {hotels.map((h) => (
            <tr key={h.id} className="border-b">
              <td className="p-2">{h.name}</td>
              <td className="p-2">{h.plan}</td>
              <td className="p-2">{h.active ? "Active" : "Inactive"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
