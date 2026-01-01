import App from "./App.jsx"
import { AppProvider } from "./store/app-store.jsx"

export default function AppRoot() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  )
}
