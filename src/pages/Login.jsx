
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

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

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      /*
       * DEMO LOGIN ONLY.
       * Replace this section with backend authentication
       * before using the website in production.
       */
      const validEmail = "anushkaspeedexpress@gmail.com";
      const validPassword = "qwerty1234";

      if (
        cleanEmail === validEmail &&
        password === validPassword
      ) {
        const admin = {
          email: cleanEmail,
          role: "admin",
        };

        // Clear old login information first.
        localStorage.removeItem("speedExpressAdmin");
        sessionStorage.removeItem("speedExpressAdmin");

        // Save admin information according to Remember Me.
        const storage = rememberMe
          ? localStorage
          : sessionStorage;

        storage.setItem(
          "speedExpressAdmin",
          JSON.stringify(admin)
        );

        // Set the login flag in the current browser tab.
        sessionStorage.setItem(
          "speedExpressDemoLogin",
          "true"
        );

        // Open the admin dashboard.
        navigate("/admin-dashboard", {
          replace: true,
        });
      } else {
        setError(
          "Incorrect email or password. Please try again."
        );
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="se-login-page">
      <section className="se-login-card">
        {/* LEFT BRANDING PANEL */}
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
                Centralized admin dashboard
              </div>
            </div>
          </div>

          {/* Decorative shipment illustration */}
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

        {/* RIGHT LOGIN PANEL */}
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
              ADMIN PORTAL
            </span>

            <h2>Welcome back</h2>

            <p className="se-login-subtitle">
              Sign in to access your Speed Express dashboard.
            </p>

            <form
              onSubmit={handleLogin}
              className="se-login-form"
            >
              {/* EMAIL FIELD */}
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
                    placeholder="Enter your admin email"
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

              {/* PASSWORD FIELD */}
              <div className="se-login-field">
                <div className="se-login-label-row">
                  <label htmlFor="login-password">
                    Password
                  </label>

                  <span className="se-login-admin-label">
                    Admin access
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
                      setShowPassword(!showPassword)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        aria-hidden="true"
                      >
                        <path d="M3 3 21 21" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.5 0 9 7 9 7a16 16 0 0 1-3 3.8" />
                        <path d="M6.2 6.2C4.1 7.6 3 12 3 12s3.5 7 9 7c1.3 0 2.5-.4 3.6-1" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        aria-hidden="true"
                      >
                        <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* REMEMBER ME */}
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
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <rect
                      x="5"
                      y="10"
                      width="14"
                      height="11"
                      rx="2"
                    />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>

                  Secure login
                </span>
              </div>

              {/* ERROR MESSAGE */}
              {error && (
                <div
                  className="se-login-error"
                  role="alert"
                >
                  <span>!</span>
                  {error}
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="se-login-submit"
                disabled={loading}
              >
                <span>
                  {loading
                    ? "Signing in..."
                    : "Sign In to Dashboard"}
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
              <span>
                {" "}
                Contact your system administrator.
              </span>
            </p>

            <Link
              to="/"
              className="se-login-back-home"
            >
              <span>←</span> Back to website
            </Link>
          </div>

          <div className="se-login-bottom-note">
            <span>Speed Express Admin Portal</span>
            <span>Secure access</span>
          </div>
        </section>
      </section>
    </main>
  );
}