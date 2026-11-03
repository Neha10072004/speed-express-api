
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

// API configuration
const API_URL = (
  import.meta.env.VITE_API_URL || "https://api.speedexp.in/api"
).replace(/\/+$/, "");

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Invalid email or password.");
      }

      // Support the user object returned by the login API.
      const loggedInUser = data.user || data.admin;

      if (!data.token || !loggedInUser) {
        throw new Error(
          "Login response is incomplete. Please contact the administrator."
        );
      }

      // Allow both Admin and Staff User accounts.
      const userRole = String(loggedInUser.role || "")
        .trim()
        .toLowerCase();

      if (!["admin", "user"].includes(userRole)) {
        throw new Error("Your account does not have dashboard access.");
      }

      // Create the session used by AdminDashboard and AdminSidebar.
      const adminSession = {
        token: data.token,
        activityId: data.activityId || null,
        id: loggedInUser.id || loggedInUser._id || "",
        name: loggedInUser.name || "Speed Express User",
        email: loggedInUser.email || trimmedEmail,
        role: userRole,
        loggedIn: true,
      };

      // Remove old sessions to prevent conflicting login data.
      localStorage.removeItem("speedExpressAdmin");
      sessionStorage.removeItem("speedExpressAdmin");

      localStorage.removeItem("speedExpressToken");
      sessionStorage.removeItem("speedExpressToken");

      localStorage.removeItem("speedExpressDemoLogin");
      sessionStorage.removeItem("speedExpressDemoLogin");

      // Save according to Remember Me.
      const storage = rememberMe ? localStorage : sessionStorage;

      storage.setItem(
        "speedExpressAdmin",
        JSON.stringify(adminSession)
      );

      storage.setItem("speedExpressToken", data.token);

      // Both Admin and Staff Users open the same dashboard.
      navigate("/admin-dashboard/home", {
        replace: true,
      });
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.message ||
          "Unable to login. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="se-login-page">
      <div className="se-login-container">
        <div className="se-login-card">

          {/* Logo and heading */}
          <div className="se-login-header">
            <img
              src={`${import.meta.env.BASE_URL}speed-express-logo.png`}
              alt="Speed Express"
              className="se-login-logo"
            />

            <h1>Welcome Back</h1>

            <p>
              Login to your Speed Express account
            </p>
          </div>

          {/* Login form */}
          <form
            className="se-login-form"
            onSubmit={handleSubmit}
          >
            {error && (
              <div
                className="se-login-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Email */}
            <div className="se-login-field">
              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="se-login-field">
              <label htmlFor="password">
                Password
              </label>

              <div className="se-login-password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="se-login-password-toggle"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  disabled={loading}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="se-login-options">
              <label className="se-login-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(event.target.checked)
                  }
                  disabled={loading}
                />

                <span>Remember me</span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="se-login-button"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Footer */}
          <div className="se-login-footer">
            <p>
              Don't have an account?{" "}
              <Link to="/signup">Sign up</Link>
            </p>

            <Link to="/" className="se-login-home-link">
              Back to Home
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
