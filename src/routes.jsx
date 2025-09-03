import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Hotels from "./pages/Hotels";
import POSControl from "./pages/POSControl";
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