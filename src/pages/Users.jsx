import { useState } from "react";

export default function Users() {
  const [users, setUsers] = useState([
    { id: 1, name: "Alice (Hotel Admin)", role: "HotelAdmin", status: "Active" },
    { id: 2, name: "Bob (Manager)", role: "Manager", status: "Suspended" },
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">User & Role Management</h1>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2">Name</th>
            <th className="p-2">Role</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b">
              <td className="p-2">{u.name}</td>
              <td className="p-2">{u.role}</td>
              <td className="p-2">{u.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
