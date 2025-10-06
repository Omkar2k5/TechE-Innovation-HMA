const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'

async function request(path, opts = {}){
  try{
    const token = localStorage.getItem('authToken')
    const headers = { 
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
    
    const res = await fetch(`${API_BASE}${path}`, {
      headers,
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
