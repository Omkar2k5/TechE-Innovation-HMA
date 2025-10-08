import React, { useEffect, useState } from 'react'
import api from '../../../lib/api'

export default function SuppliersAdmin(){
  const [list, setList] = useState([])
  const [form, setForm] = useState({ name:'', phone:'', email:'', paymentTerms:'' })

  const fetch = async ()=>{ const res = await api.get('/suppliers'); if(res) setList(res) }
  useEffect(()=>{ fetch() }, [])

  const save = async ()=>{ await api.post('/suppliers', form); setForm({ name:'', phone:'', email:'', paymentTerms:'' }); fetch() }

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Suppliers</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <input placeholder="Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="p-2 border w-full mb-2" />
          <input placeholder="Phone" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className="p-2 border w-full mb-2" />
          <input placeholder="Email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className="p-2 border w-full mb-2" />
          <input placeholder="Payment terms" value={form.paymentTerms} onChange={e=>setForm(f=>({...f,paymentTerms:e.target.value}))} className="p-2 border w-full mb-2" />
          <div className="flex justify-end"><button onClick={save} className="px-3 py-2 bg-blue-600 text-white rounded">Add Supplier</button></div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <ul className="space-y-2">
            {list.map(s=> <li key={s._id} className="border-b py-2">{s.name} · {s.phone} · {s.email}</li>)}
          </ul>
        </div>
      </div>
    </div>
  )
}
