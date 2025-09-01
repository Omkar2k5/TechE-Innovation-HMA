import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit, Lock, Unlock, Trash2 } from "lucide-react";

export default function Hotels() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([
    { id: 1, name: "Grand Palace", location: "Mumbai", owner: "Ravi Sharma", plan: "Premium", status: "Active" },
    { id: 2, name: "Sea Breeze Resort", location: "Goa", owner: "Anjali Verma", plan: "Basic", status: "Inactive" },
  ]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q) ||
        h.owner.toLowerCase().includes(q)
    );
  }, [items, search]);

  const toggleStatus = (id) =>
    setItems((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, status: h.status === "Active" ? "Inactive" : "Active" } : h
      )
    );

  const removeHotel = (id) => setItems((prev) => prev.filter((h) => h.id !== id));

  const editHotel = (id) => {
    const h = items.find((x) => x.id === id);
    alert(`View / Edit → ${h.name}`);
    // Here you can open a modal or navigate to /hotels/:id
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">🏨 Hotels Management</h2>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input
            placeholder="Search hotels, locations, owners…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:w-80"
          />
          <Button className="hidden md:inline-flex">+ Add Hotel</Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((h) => (
          <Card key={h.id} className="hover:shadow-md transition">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{h.name}</h3>
                  <p className="text-sm text-gray-500">{h.location}</p>
                </div>

                {/* 3-dots dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="More actions">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => editHotel(h.id)}>
                      <Edit className="w-4 h-4" /> <span>View / Edit</span>
                    </DropdownMenuItem>

                    {h.status === "Active" ? (
                      <DropdownMenuItem onSelect={() => toggleStatus(h.id)}>
                        <Lock className="w-4 h-4" /> <span>Suspend</span>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onSelect={() => toggleStatus(h.id)}>
                        <Unlock className="w-4 h-4" /> <span>Activate</span>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem className="text-red-600" onSelect={() => removeHotel(h.id)}>
                      <Trash2 className="w-4 h-4" /> <span>Remove</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-3 text-sm text-gray-600">👤 {h.owner}</div>

              <div className="mt-3 flex items-center gap-2">
                <Badge className={h.plan === "Premium" ? "bg-yellow-500 text-white" : "bg-gray-200 text-gray-800"}>
                  {h.plan}
                </Badge>
                <Badge className={h.status === "Active" ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
                  {h.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
