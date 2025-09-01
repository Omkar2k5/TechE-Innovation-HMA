import { useState } from "react";

export default function Notifications() {
  const [announcements, setAnnouncements] = useState([
    { id: 1, message: "System update on Sept 15", date: "2025-08-20" },
  ]);
  const [newMsg, setNewMsg] = useState("");

  const addAnnouncement = () => {
    if (!newMsg) return;
    setAnnouncements([
      ...announcements,
      { id: announcements.length + 1, message: newMsg, date: new Date().toLocaleDateString() },
    ]);
    setNewMsg("");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Notifications & Announcements</h1>
      <div className="mb-4 bg-white p-4 rounded shadow">
        <input
          type="text"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Type announcement..."
          className="border p-2 rounded w-2/3"
        />
        <button
          onClick={addAnnouncement}
          className="ml-2 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Send
        </button>
      </div>
      <ul className="bg-white rounded shadow divide-y">
        {announcements.map((a) => (
          <li key={a.id} className="p-3">
            <p className="font-semibold">{a.message}</p>
            <span className="text-sm text-gray-500">{a.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
