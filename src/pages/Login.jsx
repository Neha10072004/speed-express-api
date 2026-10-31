
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"
).replace(/\/+$/, "");

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
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
          email: cleanEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Incorrect email or password."
        );
      }

      const adminSession = {
        token: data.token,
        activityId: data.activityId,
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        loggedIn: true,
      };

      localStorage.removeItem("speedExpressAdmin");
      sessionStorage.removeItem("speedExpressAdmin");

      const storage = rememberMe
        ? localStorage
        : sessionStorage;

      storage.setItem(
        "speedExpressAdmin",
        JSON.stringify(adminSession)
      );

      sessionStorage.removeItem("speedExpressDemoLogin");

      if (data.user.role === "admin") {
        navigate("/admin-dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.message || "Unable to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="se-login-page">
      <section className="se-login-card">
        <aside className="se-login-brand">
          <Link to="/" className="se-login-brand-logo">
            <span className="se-login-logo-icon">S</span>
            <span>
              <strong>Speed Express</strong>
              <small>COURIER &amp; LOGISTICS</small>
            </span>
          </Link>

          <div className="se-login-brand-content">
            <span className="se-login-eyebrow">
              YOUR LOGISTICS PARTNER
            </span>

            <h1>
              Move your
              <br />
              business
              <br />
              <span>forward.</span>
            </h1>

            <p>
              Manage shipments, track deliveries and keep
              your business moving from one simple dashboard.
            </p>

            <div className="se-login-benefits">
              <div className="se-login-benefit">
                <span className="se-login-check">✓</span>
                Real-time shipment management
              </div>
              <div className="se-login-benefit">
                <span className="se-login-check">✓</span>
                Easy booking and tracking
              </div>
              <div className="se-login-benefit">
                <span className="se-login-check">✓</span>
                Centralized dashboard
              </div>
            </div>
          </div>

          <div
            className="se-login-illustration"
            aria-hidden="true"
          >
            <div className="se-login-orbit se-login-orbit-one" />
            <div className="se-login-orbit se-login-orbit-two" />

            <div className="se-login-package">
              <div className="se-login-package-top" />
              <div className="se-login-package-front">
                <span />
              </div>
              <div className="se-login-package-side" />
            </div>

            <div className="se-login-route">
              <span className="se-login-route-dot" />
              <span className="se-login-route-line" />
              <span className="se-login-route-pin">↗</span>
            </div>

            <div className="se-login-floating-card">
              <span className="se-login-floating-icon">✓</span>
              <span>
                <strong>Delivery simplified</strong>
                <small>Every shipment matters</small>
              </span>
            </div>
          </div>

          <div className="se-login-brand-footer">
            <span>Reliable. Secure. Efficient.</span>
            <span>
              © {new Date().getFullYear()} Speed Express
            </span>
          </div>
        </aside>

        <section className="se-login-form-panel">
          <div className="se-login-mobile-logo">
            <span className="se-login-logo-icon">S</span>
            <strong>Speed Express</strong>
          </div>

          <div className="se-login-form-content">
            <div className="se-login-welcome-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                aria-hidden="true"
              >
                <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>

            <span className="se-login-overline">
              SECURE PORTAL
            </span>

            <h2>Welcome back</h2>

            <p className="se-login-subtitle">
              Sign in to access your Speed Express dashboard.
            </p>

            <form
              onSubmit={handleLogin}
              className="se-login-form"
            >
              <div className="se-login-field">
                <label htmlFor="login-email">
                  Email address
                </label>

                <div className="se-login-input-wrap">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    aria-hidden="true"
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                    />
                    <path d="m4 7 8 6 8-6" />
                  </svg>

                  <input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                    }}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="se-login-field">
                <div className="se-login-label-row">
                  <label htmlFor="login-password">
                    Password
                  </label>

                  <span className="se-login-admin-label">
                    Secure access
                  </span>
                </div>

                <div className="se-login-input-wrap">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    aria-hidden="true"
                  >
                    <rect
                      x="4"
                      y="10"
                      width="16"
                      height="11"
                      rx="2"
                    />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>

                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="se-login-password-toggle"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="se-login-options">
                <label className="se-login-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(event.target.checked)
                    }
                  />
                  <span>Remember me</span>
                </label>

                <span className="se-login-secure">
                  Secure login
                </span>
              </div>

              {error && (
                <div className="se-login-error" role="alert">
                  <span>!</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="se-login-submit"
                disabled={loading}
              >
                <span>
                  {loading ? "Signing in..." : "Sign In to Dashboard"}
                </span>
                {!loading && (
                  <span className="se-login-arrow">→</span>
                )}
              </button>
            </form>

            <div className="se-login-divider">
              <span />
              <small>AUTHORIZED PERSONNEL ONLY</small>
              <span />
            </div>

            <p className="se-login-help">
              Need help accessing your account?
              <span> Contact your system administrator.</span>
            </p>

            <Link to="/" className="se-login-back-home">
              <span>←</span> Back to website
            </Link>
          </div>

          <div className="se-login-bottom-note">
            <span>Speed Express Portal</span>
            <span>Secure access</span>
          </div>
        </section>
      </section>
    </main>
  );
}
