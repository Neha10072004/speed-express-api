import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();

    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    localStorage.setItem(
      "speedExpressUser",
      JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password
      })
    );

    localStorage.setItem("speedExpressLoggedIn", "true");
    navigate("/");
  };

  return (
    <section className="auth-page">
      <div className="auth-background-shape auth-shape-one" />
      <div className="auth-background-shape auth-shape-two" />

      <div className="auth-card signup-card">
        <div className="auth-brand">
          <img
  src={`${import.meta.env.BASE_URL}speed-express-logo.png`}
  alt="Speed Express"
/>
        </div>

        <div className="auth-title">
          <span className="eyebrow blue">CREATE ACCOUNT</span>
          <h1>Join <span>Speed Express</span></h1>
          <p>Create your account to manage your courier requirements.</p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <div className="auth-two">
            <label>
              Full Name
              <input
                required
                placeholder="Your full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>

            <label>
              Phone
              <input
                required
                type="tel"
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
          </div>

          <label>
            Email Address
            <input
              required
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>

          <div className="auth-two">
            <label>
              Password
              <input
                required
                type="password"
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>

            <label>
              Confirm Password
              <input
                required
                type="password"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              />
            </label>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="btn btn-primary auth-submit">Create Account →</button>
        </form>

        <div className="auth-divider"><span>OR</span></div>

        <p className="auth-switch">
          Already have an account?
          <Link to="/login"> Login here</Link>
        </p>
      </div>
    </section>
  );
}
