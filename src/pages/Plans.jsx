// src/pages/Plans.jsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Crown, Rocket, Building2 } from "lucide-react";

export default function Plans() {
  const plans = [
    {
      id: "trial",
      name: "Trial",
      price: "Free (14 days)",
      icon: <Rocket className="h-8 w-8 text-gray-500" />,
      features: [
        "1 Hotel",
        "Up to 10 Users",
        "Basic POS Features",
        "Community Support",
      ],
      color: "border-gray-300",
    },
    {
      id: "basic",
      name: "Basic",
      price: "$49 / month",
      icon: <Building2 className="h-8 w-8 text-blue-600" />,
      features: [
        "1 Hotel",
        "Up to 50 Users",
        "Inventory Tracking",
        "Email Support",
      ],
      color: "border-blue-500",
    },
    {
      id: "premium",
      name: "Premium",
      price: "$99 / month",
      icon: <Crown className="h-8 w-8 text-yellow-500" />,
      features: [
        "3 Hotels",
        "Unlimited Users",
        "Advanced Analytics",
        "24/7 Priority Support",
      ],
      color: "border-yellow-500",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Custom Pricing",
      icon: <CheckCircle className="h-8 w-8 text-purple-600" />,
      features: [
        "Unlimited Hotels",
        "Unlimited Users",
        "Dedicated Account Manager",
        "Custom Integrations",
      ],
      color: "border-purple-600",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">💳 Subscription Plans</h1>
      <p className="text-gray-600 mb-8">
        Choose and manage subscription plans for your hotels.
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`shadow-md border-2 ${plan.color} hover:shadow-lg transition`}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="mb-4">{plan.icon}</div>
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <p className="text-lg font-bold text-gray-700">{plan.price}</p>
              <ul className="mt-4 mb-6 space-y-2 text-sm text-gray-600">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant="default">
                Assign / Upgrade
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
