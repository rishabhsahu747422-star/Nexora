import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import NexoraSymbol from "../../assets/logo/NexoraSymbol";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--app-bg)] text-slate-200 select-none">
        <div className="relative mb-4">
          <div className="absolute -inset-3 bg-[var(--accent-glow)] opacity-25 rounded-full blur-xl animate-pulse" />
          <NexoraSymbol size={48} className="relative z-10 animate-pulse" />
        </div>
        <p className="font-mono text-xs text-[var(--accent)] tracking-widest uppercase">
          Authenticating session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;

