import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function AdminContact() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);

  const loadContacts = () => {
    try {
      const savedContacts = JSON.parse(
        localStorage.getItem("speedExpressContacts") || "[]"
      );

      setContacts(
        Array.isArray(savedContacts)
          ? savedContacts
          : []
      );
    } catch (error) {
      console.error(
        "Unable to load contact records:",
        error
      );

      setContacts([]);
    }
  };

  useEffect(() => {
    loadContacts();

    const handleStorageChange = () => {
      loadContacts();
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, []);

  const filteredContacts = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    if (!keyword) {
      return contacts;
    }

    return contacts.filter((contact) => {
      return [
        contact.name,
        contact.number,
        contact.email,
        contact.message,
        contact.contactDate,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [contacts, search]);

  const formatDate = (date) => {
    if (!date) return "";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return date;
    }

    const day = d.getDate();

    const month = d.toLocaleString("en-US", {
      month: "short",
    });

    const year = d.getFullYear();

    return `${day}${getOrdinal(day)} ${month} ${year}`;
  };

  const getOrdinal = (day) => {
    if (day > 10 && day < 20) {
      return "th";
    }

    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const handleDelete = (id) => {
    const contact = contacts.find(
      (item) => item.id === id
    );

    if (!contact) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the contact record for "${contact.name}"?`
    );

    if (!confirmed) return;

    const updatedContacts = contacts.filter(
      (item) => item.id !== id
    );

    setContacts(updatedContacts);

    localStorage.setItem(
      "speedExpressContacts",
      JSON.stringify(updatedContacts)
    );

    if (
      selectedContact &&
      selectedContact.id === id
    ) {
      setSelectedContact(null);
    }
  };

  return (
    <div className="contact-records-page">

      {/* Breadcrumb */}
      <div className="contact-records-breadcrumb">

        <Link to="/admin-dashboard/home">
          Home
        </Link>

        <span>/</span>

        <strong>Contact Records</strong>

      </div>

      {/* Heading */}
      <div className="contact-records-header">

        <h2>Contact Records</h2>

      </div>

      {/* Search */}
      <div className="contact-records-search">

        <label htmlFor="contactSearch">
          Search:
        </label>

        <input
          id="contactSearch"
          type="text"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search contact records..."
        />

      </div>

      {/* Table */}
      <div className="contact-records-table-wrapper">

        <table className="contact-records-table">

          <thead>
            <tr>
              <th>Sr.No.</th>
              <th>Name</th>
              <th>Number</th>
              <th>Email-id</th>
              <th>Contact Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {filteredContacts.length > 0 ? (
              filteredContacts.map(
                (contact, index) => (
                  <tr key={contact.id || index}>

                    <td>
                      {index + 1}
                    </td>

                    <td>
                      <strong>
                        {contact.name || "-"}
                      </strong>
                    </td>

                    <td>
                      {contact.number || "-"}
                    </td>

                    <td>
                      {contact.email || "-"}
                    </td>

                    <td>
                      {formatDate(
                        contact.contactDate
                      )}
                    </td>

                    <td>

                      <div className="contact-record-actions">

                        <button
                          type="button"
                          className="contact-view-btn"
                          onClick={() =>
                            setSelectedContact(
                              contact
                            )
                          }
                        >
                          View
                        </button>

                        <button
                          type="button"
                          className="contact-delete-btn"
                          onClick={() =>
                            handleDelete(
                              contact.id
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>
                )
              )
            ) : (
              <tr>

                <td
                  colSpan="6"
                  className="contact-records-empty"
                >
                  No contact records found.
                </td>

              </tr>
            )}

          </tbody>

        </table>

      </div>

      {/* View Contact Modal */}
      {selectedContact && (
        <div
          className="contact-modal-overlay"
          onClick={() =>
            setSelectedContact(null)
          }
        >

          <div
            className="contact-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="contact-modal-header">

              <h3>
                Contact Details
              </h3>

              <button
                type="button"
                onClick={() =>
                  setSelectedContact(null)
                }
              >
                ×
              </button>

            </div>

            <div className="contact-modal-body">

              <div className="contact-detail">
                <span>Name</span>
                <strong>
                  {selectedContact.name || "-"}
                </strong>
              </div>

              <div className="contact-detail">
                <span>Number</span>
                <strong>
                  {selectedContact.number || "-"}
                </strong>
              </div>

              <div className="contact-detail">
                <span>Email-id</span>
                <strong>
                  {selectedContact.email || "-"}
                </strong>
              </div>

              <div className="contact-detail">
                <span>Contact Date</span>
                <strong>
                  {formatDate(
                    selectedContact.contactDate
                  )}
                </strong>
              </div>

              <div className="contact-message">
                <span>Message</span>

                <p>
                  {selectedContact.message ||
                    "No message provided."}
                </p>
              </div>

            </div>

            <div className="contact-modal-footer">

              <button
                type="button"
                onClick={() =>
                  setSelectedContact(null)
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}