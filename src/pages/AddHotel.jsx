import { useEffect, useMemo, useState } from "react";
import axios from "axios";

export default function AddHotel() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // New simplified form state based on requested design
  const [form, setForm] = useState({
    name: "",
    address: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
    contact: {
      phone: "",
      email: "",
    },
    taxConfig: {
      taxPercentage: 0,
      serviceCharge: 0,
    },
    owner: {
      name: "",
      phone: "",
      email: "",
      username: "",
      password: "",
      features: {
        feature1: false,
        feature2: false,
        feature3: false,
        feature4: false,
      },
    },
  });

  const setField = (path, value) => {
    setForm((prev) => {
      const clone = structuredClone(prev);
      const keys = path.split(".");
      let cur = clone;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
      cur[keys[keys.length - 1]] = value;
      return clone;
    });
  };

  const computeHotelId = (name) => {
    const letters = (name || "").replace(/[^a-zA-Z]/g, "").toUpperCase();
    const prefix = (letters.slice(0, 3) || "XXX").padEnd(3, "X");
    return `${prefix}001`;
  };

  const hotelId = useMemo(() => computeHotelId(form.name), [form.name]);

  const validate = () => {
    setError("");
    setMessage("");

    if (!form.name) return "Hotel name is required.";

    const a = form.address;
    if (!a.street || !a.city || !a.state || !a.zip || !a.country)
      return "All hotel address fields are required.";

    const c = form.contact;
    if (!c.email) return "Hotel contact email is required.";

    const o = form.owner;
    if (!o.name || !o.phone || !o.email || !o.username || !o.password)
      return "All owner fields are required.";

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      // Build payload per requested structure
      const payload = {
        _id: hotelId,
        name: form.name,
        // createdBy can be set on backend from auth context
        address: { ...form.address },
        contact: { ...form.contact },
        taxConfig: { ...form.taxConfig },
        roles: [
          {
            roleId: "OWN001",
            role: "owner",
            owner_Name: form.owner.name,
            owner_Phone: form.owner.phone,
            "Owner Email": form.owner.email,
            "Owner username": form.owner.username,
            "Owner Password": form.owner.password,
            features: { ...form.owner.features },
          },
        ],
      };

      await axios.post("/api/hotels", payload);
      setMessage("Hotel created successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to create hotel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`max-w-4xl mx-auto ${
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      } transition-all duration-500`}
    >
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
          <h1 className="text-2xl font-bold text-white">Add Hotel</h1>
          <p className="text-blue-100 mt-1">Fill hotel details and owner information.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 p-3">{error}</div>
          ) : null}
          {message ? (
            <div className="rounded-lg border border-green-200 bg-green-50 text-green-700 p-3">{message}</div>
          ) : null}

          {/* Hotel */}
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-800">Hotel</h2>
              </div>
              {/* Auto-generated Hotel ID display */}
              <div className="text-sm">
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Hotel ID (auto): {hotelId}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Hotel Name"
                placeholder="Sunrise Hotel"
                required
                value={form.name}
                onChange={(v) => setField("name", v)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Street" value={form.address.street} onChange={(v) => setField("address.street", v)} />
              <Input label="City" value={form.address.city} onChange={(v) => setField("address.city", v)} />
              <Input label="State" value={form.address.state} onChange={(v) => setField("address.state", v)} />
              <Input label="Zip" value={form.address.zip} onChange={(v) => setField("address.zip", v)} />
              <Input label="Country" value={form.address.country} onChange={(v) => setField("address.country", v)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Hotel Phone" value={form.contact.phone} onChange={(v) => setField("contact.phone", v)} />
              <Input label="Hotel Email" type="email" value={form.contact.email} onChange={(v) => setField("contact.email", v)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberInput label="Tax %" value={form.taxConfig.taxPercentage} onChange={(v) => setField("taxConfig.taxPercentage", v)} />
              <NumberInput label="Service Charge %" value={form.taxConfig.serviceCharge} onChange={(v) => setField("taxConfig.serviceCharge", v)} />
            </div>
          </section>

          {/* Owner */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Owner</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Owner Name" required value={form.owner.name} onChange={(v) => setField("owner.name", v)} />
              <Input label="Owner Phone" required value={form.owner.phone} onChange={(v) => setField("owner.phone", v)} />
              <Input label="Owner Email" type="email" required value={form.owner.email} onChange={(v) => setField("owner.email", v)} />
              <Input label="Owner username" required value={form.owner.username} onChange={(v) => setField("owner.username", v)} />
              <Input label="Owner Password" type="password" required value={form.owner.password} onChange={(v) => setField("owner.password", v)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Toggle
                label="Feature 1"
                checked={form.owner.features.feature1}
                onChange={(v) => setField("owner.features.feature1", v)}
              />
              <Toggle
                label="Feature 2"
                checked={form.owner.features.feature2}
                onChange={(v) => setField("owner.features.feature2", v)}
              />
              <Toggle
                label="Feature 3"
                checked={form.owner.features.feature3}
                onChange={(v) => setField("owner.features.feature3", v)}
              />
              <Toggle
                label="Feature 4"
                checked={form.owner.features.feature4}
                onChange={(v) => setField("owner.features.feature4", v)}
              />
            </div>
          </section>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium shadow transition-all duration-200 ${
                loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
              }`}
            >
              {loading ? (
                <span className="inline-block h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
              ) : null}
              {loading ? "Submitting..." : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, required }) {
  return (
    <label className="block group">
      <span className="text-sm text-gray-700">{label}{required ? <span className="text-red-500"> *</span> : null}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
      />
    </label>
  );
}

function NumberInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-700">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-3 py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          checked ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}