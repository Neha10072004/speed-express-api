import React, { useEffect, useState } from "react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");

  const [profile, setProfile] = useState({
    name: "Administrator",
    email: "anushkaspeedexpress@gmail.com",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const savedSettings = JSON.parse(
      localStorage.getItem("speedExpressSettings") || "null"
    );

    const adminData = JSON.parse(
      localStorage.getItem("speedExpressAdmin") || "null"
    );

    if (savedSettings) {
      setProfile({
        name: savedSettings.name || "Administrator",
        email:
          savedSettings.email ||
          adminData?.email ||
          "anushkaspeedexpress@gmail.com",
      });
    } else if (adminData) {
      setProfile({
        name: adminData.name || "Administrator",
        email:
          adminData.email || "anushkaspeedexpress@gmail.com",
      });
    }
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));

    setProfileMessage("");
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setPasswordMessage("");
    setPasswordError("");
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();

    const settings = {
      name: profile.name.trim() || "Administrator",
      email: profile.email.trim(),
      emailNotifications: true,
      orderNotifications: true,
      compactTable: false,
    };

    localStorage.setItem(
      "speedExpressSettings",
      JSON.stringify(settings)
    );

    const adminData = JSON.parse(
      localStorage.getItem("speedExpressAdmin") || "{}"
    );

    const updatedAdmin = {
      ...adminData,
      name: settings.name,
      email: settings.email,
    };

    localStorage.setItem(
      "speedExpressAdmin",
      JSON.stringify(updatedAdmin)
    );

    setProfileMessage("Profile updated successfully.");
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (!passwordForm.currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (!passwordForm.newPassword) {
      setPasswordError("Please enter a new password.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError(
        "New password must contain at least 6 characters."
      );
      return;
    }

    if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      setPasswordError(
        "New password and confirm password do not match."
      );
      return;
    }

    /*
      Demo/localStorage authentication.
      Current default admin password:
      qwerty1234
    */

    const savedPassword =
      localStorage.getItem("speedExpressAdminPassword") ||
      "qwerty1234";

    if (passwordForm.currentPassword !== savedPassword) {
      setPasswordError("Current password is incorrect.");
      return;
    }

    localStorage.setItem(
      "speedExpressAdminPassword",
      passwordForm.newPassword
    );

    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setPasswordMessage(
      "Password changed successfully."
    );
  };

  return (
    <div className="settings-page">

      {/* BREADCRUMB */}
      <div className="settings-breadcrumb">
        <span>Home</span>
        <span>/</span>
        <strong>Settings</strong>
      </div>

      {/* HEADER */}
      <div className="settings-page-header">
        <div>
          <h2>Settings</h2>
          <p>Manage your account settings</p>
        </div>
      </div>

      {/* SETTINGS LAYOUT */}
      <div className="settings-layout">

        {/* SIDEBAR */}
        <aside className="settings-sidebar">

          <div className="settings-sidebar-title">
            Settings
          </div>

          <button
            type="button"
            className={`settings-sidebar-link ${
              activeTab === "profile" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("profile");
              setProfileMessage("");
            }}
          >
            <span className="settings-sidebar-icon">
              👤
            </span>

            <span>Profile</span>
          </button>

          <button
            type="button"
            className={`settings-sidebar-link ${
              activeTab === "password" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("password");
              setPasswordMessage("");
              setPasswordError("");
            }}
          >
            <span className="settings-sidebar-icon">
              🔒
            </span>

            <span>Change Password</span>
          </button>

        </aside>


        {/* CONTENT */}
        <main className="settings-content">

          {/* PROFILE */}
          {activeTab === "profile" && (
            <section className="settings-section">

              <div className="settings-section-header">
                <div>
                  <h3>Profile</h3>
                  <p>
                    Update your administrator profile information.
                  </p>
                </div>

                <div className="settings-section-icon">
                  👤
                </div>
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

                  <label htmlFor="settings-name">
                    Name
                  </label>

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

                  <label htmlFor="settings-email">
                    Email Address
                  </label>

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
                  >
                    Save Changes
                  </button>

                </div>

              </form>

            </section>
          )}


          {/* CHANGE PASSWORD */}
          {activeTab === "password" && (
            <section className="settings-section">

              <div className="settings-section-header">
                <div>
                  <h3>Change Password</h3>
                  <p>
                    Change your administrator account password.
                  </p>
                </div>

                <div className="settings-section-icon">
                  🔒
                </div>
              </div>


              {passwordError && (
                <div className="settings-error">
                  ⚠ {passwordError}
                </div>
              )}


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
                    required
                  />

                </div>


                <div className="settings-form-group">

                  <label htmlFor="new-password">
                    New Password
                  </label>

                  <input
                    id="new-password"
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    minLength="6"
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
                    minLength="6"
                    required
                  />

                </div>


                <div className="settings-password-note">
                  Password must contain at least 6 characters.
                </div>


                <div className="settings-form-actions">

                  <button
                    type="submit"
                    className="settings-save-btn"
                  >
                    Change Password
                  </button>

                </div>

              </form>

            </section>
          )}

        </main>

      </div>

    </div>
  );
}