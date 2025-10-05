"use client"
import { BrowserRouter } from "react-router-dom"
import App from "../src/App"
import "../src/index.css"

export default function Page() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}
