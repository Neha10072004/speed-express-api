import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    setError("");

    const adminEmail = "anushkaspeedexpress@gmail.com";
    const adminPassword = "qwerty1234";

    if (
      email.trim().toLowerCase() === adminEmail &&
      password === adminPassword
    ) {
      const adminData = {
        email: adminEmail,
        role: "admin",
        loggedIn: true,
      };

      localStorage.setItem(
        "speedExpressAdmin",
        JSON.stringify(adminData)
      );

      navigate("/admin-dashboard/home", {
        replace: true,
      });

      return;
    }

    setError("Invalid email or password.");
  };

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-logo">
          <img
  src={`${import.meta.env.BASE_URL}speed-express-logo.png`}
  alt="Speed Express"
/>
        </div>

        <h1>Welcome Back</h1>

        <p className="login-subtitle">
          Login to Speed Express Admin Panel
        </p>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="form-group">

            <label htmlFor="email">
              Email Address
            </label>

            <input
              id="email"
              type="email"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />

          </div>

          <div className="form-group">

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />

          </div>

          <button
            type="submit"
            className="login-btn"
          >
            Login
          </button>

        </form>

        <div className="login-footer">

          <p>
            Don't have an account?{" "}

            <Link to="/signup">
              Create Account
            </Link>
          </p>

        </div>

      </div>

    </div>
  );
}