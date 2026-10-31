import React, { useCallback, useEffect, useState } from "react";
import "./Settings.css";
import UserManagement from "../components/UserManagement";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "https://api.speedexp.in/api"
).replace(/\/+$/, "");

const USER_LIMIT = 6;
const ADMIN_LIMIT = 2;

function getStoredAdmin() {
  try {
    const storedAdmin =
      localStorage.getItem("speedExpressAdmin") ||
      sessionStorage.getItem("speedExpressAdmin");

    return storedAdmin ? JSON.parse(storedAdmin) : null;
  } catch (error) {
    console.error("Unable to read admin session:", error);
    return null;
  }
}

function getAuthToken() {
  const admin = getStoredAdmin();

  return (
    admin?.token ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("authToken") ||
    localStorage.getItem("speedExpressToken") ||
    sessionStorage.getItem("speedExpressToken") ||
    ""
  );
}

async function apiRequest(path, options = {}) {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function getRole(user) {
  return String(user?.role || "user").toLowerCase();
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");

  const [admin] = useState(getStoredAdmin);

  const [profile, setProfile] = useState({
    name: admin?.name || "Administrator",
    email: admin?.email || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);

  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const [editingUserId, setEditingUserId] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [userSearch, setUserSearch] = useState("");
  const [activitySearch, setActivitySearch] = useState("");

  const isAdmin =
  Boolean(admin) &&
  String(admin.role || "").trim().toLowerCase() === "admin";

  const regularUserCount = users.filter(
    (user) => getRole(user) === "user"
  ).length;

  const adminCount = users.filter(
    (user) => getRole(user) === "admin"
  ).length;

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;

    setLoadingUsers(true);
    setError("");

    try {
      const data = await apiRequest("/admin/users");

      setUsers(data.users || data.data?.users || []);
    } catch (err) {
      setError(err.message || "Unable to load users.");
    } finally {
      setLoadingUsers(false);
    }
  }, [isAdmin]);

  const loadActivity = useCallback(async () => {
    if (!isAdmin) return;

    setLoadingActivity(true);
    setError("");

    try {
      const data = await apiRequest("/admin/login-activity");

      setActivities(data.activities || data.data?.activities || []);
    } catch (err) {
      setError(err.message || "Unable to load login activity.");
    } finally {
      setLoadingActivity(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (activeTab === "users" && isAdmin) {
      loadUsers();
    }

    if (activeTab === "activity" && isAdmin) {
      loadActivity();
    }
  }, [activeTab, isAdmin, loadUsers, loadActivity]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setProfileMessage("");
    setError("");
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setProfileMessage("");

    try {
      const data = await apiRequest("/admin/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: profile.name.trim(),
          email: profile.email.trim(),
        }),
      });

      const updatedAdmin = {
        ...admin,
        ...(data.user || data.data?.user || {}),
        name: profile.name.trim(),
        email: profile.email.trim(),
      };

      localStorage.setItem(
        "speedExpressAdmin",
        JSON.stringify(updatedAdmin)
      );

      setProfileMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setPasswordMessage("");
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setPasswordMessage("");

    if (passwordForm.newPassword.length < 8) {
      setError("New password must contain at least 8 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setSaving(true);

    try {
      const data = await apiRequest("/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordMessage(
        data.message || "Password changed successfully."
      );
    } catch (err) {
      setError(err.message || "Unable to change password.");
    } finally {
      setSaving(false);
    }
  };

  const resetUserForm = () => {
    setUserForm({
      name: "",
      email: "",
      password: "",
      role: "user",
    });

    setEditingUserId(null);
    setShowUserForm(false);
  };

  const openAddUser = () => {
    resetUserForm();
    setShowUserForm(true);
    setError("");
    setSuccess("");
  };

  const openEditUser = (user) => {
    setUserForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: getRole(user),
    });

    setEditingUserId(user._id || user.id);
    setShowUserForm(true);
    setError("");
    setSuccess("");
  };

  const handleUserFormChange = (event) => {
    const { name, value } = event.target;

    setUserForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleUserSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const role = userForm.role.toLowerCase();

    if (!editingUserId) {
      if (role === "user" && regularUserCount >= USER_LIMIT) {
        setError("Maximum 6 regular user accounts are allowed.");
        return;
      }

      if (role === "admin" && adminCount >= ADMIN_LIMIT) {
        setError("Maximum 2 administrator accounts are allowed.");
        return;
      }

      if (userForm.password.length < 8) {
        setError("Password must contain at least 8 characters.");
        return;
      }
    }

    setSaving(true);

    try {
      const payload = {
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        role,
      };

      if (userForm.password) {
        payload.password = userForm.password;
      }

      const data = await apiRequest(
        editingUserId
          ? `/admin/users/${encodeURIComponent(editingUserId)}`
          : "/admin/users",
        {
          method: editingUserId ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      setSuccess(
        data.message ||
          (editingUserId
            ? "User updated successfully."
            : "User created successfully.")
      );

      resetUserForm();
      await loadUsers();
    } catch (err) {
      setError(err.message || "Unable to save user.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleUser = async (user) => {
    const userId = user._id || user.id;

    if (!userId) return;

    setError("");
    setSuccess("");

    try {
      const data = await apiRequest(
        `/admin/users/${encodeURIComponent(userId)}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            isActive: user.isActive === false,
          }),
        }
      );

      setSuccess(data.message || "User status updated.");
      await loadUsers();
    } catch (err) {
      setError(err.message || "Unable to update user status.");
    }
  };

  const filteredUsers = users.filter((user) => {
    const search = userSearch.toLowerCase();

    return (
      String(user.name || "").toLowerCase().includes(search) ||
      String(user.email || "").toLowerCase().includes(search) ||
      getRole(user).includes(search)
    );
  });

  const filteredActivities = activities.filter((activity) => {
    const search = activitySearch.toLowerCase();

    return (
      String(activity.name || activity.user?.name || "")
        .toLowerCase()
        .includes(search) ||
      String(activity.email || activity.user?.email || "")
        .toLowerCase()
        .includes(search) ||
      String(activity.role || activity.user?.role || "")
        .toLowerCase()
        .includes(search)
    );
  });

  if (!isAdmin) {
    return (
      <div className="settings-page">
        <div className="settings-access-denied">
          <div className="settings-access-icon">🔒</div>
          <h2>Administrator Access Required</h2>
          <p>
            You do not have permission to access this settings page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-breadcrumb">
        <span>Home</span>
        <span>/</span>
        <strong>Settings</strong>
      </div>

      <div className="settings-page-header">
        <div>
          <h2>Settings</h2>
          <p>Manage your account, users and security activity.</p>
        </div>
      </div>

      <div className="settings-layout">
        <aside className="settings-sidebar">
          <div className="settings-sidebar-title">Settings</div>

          <button
            type="button"
            className={`settings-sidebar-link ${
              activeTab === "profile" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("profile");
              setError("");
              setSuccess("");
            }}
          >
            <span className="settings-sidebar-icon">👤</span>
            <span>Profile</span>
          </button>

          <button
            type="button"
            className={`settings-sidebar-link ${
              activeTab === "password" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("password");
              setError("");
              setSuccess("");
            }}
          >
            <span className="settings-sidebar-icon">🔒</span>
            <span>Change Password</span>
          </button>

          <div className="settings-sidebar-divider" />

          <div className="settings-sidebar-title">
            Administration
          </div>

          <button
            type="button"
            className={`settings-sidebar-link ${
              activeTab === "users" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("users");
              setError("");
              setSuccess("");
            }}
          >
            <span className="settings-sidebar-icon">👥</span>
            <span>User Management</span>
          </button>

          <button
            type="button"
            className={`settings-sidebar-link ${
              activeTab === "activity" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("activity");
              setError("");
              setSuccess("");
            }}
          >
            <span className="settings-sidebar-icon">🕒</span>
            <span>Login Activity</span>
          </button>
        </aside>

        <main className="settings-content">
          {error && (
            <div className="settings-error" role="alert">
              ⚠ {error}
            </div>
          )}

          {success && (
            <div className="settings-success" role="status">
              ✓ {success}
            </div>
          )}

          {activeTab === "profile" && (
            <section className="settings-section">
              <div className="settings-section-header">
                <div>
                  <h3>Profile</h3>
                  <p>Update your administrator profile information.</p>
                </div>
                <div className="settings-section-icon">👤</div>
              </div>

              {profileMessage && (
                <div className="settings-success">
                  ✓ {profileMessage}
                </div>
              )}

              <form
                className="settings-form"
                onSubmit={handleProfileSubmit}
              >
                <div className="settings-form-group">
                  <label htmlFor="settings-name">Name</label>
                  <input
                    id="settings-name"
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleProfileChange}
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="settings-form-group">
                  <label htmlFor="settings-email">Email Address</label>
                  <input
                    id="settings-email"
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                <div className="settings-form-actions">
                  <button
                    type="submit"
                    className="settings-save-btn"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {activeTab === "password" && (
            <section className="settings-section">
              <div className="settings-section-header">
                <div>
                  <h3>Change Password</h3>
                  <p>Update your administrator account password.</p>
                </div>
                <div className="settings-section-icon">🔒</div>
              </div>

              {passwordMessage && (
                <div className="settings-success">
                  ✓ {passwordMessage}
                </div>
              )}

              <form
                className="settings-form"
                onSubmit={handlePasswordSubmit}
              >
                <div className="settings-form-group">
                  <label htmlFor="current-password">
                    Current Password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                    required
                  />
                </div>

                <div className="settings-form-group">
                  <label htmlFor="new-password">New Password</label>
                  <input
                    id="new-password"
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    minLength="8"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="settings-form-group">
                  <label htmlFor="confirm-password">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    minLength="8"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="settings-password-note">
                  Password must contain at least 8 characters.
                </div>

                <div className="settings-form-actions">
                  <button
                    type="submit"
                    className="settings-save-btn"
                    disabled={saving}
                  >
                    {saving ? "Updating..." : "Change Password"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {activeTab === "users" && (
            <section className="settings-section">
              <div className="settings-section-header settings-users-header">
                <div>
                  <h3>User Management</h3>
                  <p>Manage Speed Express user and admin accounts.</p>
                </div>

                <button
                  type="button"
                  className="settings-save-btn"
                  onClick={openAddUser}
                >
                  + Add User
                </button>
              </div>

              <div className="settings-limit-grid">
                <div className="settings-limit-card">
                  <span>Regular Users</span>
                  <strong>
                    {regularUserCount} / {USER_LIMIT}
                  </strong>
                  <div className="settings-limit-track">
                    <span
                      style={{
                        width: `${Math.min(
                          (regularUserCount / USER_LIMIT) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="settings-limit-card">
                  <span>Administrators</span>
                  <strong>
                    {adminCount} / {ADMIN_LIMIT}
                  </strong>
                  <div className="settings-limit-track">
                    <span
                      style={{
                        width: `${Math.min(
                          (adminCount / ADMIN_LIMIT) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {showUserForm && (
                <form
                  className="settings-user-form"
                  onSubmit={handleUserSubmit}
                >
                  <h4>
                    {editingUserId ? "Edit Account" : "Create Account"}
                  </h4>

                  <div className="settings-user-form-grid">
                    <div className="settings-form-group">
                      <label htmlFor="user-name">Full Name</label>
                      <input
                        id="user-name"
                        name="name"
                        value={userForm.name}
                        onChange={handleUserFormChange}
                        placeholder="Enter full name"
                        required
                      />
                    </div>

                    <div className="settings-form-group">
                      <label htmlFor="user-email">Email Address</label>
                      <input
                        id="user-email"
                        type="email"
                        name="email"
                        value={userForm.email}
                        onChange={handleUserFormChange}
                        placeholder="Enter email address"
                        required
                      />
                    </div>

                    <div className="settings-form-group">
                      <label htmlFor="user-role">Account Role</label>
                      <select
                        id="user-role"
                        name="role"
                        value={userForm.role}
                        onChange={handleUserFormChange}
                      >
                        <option value="user">Regular User</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>

                    {!editingUserId && (
                      <div className="settings-form-group">
                        <label htmlFor="user-password">Password</label>
                        <input
                          id="user-password"
                          type="password"
                          name="password"
                          value={userForm.password}
                          onChange={handleUserFormChange}
                          placeholder="Minimum 8 characters"
                          minLength="8"
                          required
                        />
                      </div>
                    )}

                    {editingUserId && (
                      <div className="settings-form-group">
                        <label htmlFor="edit-user-password">
                          New Password (optional)
                        </label>
                        <input
                          id="edit-user-password"
                          type="password"
                          name="password"
                          value={userForm.password}
                          onChange={handleUserFormChange}
                          placeholder="Leave blank to keep current password"
                          minLength="8"
                        />
                      </div>
                    )}
                  </div>

                  <div className="settings-form-actions">
                    <button
                      type="button"
                      className="settings-cancel-btn"
                      onClick={resetUserForm}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="settings-save-btn"
                      disabled={saving}
                    >
                      {saving
                        ? "Saving..."
                        : editingUserId
                          ? "Update Account"
                          : "Create Account"}
                    </button>
                  </div>
                </form>
              )}

              <div className="settings-table-toolbar">
                <input
                  type="search"
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Search name, email or role..."
                  aria-label="Search users"
                />

                <button
                  type="button"
                  className="settings-refresh-btn"
                  onClick={loadUsers}
                  disabled={loadingUsers}
                >
                  ↻ Refresh
                </button>
              </div>

              {loadingUsers ? (
                <div className="settings-empty">Loading users...</div>
              ) : (
                <div className="settings-table-wrap">
                  <table className="settings-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredUsers.map((user) => {
                        const id = user._id || user.id;

                        return (
                          <tr key={id}>
                            <td>{user.name || "—"}</td>
                            <td>{user.email || "—"}</td>
                            <td>
                              <span
                                className={`settings-role-badge ${
                                  getRole(user) === "admin"
                                    ? "admin"
                                    : "user"
                                }`}
                              >
                                {getRole(user)}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`settings-status-badge ${
                                  user.isActive === false
                                    ? "inactive"
                                    : "active"
                                }`}
                              >
                                {user.isActive === false
                                  ? "Inactive"
                                  : "Active"}
                              </span>
                            </td>
                            <td>
                              <div className="settings-row-actions">
                                <button
                                  type="button"
                                  onClick={() => openEditUser(user)}
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className={
                                    user.isActive === false
                                      ? "activate"
                                      : "deactivate"
                                  }
                                  onClick={() => handleToggleUser(user)}
                                >
                                  {user.isActive === false
                                    ? "Activate"
                                    : "Deactivate"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan="5" className="settings-table-empty">
                            No user accounts found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeTab === "activity" && (
            <section className="settings-section">
              <div className="settings-section-header">
                <div>
                  <h3>Login Activity</h3>
                  <p>
                    Review user login and logout activity in India time.
                  </p>
                </div>
                <div className="settings-section-icon">🕒</div>
              </div>

              <div className="settings-activity-summary">
                <div>
                  <span>Total Sessions</span>
                  <strong>{activities.length}</strong>
                </div>

                <div>
                  <span>Active Sessions</span>
                  <strong>
                    {
                      activities.filter(
                        (item) => !item.logoutAt && item.isActive !== false
                      ).length
                    }
                  </strong>
                </div>
              </div>

              <div className="settings-table-toolbar">
                <input
                  type="search"
                  value={activitySearch}
                  onChange={(event) =>
                    setActivitySearch(event.target.value)
                  }
                  placeholder="Search name, email or role..."
                  aria-label="Search login activity"
                />

                <button
                  type="button"
                  className="settings-refresh-btn"
                  onClick={loadActivity}
                  disabled={loadingActivity}
                >
                  ↻ Refresh
                </button>
              </div>

              {loadingActivity ? (
                <div className="settings-empty">
                  Loading login activity...
                </div>
              ) : (
                <div className="settings-table-wrap">
                  <table className="settings-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Login Time</th>
                        <th>Logout Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredActivities.map((activity, index) => {
                        const user = activity.user || {};

                        const loginTime =
                          activity.loginAt ||
                          activity.loginTime ||
                          activity.createdAt;

                        const logoutTime =
                          activity.logoutAt ||
                          activity.logoutTime;

                        const isActive =
                          !logoutTime && activity.isActive !== false;

                        return (
                          <tr
                            key={
                              activity._id ||
                              activity.id ||
                              `${loginTime}-${index}`
                            }
                          >
                            <td>
                              <strong>
                                {activity.name || user.name || "Unknown"}
                              </strong>
                              <small>
                                {activity.email || user.email || "—"}
                              </small>
                            </td>

                            <td>
                              {activity.role || user.role || "user"}
                            </td>

                            <td>{formatDateTime(loginTime)}</td>
                            <td>{formatDateTime(logoutTime)}</td>

                            <td>
                              <span
                                className={`settings-status-badge ${
                                  isActive ? "active" : "inactive"
                                }`}
                              >
                                {isActive ? "Active" : "Logged Out"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredActivities.length === 0 && (
                        <tr>
                          <td colSpan="5" className="settings-table-empty">
                            No login activity found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}