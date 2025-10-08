export async function suggestIngredientsAPI(dishName, { model = "gpt-4o-mini" } = {}) {
  if (!dishName) return { ingredients: [] }

  // Attempt server proxy first. Use VITE_SUGGEST_PROXY_URL if provided
  const proxyUrl = import.meta.env.VITE_SUGGEST_PROXY_URL || "/api/suggest"
  try {
    const proxyRes = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: dishName, model }),
    })

    if (proxyRes.ok) {
      const json = await proxyRes.json()
      if (json && Array.isArray(json.ingredients)) return { ingredients: json.ingredients }
    }
  } catch (err) {}

  const pool = [
    "Onion",
    "Garlic",
    "Tomato",
    "Salt",
    "Pepper",
    "Oil",
    "Butter",
    "Cream",
    "Paneer",
    "Chicken",
    "Ginger",
    "Cumin",
    "Coriander",
    "Chili",
    "Basil",
    "Oregano",
    "Cheese",
    "Milk",
    "Yogurt",
    "Lemon",
    "Potato",
    "Carrot",
    "Capsicum",
    "Mushroom",
    "Spinach",
    "Rice",
    "Wheat",
    "Egg",
    "Fish",
    "Shrimp",
    "Turmeric",
    "Cardamom",
    "Cloves",
    "Bay Leaf",
    "Cashew",
    "Almond",
    "Coconut",
    "Tamarind",
  ]
  const seed = dishName ? Array.from(dishName).reduce((s, ch) => s + ch.charCodeAt(0), 0) : Date.now()
  const picks = new Set()
  for (let i = 0; picks.size < 6 && i < pool.length; i++) {
    const idx = Math.abs((seed + i * 13) % pool.length)
    picks.add(pool[idx])
  }
  return { ingredients: Array.from(picks) }
}

export default suggestIngredientsAPI
