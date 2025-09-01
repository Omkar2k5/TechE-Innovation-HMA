import { useState } from "react";

export default function Security() {
  const [mfaEnabled, setMfaEnabled] = useState(false);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Security & Compliance</h1>
      <div className="bg-white rounded shadow p-4 mb-4">
        <h2 className="font-semibold mb-2">Multi-Factor Authentication</h2>
        <button
          onClick={() => setMfaEnabled(!mfaEnabled)}
          className={`px-4 py-2 rounded ${
            mfaEnabled ? "bg-green-600 text-white" : "bg-gray-400 text-white"
          }`}
        >
          {mfaEnabled ? "Enabled" : "Disabled"}
        </button>
      </div>
      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold mb-2">GDPR Compliance</h2>
        <p>Data is stored securely and backed up daily.</p>
      </div>
    </div>
  );
}
