import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Hotels from "./pages/Hotels";
import POSControl from "./pages/POSControl";
import Users from "./pages/Users";
import Billing from "./pages/Billing";
import Analytics from "./pages/Analytics";
import Security from "./pages/Security";
import Support from "./pages/Support";
import Notifications from "./pages/Notifications";
import Plans from "./pages/Plans";
import AddHotel from "./pages/AddHotel";

function Layout() {
  const location = useLocation();
  const contentPadding = location.pathname === "/add-hotel" ? "p-0" : "p-6";

  return (
    <div className="flex">
      <Sidebar />
      <div className={`flex-1 ${contentPadding}`}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/add-hotel" element={<AddHotel />} />
          <Route path="/pos-control" element={<POSControl />} />
          <Route path="/users" element={<Users />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/security" element={<Security />} />
          <Route path="/support" element={<Support />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/plans" element={<Plans />} />
        </Routes>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}