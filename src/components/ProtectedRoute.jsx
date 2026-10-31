
import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({
  children,
  allowedRoles = [],
}) {
  const raw =
    localStorage.getItem("speedExpressAdmin") ||
    sessionStorage.getItem("speedExpressAdmin");

  let session = null;

  try {
    session = raw ? JSON.parse(raw) : null;
  } catch {
    session = null;
  }

  if (!session?.token || !session?.loggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(session.role)
  ) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
