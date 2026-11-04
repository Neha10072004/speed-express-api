
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

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

      const loggedInUser = data.user || data.admin;

      if (!data.token || !loggedInUser) {
        throw new Error(
          "Login response is incomplete. Please contact the administrator."
        );
      }

      // Allow Admin and Staff accounts.
      const userRole = String(loggedInUser.role || "")
        .trim()
        .toLowerCase();

      if (!["admin", "user"].includes(userRole)) {
        throw new Error(
          "Your account does not have dashboard access."
        );
      }

      // Preserve the session structure used by the dashboard.
      const adminSession = {
        token: data.token,
        activityId: data.activityId || null,
        id: loggedInUser.id || loggedInUser._id || "",
        name: loggedInUser.name || "Speed Express User",
        email: loggedInUser.email || trimmedEmail,
        role: userRole,
        loggedIn: true,
      };

      // Clear previous sessions to avoid conflicting credentials.
      localStorage.removeItem("speedExpressAdmin");
      sessionStorage.removeItem("speedExpressAdmin");

      localStorage.removeItem("speedExpressToken");
      sessionStorage.removeItem("speedExpressToken");

      localStorage.removeItem("speedExpressDemoLogin");
      sessionStorage.removeItem("speedExpressDemoLogin");

      // Save the session according to Remember Me.
      const storage = rememberMe ? localStorage : sessionStorage;

      storage.setItem(
        "speedExpressAdmin",
        JSON.stringify(adminSession)
      );

      storage.setItem("speedExpressToken", data.token);

      // Admin and Staff use the same dashboard.
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
    <main className="se-login-page">
      <div className="se-login-shell">

        {/* LEFT BRAND PANEL */}
        <section className="se-login-brand-panel">

          <div className="se-brand-top">
            <Link to="/" className="se-brand-logo-link">
              <img
                src={`${import.meta.env.BASE_URL}speed-express-logo.png`}
                alt="Speed Express Courier and Logistics"
                className="se-brand-logo"
              />
            </Link>

            <span className="se-brand-category">
              COURIER &amp; LOGISTICS
            </span>
          </div>

          <div className="se-brand-content">

            <span className="se-eyebrow">
              <span className="se-eyebrow-dot" />
              YOUR LOGISTICS PARTNER
            </span>

            <h1>
              Move your
              <br />
              business <span>forward.</span>
            </h1>

            <p className="se-brand-description">
              Manage shipments, track deliveries and keep your
              business moving from one simple dashboard.
            </p>

            <div className="se-feature-list">
              <div className="se-feature-item">
                <span className="se-feature-icon">✓</span>
                <span>Real-time shipment management</span>
              </div>

              <div className="se-feature-item">
                <span className="se-feature-icon">✓</span>
                <span>Easy booking and tracking</span>
              </div>

              <div className="se-feature-item">
                <span className="se-feature-icon">✓</span>
                <span>Centralized dashboard</span>
              </div>
            </div>

            {/* Decorative logistics visual */}
            <div className="se-logistics-visual" aria-hidden="true">

              <div className="se-visual-glow" />

              <div className="se-route-line">
                <span className="se-route-point" />
                <span className="se-route-dashes" />
                <span className="se-route-point" />
              </div>

              <div className="se-visual-card se-visual-card-one">
                <span className="se-visual-card-icon">↗</span>
                <span>
                  <strong>Fast delivery</strong>
                  <small>Moving forward</small>
                </span>
              </div>

              <div className="se-visual-card se-visual-card-two">
                <span className="se-visual-status-dot" />
                <span>
                  <strong>Shipment tracking</strong>
                  <small>Stay up to date</small>
                </span>
              </div>

              <div className="se-visual-center">
                <span className="se-visual-center-icon">SE</span>
              </div>
            </div>
          </div>

          <div className="se-brand-bottom">
            <div>
              <strong>Reliable. Secure. Efficient.</strong>
              <span>Built to keep your business moving.</span>
            </div>

            <span className="se-copyright">
              © 2026 Speed Express
            </span>
          </div>
        </section>

        {/* RIGHT LOGIN PANEL */}
        <section className="se-login-form-panel">

          <div className="se-login-form-top">

            {/* Logo shown on mobile */}
            <Link to="/" className="se-mobile-logo">
              <img
                src={`${import.meta.env.BASE_URL}speed-express-logo.png`}
                alt="Speed Express"
              />
            </Link>

            <span className="se-secure-label">
              <span className="se-secure-icon">◆</span>
              SECURE PORTAL
            </span>
          </div>

          <div className="se-login-content">

            <div className="se-login-heading">
              <span className="se-login-welcome">
                WELCOME BACK
              </span>

              <h2>Welcome back</h2>

              <p>
                Sign in to access your Speed Express dashboard.
              </p>
            </div>

            <form
              className="se-login-form"
              onSubmit={handleSubmit}
            >
              {error && (
                <div className="se-login-error" role="alert">
                  <span className="se-error-icon">!</span>
                  <span>{error}</span>
                </div>
              )}

              {/* EMAIL */}
              <div className="se-login-field">
                <label htmlFor="email">Email address</label>

                <div className="se-input-wrapper">
                  <span className="se-input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                      />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                  </span>

                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="username"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="se-login-field">
                <label htmlFor="password">Password</label>

                <div className="se-input-wrapper">
                  <span className="se-input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <rect
                        x="4"
                        y="10"
                        width="16"
                        height="11"
                        rx="2"
                      />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      <path d="M12 14v3" />
                    </svg>
                  </span>

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
                    className="se-password-toggle"
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

              {/* REMEMBER ME */}
              <div className="se-login-options">
                <label className="se-remember-control">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(event.target.checked)
                    }
                    disabled={loading}
                  />

                  <span className="se-custom-checkbox">
                    <svg viewBox="0 0 16 16">
                      <path d="m3 8 3 3 7-7" />
                    </svg>
                  </span>

                  <span>Remember me</span>
                </label>

                <span className="se-session-label">
                  <span />
                  Protected session
                </span>
              </div>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                className="se-login-button"
                disabled={loading}
              >
                <span>
                  {loading ? "Signing in..." : "Sign In to Dashboard"}
                </span>

                {!loading && (
                  <span className="se-button-arrow">→</span>
                )}

                {loading && (
                  <span className="se-button-spinner" />
                )}
              </button>
            </form>

            <div className="se-authorized-note">
              <span className="se-authorized-icon">◆</span>
              <span>AUTHORIZED PERSONNEL ONLY</span>
            </div>

            <p className="se-help-text">
              Need help accessing your account? Contact your system
              administrator.
            </p>
          </div>

          <div className="se-login-panel-footer">
            <Link to="/" className="se-back-link">
              <span>←</span>
              Back to website
            </Link>

            <span className="se-portal-caption">
              Speed Express Portal · Secure access
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
