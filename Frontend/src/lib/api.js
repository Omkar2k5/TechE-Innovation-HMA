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
      // Return error object instead of null so we can handle it better
      return {
        success: false,
        message: `API Error ${res.status}: ${txt}`,
        status: res.status
      }
    }
    return await res.json()
  }catch(err){
    console.error('Request failed', err)
    // Return error object instead of null
    return {
      success: false,
      message: `Network Error: ${err.message}`,
      error: err
    }
  }
}

export default {
  get: (p) => request(p, { method: 'GET' }),
  post: (p, body) => request(p, { method: 'POST', body: JSON.stringify(body) }),
  put: (p, body) => request(p, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (p, body) => request(p, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
  del: (p, body) => request(p, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined })
}
