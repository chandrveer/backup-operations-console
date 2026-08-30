import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { api } from "./api/client";

import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Assets from "./pages/Assets";
import AssetDetail from "./pages/AssetDetail";
import Applications from "./pages/Applications";
import Platforms from "./pages/Platforms";
import SlaRpo from "./pages/SlaRpo";
import AlertsPage from "./pages/Alerts";
import Reports from "./pages/Reports";
import Integrations from "./pages/Integrations";
import Administration from "./pages/Administration";

export default function App() {
  const [openAlertCount, setOpenAlertCount] = useState(0);

  useEffect(() => {
    api.dashboard.summary().then((s) => setOpenAlertCount(s.open_alerts)).catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar openAlertCount={openAlertCount} />
      <div className="flex-1 min-w-0">
        <Topbar />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/assets/:id" element={<AssetDetail />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/platforms" element={<Platforms />} />
            <Route path="/sla" element={<SlaRpo />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/administration" element={<Administration />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
