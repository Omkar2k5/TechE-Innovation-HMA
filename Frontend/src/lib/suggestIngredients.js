// Proxy-first suggestion helper. Tries server /api/suggest, then client-side OpenAI, then deterministic fallback.
export async function suggestIngredientsAPI(dishName, { model = 'gpt-4o-mini' } = {}) {
  if (!dishName) return { ingredients: [] }

  // Attempt server proxy first. Use VITE_SUGGEST_PROXY_URL if provided
  const proxyUrl = import.meta.env.VITE_SUGGEST_PROXY_URL || '/api/suggest'
  try {
    const proxyRes = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: dishName, model }),
    })

    if (proxyRes.ok) {
      const json = await proxyRes.json()
      if (json && Array.isArray(json.ingredients)) return { ingredients: json.ingredients }
    }
  } catch (err) {
    // proxy not available -> fall back
  }

  // Client-side fallback: use direct OpenAI if key is present
  const key = import.meta.env.VITE_OPENAI_API_KEY
  if (!key) {
    // deterministic fallback
    const pool = [
      'Onion', 'Garlic', 'Tomato', 'Salt', 'Pepper', 'Oil', 'Butter', 'Cream', 'Paneer', 'Chicken',
      'Ginger', 'Cumin', 'Coriander', 'Chili', 'Basil', 'Oregano', 'Cheese', 'Milk', 'Yogurt', 'Lemon',
      'Potato', 'Carrot', 'Capsicum', 'Mushroom', 'Spinach', 'Rice', 'Wheat', 'Egg', 'Fish', 'Shrimp'
    ]
    const seed = dishName ? Array.from(dishName).reduce((s, ch) => s + ch.charCodeAt(0), 0) : Date.now()
    const picks = new Set()
    for (let i = 0; picks.size < 5 && i < pool.length; i++) {
      const idx = Math.abs((seed + i * 13) % pool.length)
      picks.add(pool[idx])
    }
    return { ingredients: Array.from(picks) }
  }

  // Call OpenAI directly from client (not recommended for production keys)
  const prompt = `Suggest a concise list of ingredients for the dish "${dishName}". Return only valid JSON with a single key \"ingredients\" whose value is an array of strings. Example: {"ingredients":["Paneer","Tomato"]}`
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.2, max_tokens: 200 }),
    })
    if (!res.ok) return { ingredients: [] }
    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || ''
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) return { ingredients: [] }
    try {
      const parsed = JSON.parse(m[0])
      return { ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [] }
    } catch (err) {
      return { ingredients: [] }
    }
  } catch (err) {
    return { ingredients: [] }
  }
}

export default suggestIngredientsAPI
