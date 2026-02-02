import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { loading, user } = useAuth();

  if (loading) return null;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

function homeForRole(role: "admin" | "seller" | "production") {
  if (role === "seller") return "/vendedor";
  if (role === "production") return "/producao";
  return "/";
}

export function RequireRole({
  children,
  allow,
}: {
  children: ReactNode;
  allow: Array<"admin" | "seller" | "production">;
}) {
  const location = useLocation();
  const { loading, user } = useAuth();

  if (loading) return null;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!allow.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  return <>{children}</>;
}
