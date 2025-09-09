import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function POSControl() {
  const [searchParams] = useSearchParams();
  const hotelId = searchParams.get("id") || "demo-hotel-1"; // supply ?id=HOTEL_ID in URL

  const [hotel, setHotel] = useState(null);
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState("");

  const featureList = useMemo(() => Object.entries(features), [features]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/hotels/${encodeURIComponent(hotelId)}/features`);
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const data = await res.json();
        if (!ignore) {
          setHotel(data.hotel);
          setFeatures(data.features || {});
        }
      } catch (e) {
        if (!ignore) setError("Unable to load hotel features. Check Hotel ID or server.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    if (hotelId) load();
    return () => {
      ignore = true;
    };
  }, [hotelId]);

  const toggleFeature = async (key) => {
    const next = !features[key];
    // optimistic update
    setFeatures((prev) => ({ ...prev, [key]: next }));
    setSavingKey(key);
    setError("");
    try {
      const res = await fetch(`/api/hotels/${encodeURIComponent(hotelId)}/features`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, enabled: next }),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      const data = await res.json();
      setFeatures(data.features || {});
    } catch (e) {
      // revert on error
      setFeatures((prev) => ({ ...prev, [key]: !next }));
      setError("Failed to update feature. Try again.");
    } finally {
      setSavingKey(null);
    }
  };

  const addFeatureKey = async () => {
    const key = prompt("Enter new feature key (e.g., inventory, payment_gateway)");
    if (!key) return;
    if (features[key] !== undefined) return;
    await toggleFeature(key); // creates the key with 'true'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">POS Feature Control</h1>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Hotel ID: {hotelId}</Badge>
          <Button size="sm" onClick={addFeatureKey}>Add Feature</Button>
        </div>
      </div>

      {/* Hotel summary */}
      <Card>
        <CardContent className="p-4">
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : hotel ? (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{hotel.name}</p>
                <p className="text-sm text-gray-600">
                  {hotel?.address?.street}, {hotel?.address?.city}, {hotel?.address?.state} {hotel?.address?.zip}
                </p>
              </div>
              <div className="text-sm text-gray-700">
                <div>📞 {hotel?.contact?.phone || "-"}</div>
                <div>✉️ {hotel?.contact?.email || "-"}</div>
              </div>
            </div>
          ) : (
            <p>No hotel found.</p>
          )}
        </CardContent>
      </Card>

      {/* Features toggle list */}
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y">
            {featureList.length === 0 ? (
              <li className="p-4 text-gray-600">No features configured. Use "Add Feature" to create one.</li>
            ) : (
              featureList.map(([key, value]) => (
                <li key={key} className="flex items-center justify-between p-4">
                  <span className="font-medium">{key}</span>
                  <button
                    onClick={() => toggleFeature(key)}
                    disabled={savingKey === key}
                    className={`px-3 py-1 rounded ${
                      value ? "bg-green-600 text-white" : "bg-gray-400 text-white"
                    } ${savingKey === key ? "opacity-75" : ""}`}
                  >
                    {value ? "Enabled" : "Disabled"}
                  </button>
                </li>
              ))
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
