import { useState } from "react";

export default function Support() {
  const [tickets, setTickets] = useState([
    { id: 1, hotel: "Hotel Sunrise", issue: "Payment failure", status: "Open" },
    { id: 2, hotel: "Grand Palace", issue: "Printer not working", status: "Closed" },
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Support & Helpdesk</h1>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2">Ticket ID</th>
            <th className="p-2">Hotel</th>
            <th className="p-2">Issue</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="p-2">{t.id}</td>
              <td className="p-2">{t.hotel}</td>
              <td className="p-2">{t.issue}</td>
              <td className="p-2">{t.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
