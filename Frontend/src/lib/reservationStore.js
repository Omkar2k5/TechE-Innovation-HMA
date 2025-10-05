// Simple in-memory reservation store with subscribe support
let reservations = []
const subscribers = new Set()

export function getReservations(){ return reservations }

export function setReservations(next){
  reservations = Array.isArray(next) ? next : []
  subscribers.forEach(s=>s(reservations))
}

export function addReservation(r){
  reservations = [...reservations, r]
  subscribers.forEach(s=>s(reservations))
}

export function subscribe(cb){
  subscribers.add(cb)
  cb(reservations)
  return ()=>subscribers.delete(cb)
}

const api = { getReservations, setReservations, addReservation, subscribe }
export default api
