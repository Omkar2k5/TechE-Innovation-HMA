const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'

async function request(path, opts = {}){
  try{
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opts
    })
    if (!res.ok) {
      const txt = await res.text()
      console.error('API error', res.status, txt)
      return null
    }
    return await res.json()
  }catch(err){
    console.error('Request failed', err)
    return null
  }
}

export default {
  get: (p) => request(p, { method: 'GET' }),
  post: (p, body) => request(p, { method: 'POST', body: JSON.stringify(body) }),
  put: (p, body) => request(p, { method: 'PUT', body: JSON.stringify(body) }),
  del: (p) => request(p, { method: 'DELETE' })
}
