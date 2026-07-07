import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import type { ReactNode } from "react";
import { AppShell } from "./components/AppShell";
import { ModalProvider } from "./components/ModalProvider";
import { AmpakToastProvider } from "./components/AmpakToast";
import { useDriftWatcher } from "./hooks/useDriftWatcher";
import { useReminderEngine } from "./hooks/useReminderEngine";
import { useCloudSync } from "./hooks/useCloudSync";
import { useUserSession } from "./hooks/useUserSession";
import { useAdminNotices } from "./hooks/useAdminNotices";
import { useAuthStore } from "./store/useAuthStore";

import { Login } from "./pages/Login";
import { AdminGate } from "./pages/AdminGate";
import { Dashboard } from "./pages/Dashboard";
import { Tasks } from "./pages/Tasks";
import { MorningPlanner } from "./pages/MorningPlanner";
import { MiddayCheckin } from "./pages/MiddayCheckin";
import { NightReflection } from "./pages/NightReflection";
import { MapaZivljenja } from "./pages/MapaZivljenja";
import { Goals } from "./pages/Goals";
import { SundayReset } from "./pages/SundayReset";
import { Leaderboard } from "./pages/Leaderboard";
import { PublicChat } from "./pages/PublicChat";
import { Profile } from "./pages/Profile";

function RequireAuth({ children }: { children: ReactNode }) {
  const userId = useAuthStore((s) => s.current_user_id);
  const location = useLocation();
  if (!userId) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function ProtectedApp() {
  useUserSession();
  useDriftWatcher();
  useReminderEngine();
  useCloudSync();
  useAdminNotices();
  return <AppShell />;
}

export default function App() {
  return (
    <AmpakToastProvider>
      <BrowserRouter>
        <ModalProvider />
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Standalone, passcode-gated admin — not in the user nav. */}
          <Route path="/admin" element={<AdminGate />} />

          <Route
            element={
              <RequireAuth>
                <ProtectedApp />
              </RequireAuth>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/morning" element={<MorningPlanner />} />
            <Route path="/midday" element={<MiddayCheckin />} />
            <Route path="/night" element={<NightReflection />} />
            <Route path="/mapa" element={<MapaZivljenja />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/sunday" element={<SundayReset />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/chat" element={<PublicChat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AmpakToastProvider>
  );
}
