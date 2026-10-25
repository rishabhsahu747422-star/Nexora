import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { AnimatePresence } from "framer-motion";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Workspace from "./pages/Workspace";
import Profile from "./pages/Profile";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

// Layout & Global Overlays
import ProtectedRoute from "./components/layout/ProtectedRoute";
import StartupScreen from "./components/loading/StartupScreen";
import ToastContainer from "./components/common/ToastContainer";
import ModalManager from "./components/modals/ModalManager";
import GlobalSearchModal from "./components/layout/GlobalSearchModal";
import SocketManager from "./socket/SocketManager";
import { getMeAsync } from "./redux/slices/authSlice";

function RootRedirect() {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  if (loading) return null;
  return <Navigate to={isAuthenticated && user ? "/app" : "/login"} replace />;
}

export default function App() {
  const dispatch = useDispatch();
  const [hasStartedUp, setHasStartedUp] = useState(() => {
    return sessionStorage.getItem("nexora_booted") === "true";
  });

  const theme = useSelector((state) => state.ui.theme);

  useEffect(() => {
    dispatch(getMeAsync());
  }, [dispatch]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      // System mode
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [theme]);

  const handleStartupComplete = () => {
    sessionStorage.setItem("nexora_booted", "true");
    setHasStartedUp(true);
  };

  return (
    <div className="h-full w-full relative">
      {/* Nexora Startup / Loading Experience */}
      <AnimatePresence>
        {!hasStartedUp && <StartupScreen onComplete={handleStartupComplete} />}
      </AnimatePresence>

      {/* Main Application Router */}
      <Routes>
        {/* Root authentication-aware redirect */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Workspace Routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Workspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/server/:serverId"
          element={
            <ProtectedRoute>
              <Workspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/server/:serverId/channel/:channelId"
          element={
            <ProtectedRoute>
              <Workspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/messages"
          element={
            <ProtectedRoute>
              <Workspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/messages/:dmId"
          element={
            <ProtectedRoute>
              <Workspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Global Modals, Search & Toasts */}
      <SocketManager />
      <ModalManager />
      <GlobalSearchModal />
      <ToastContainer />
    </div>
  );
}
