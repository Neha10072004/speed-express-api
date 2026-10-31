
import React, { useEffect, useState } from "react";
import "./UserManagement.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://api.speedexp.in/api"
).replace(/\/+$/, "");

function getSession() {
  try {
    const raw =
      localStorage.getItem("speedExpressAdmin") ||
      sessionStorage.getItem("speedExpressAdmin");

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [counts, setCounts] = useState({
    admins: 0,
    regularUsers: 0,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("users");

  const session = getSession();
  const token = session?.token;

  const request = async (path, options = {}) => {
    if (!token) {
      throw new Error("Please log in again. Your session has expired.");
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  };

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [usersData, activityData] = await Promise.all([
        request("/admin/users"),
        request("/admin/login-activity"),
      ]);

      setUsers(usersData.users || []);
      setCounts(
        usersData.counts || {
          admins: 0,
          regularUsers: 0,
        }
      );
      setActivity(activityData.activity || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.role !== "admin") {
      setError("Only admins can access user management.");
      setLoading(false);
      return;
    }

    loadData();
    // The login token is stable for this mounted page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!name.trim() || !email.trim() || password.length < 8) {
      setError(
        "Enter a name, email and password with at least 8 characters."
      );
      return;
    }

    setSaving(true);

    try {
      await request("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
        }),
      });

      setName("");
      setEmail("");
      setPassword("");
      setRole("user");

      setMessage("Account created successfully.");
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (user) => {
    setError("");
    setMessage("");

    try {
      await request(`/admin/users/${user._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          isActive: !user.isActive,
        }),
      });

      setMessage("Account status updated.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (session?.role !== "admin") {
    return (
      <div className="um-message um-error">
        Admin access is required to manage accounts.
      </div>
    );
  }

  return (
    <section className="um-page">
      <div className="um-heading">
        <div>
          <span className="um-eyebrow">ADMIN SETTINGS</span>
          <h2>User Management</h2>
          <p>
            Add and manage Speed Express dashboard accounts.
          </p>
        </div>

        <button
          type="button"
          className="um-refresh"
          onClick={loadData}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      <div className="um-stats">
        <article className="um-stat">
          <span>Admin accounts</span>
          <strong>{counts.admins} / 2</strong>
        </article>

        <article className="um-stat">
          <span>Regular users</span>
          <strong>{counts.regularUsers} / 6</strong>
        </article>

        <article className="um-stat">
          <span>Total accounts</span>
          <strong>{counts.admins + counts.regularUsers} / 8</strong>
        </article>
      </div>

      <div className="um-tabs">
        <button
          type="button"
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>

        <button
          type="button"
          className={activeTab === "activity" ? "active" : ""}
          onClick={() => setActiveTab("activity")}
        >
          Login Activity
        </button>
      </div>

      {error && (
        <div className="um-message um-error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="um-message um-success" role="status">
          {message}
        </div>
      )}

      {activeTab === "users" && (
        <>
          <form className="um-form" onSubmit={handleCreateUser}>
            <h3>Add Dashboard User</h3>

            <div className="um-form-grid">
              <label>
                Full name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter full name"
                  required
                />
              </label>

              <label>
                Email address
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter email"
                  required
                />
              </label>

              <label>
                Temporary password
                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  required
                />
              </label>

              <label>
                Account role
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                >
                  <option value="user">Regular user</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            </div>

            <button
              className="um-primary-button"
              type="submit"
              disabled={saving}
            >
              {saving ? "Creating..." : "Add User"}
            </button>
          </form>

          <div className="um-table-card">
            <h3>All Accounts</h3>

            {loading ? (
              <p>Loading accounts...</p>
            ) : users.length === 0 ? (
              <p>No accounts found.</p>
            ) : (
              <div className="um-table-scroll">
                <table className="um-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`um-role ${user.role}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span
                            className={
                              user.isActive
                                ? "um-status active"
                                : "um-status inactive"
                            }
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          {user.isInitialAdmin ? (
                            <span className="um-protected">
                              Protected
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="um-action"
                              onClick={() => handleStatusChange(user)}
                            >
                              {user.isActive
                                ? "Deactivate"
                                : "Activate"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "activity" && (
        <div className="um-table-card">
          <h3>Login and Logout History</h3>

          {loading ? (
            <p>Loading activity...</p>
          ) : activity.length === 0 ? (
            <p>No login activity found.</p>
          ) : (
            <div className="um-table-scroll">
              <table className="um-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Login time</th>
                    <th>Logout time</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {activity.map((item) => (
                    <tr key={item._id}>
                      <td>
                        {item.user?.name || item.name}
                        <small className="um-email">
                          {item.user?.email || item.email}
                        </small>
                      </td>
                      <td>{item.user?.role || item.role}</td>
                      <td>
                        {item.loginAt
                          ? new Date(item.loginAt).toLocaleString("en-IN")
                          : "—"}
                      </td>
                      <td>
                        {item.logoutAt
                          ? new Date(item.logoutAt).toLocaleString("en-IN")
                          : "—"}
                      </td>
                      <td>
                        <span
                          className={
                            item.status === "active"
                              ? "um-status active"
                              : "um-status inactive"
                          }
                        >
                          {item.status === "active"
                            ? "Active"
                            : "Logged out"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
