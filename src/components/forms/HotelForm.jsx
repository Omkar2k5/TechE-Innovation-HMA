import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function HotelForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    location: "",
    owner: "",
    plan: "Basic",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.location || !form.owner) {
      alert("Please fill all fields.");
      return;
    }
    onSave(form);
    setForm({ name: "", location: "", owner: "", plan: "Basic" });
  };

  return (
    <Card className="p-6 max-w-lg mx-auto shadow-md">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Hotel Name"
            name="name"
            value={form.name}
            onChange={handleChange}
          />
          <Input
            placeholder="Location"
            name="location"
            value={form.location}
            onChange={handleChange}
          />
          <Input
            placeholder="Owner"
            name="owner"
            value={form.owner}
            onChange={handleChange}
          />

          <select
            name="plan"
            value={form.plan}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          >
            <option value="Basic">Basic</option>
            <option value="Premium">Premium</option>
          </select>

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Save Hotel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
