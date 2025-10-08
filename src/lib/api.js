const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api"

async function request(path, opts = {}) {
  try {
    console.log(`API Request: ${opts.method || "GET"} ${API_BASE}${path}`)
    if (opts.body) {
      console.log("Request body:", JSON.parse(opts.body))
    }

    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...opts,
    })

    if (!res.ok) {
      const txt = await res.text()
      console.error("API error", res.status, txt)
      throw new Error(txt || `HTTP ${res.status}`)
    }

    const data = await res.json()
    console.log(`API Response (${Array.isArray(data) ? data.length : "object"} items):`, data)
    return { data } // Return wrapped in data property
  } catch (err) {
    console.error("Request failed", err)
    throw err
  }
}

export default {
  get: (p) => request(p, { method: "GET" }),
  post: (p, body) => request(p, { method: "POST", body: JSON.stringify(body) }),
  put: (p, body) => request(p, { method: "PUT", body: JSON.stringify(body) }),
  del: (p) => request(p, { method: "DELETE" }),
}
