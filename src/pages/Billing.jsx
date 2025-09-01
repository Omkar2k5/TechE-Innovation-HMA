import { useState } from "react";

export default function Billing() {
  const [invoices] = useState([
    { id: 1, hotel: "Hotel Sunrise", amount: "$200", status: "Paid" },
    { id: 2, hotel: "Grand Palace", amount: "$150", status: "Overdue" },
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Billing & Subscription</h1>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2">Invoice ID</th>
            <th className="p-2">Hotel</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((i) => (
            <tr key={i.id} className="border-b">
              <td className="p-2">{i.id}</td>
              <td className="p-2">{i.hotel}</td>
              <td className="p-2">{i.amount}</td>
              <td
                className={`p-2 font-semibold ${
                  i.status === "Paid" ? "text-green-600" : "text-red-600"
                }`}
              >
                {i.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
