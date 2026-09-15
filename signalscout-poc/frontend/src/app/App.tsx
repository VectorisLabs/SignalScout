import { Routes, Route, Navigate } from "react-router-dom";
import { InvestigationProvider } from "./investigation";
import { LandingPage } from "./pages/LandingPage";
import { ChatPage } from "./pages/ChatPage";
import { DashboardPage } from "./pages/DashboardPage";

export function App() {
  return <InvestigationProvider>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </InvestigationProvider>;
}
