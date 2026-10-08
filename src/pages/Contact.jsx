import React, { useState } from "react";
import "./Contact.css";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    number: "",
    email: "",
    message: "",
  });

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!form.number.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    const existingContacts = JSON.parse(
      localStorage.getItem("speedExpressContacts") || "[]"
    );

    const now = new Date();

    const newContact = {
      id: Date.now(),
      name: form.name.trim(),
      number: form.number.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
      contactDate: now.toISOString(),
      createdAt: now.toISOString(),
    };

    localStorage.setItem(
      "speedExpressContacts",
      JSON.stringify([
        newContact,
        ...existingContacts,
      ])
    );

    setForm({
      name: "",
      number: "",
      email: "",
      message: "",
    });

    setSuccess(
      "Thank you! Your message has been submitted successfully. Our team will contact you soon."
    );
  };

  return (
    <div className="contact-page">

      {/* =====================================================
          HERO
          ===================================================== */}
      <section className="contact-hero">

        <div className="contact-hero-overlay"></div>

        <div className="contact-hero-content">

          <div className="contact-hero-badge">
            SPEED EXPRESS
          </div>

          <h1>
            Contact Us
          </h1>

          <p>
            Have a question, delivery requirement, or business
            enquiry? Our team is ready to help you.
          </p>

          <div className="contact-hero-buttons">

            {/* CALL */}
            <a
              href="tel:+919011019656"
              className="contact-hero-btn primary"
              aria-label="Call Speed Express"
            >
              📞 Call Us
            </a>

            {/* WHATSAPP */}
            <a
              href="https://wa.me/919011019656"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-hero-btn secondary"
              aria-label="Chat with Speed Express on WhatsApp"
            >
              💬 WhatsApp
            </a>

          </div>

        </div>

      </section>


      {/* =====================================================
          QUICK CONTACT
          ===================================================== */}
      <section className="contact-quick-section">

        <div className="contact-container">

          {/* =================================================
              PHONE
              ================================================= */}
          <a
            href="tel:+919011019656"
            className="contact-quick-card"
            aria-label="Call Speed Express"
          >

            <div className="contact-quick-icon">
              📞
            </div>

            <div>
              <span>
                Call Us
              </span>

              <h3>
                +91 90110 19656
              </h3>

              <span className="contact-card-link">
                Contact our team →
              </span>
            </div>

          </a>


          {/* =================================================
              EMAIL
              ================================================= */}
          <a
            href="mailto:speedexp2022@gmail.com"
            className="contact-quick-card"
            aria-label="Email Speed Express"
          >

            <div className="contact-quick-icon">
              ✉️
            </div>

            <div>
              <span>
                Email Us
              </span>

              <h3>
                speedexp2022@gmail.com
              </h3>

              <span className="contact-card-link">
                Send an email →
              </span>
            </div>

          </a>


          {/* =================================================
              WHATSAPP
              ================================================= */}
          <a
            href="https://wa.me/919011019656"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-quick-card"
            aria-label="Chat with Speed Express on WhatsApp"
          >

            <div className="contact-quick-icon">
              💬
            </div>

            <div>
              <span>
                WhatsApp
              </span>

              <h3>
                Chat With Us
              </h3>

              <span className="contact-card-link">
                Start conversation →
              </span>
            </div>

          </a>


          {/* =================================================
              LOCATION
              ================================================= */}
          <a
            href="#contact-offices"
            className="contact-quick-card"
            aria-label="View Speed Express offices"
          >

            <div className="contact-quick-icon">
              📍
            </div>

            <div>
              <span>
                Service Area
              </span>

              <h3>
                Pune & Mumbai
              </h3>

              <span className="contact-card-link">
                View our offices →
              </span>
            </div>

          </a>

        </div>

      </section>


      {/* =====================================================
          MAIN CONTACT SECTION
          ===================================================== */}
      <section className="contact-main-section">

        <div className="contact-container contact-main-grid">

          {/* =================================================
              LEFT - GET IN TOUCH
              ================================================= */}
          <div className="contact-information">

            <div className="contact-section-label">
              GET IN TOUCH
            </div>

            <h2>
              Let's Talk About Your
              <span> Delivery Needs</span>
            </h2>

            <p className="contact-information-description">
              Whether you need courier services, business
              deliveries, corporate gifting, or shipment support,
              our team is here to assist you.
            </p>


            {/* =================================================
                CONTACT DETAILS
                ================================================= */}
            <div className="contact-details">

              {/* PHONE */}
              <a
                href="tel:+919011019656"
                className="contact-detail-card"
                aria-label="Call Speed Express"
              >

                <div className="contact-detail-icon">
                  📞
                </div>

                <div className="contact-detail-content">

                  <span>
                    PHONE
                  </span>

                  <h3>
                    +91 90110 19656
                  </h3>

                  <p>
                    Call our support team
                  </p>

                </div>

                <span className="contact-detail-action">
                  →
                </span>

              </a>


              {/* EMAIL */}
              <a
                href="mailto:speedexp2022@gmail.com"
                className="contact-detail-card"
                aria-label="Email Speed Express"
              >

                <div className="contact-detail-icon">
                  ✉️
                </div>

                <div className="contact-detail-content">

                  <span>
                    EMAIL
                  </span>

                  <h3>
                    speedexp2022@gmail.com
                  </h3>

                  <p>
                    Send us your enquiry
                  </p>

                </div>

                <span className="contact-detail-action">
                  →
                </span>

              </a>


              {/* LOCATION */}
              <a
                href="#contact-offices"
                className="contact-detail-card"
                aria-label="View Speed Express offices"
              >

                <div className="contact-detail-icon">
                  📍
                </div>

                <div className="contact-detail-content">

                  <span>
                    LOCATION
                  </span>

                  <h3>
                    Pune, Maharashtra
                  </h3>

                  <p>
                    Serving Pune, Mumbai & more
                  </p>

                </div>

                <span className="contact-detail-action">
                  →
                </span>

              </a>

            </div>


            {/* =================================================
                WHATSAPP
                ================================================= */}
            <a
              href="https://wa.me/919011019656"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-whatsapp-box"
              aria-label="Chat with Speed Express on WhatsApp"
            >

              <div className="contact-whatsapp-icon">
                💬
              </div>

              <div className="contact-whatsapp-content">

                <strong>
                  Chat with us on WhatsApp
                </strong>

                <span>
                  Get quick assistance from our team
                </span>

              </div>

              <span>
                Chat Now →
              </span>

            </a>

          </div>


          {/* =================================================
              RIGHT - CONTACT FORM
              ================================================= */}
          <div className="contact-form-wrapper">

            <div className="contact-form-top">

              <div>

                <div className="contact-form-label">
                  CONTACT FORM
                </div>

                <h2>
                  Send Us a Message
                </h2>

                <p>
                  Fill in the details below and our team will
                  contact you.
                </p>

              </div>

              <a
                href="mailto:speedexp2022@gmail.com"
                className="contact-form-symbol"
                aria-label="Email Speed Express"
              >
                ✉️
              </a>

            </div>


            {/* ERROR */}
            {error && (
              <div className="contact-message contact-message-error">

                <span>
                  ⚠️
                </span>

                <span>
                  {error}
                </span>

              </div>
            )}


            {/* SUCCESS */}
            {success && (
              <div className="contact-message contact-message-success">

                <span>
                  ✓
                </span>

                <span>
                  {success}
                </span>

              </div>
            )}


            {/* FORM */}
            <form
              className="contact-form"
              onSubmit={handleSubmit}
            >

              {/* NAME + PHONE */}
              <div className="contact-form-row">

                {/* NAME */}
                <div className="contact-input-group">

                  <label htmlFor="contact-name">
                    Full Name <span>*</span>
                  </label>

                  <div className="contact-input-box">

                    <span className="contact-input-icon">
                      👤
                    </span>

                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      autoComplete="name"
                      required
                    />

                  </div>

                </div>


                {/* PHONE */}
                <div className="contact-input-group">

                  <label htmlFor="contact-number">
                    Phone Number <span>*</span>
                  </label>

                  <div className="contact-input-box">

                    <span className="contact-input-icon">
                      📱
                    </span>

                    <input
                      id="contact-number"
                      type="tel"
                      name="number"
                      value={form.number}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      autoComplete="tel"
                      required
                    />

                  </div>

                </div>

              </div>


              {/* EMAIL */}
              <div className="contact-input-group">

                <label htmlFor="contact-email">
                  Email Address <span>*</span>
                </label>

                <div className="contact-input-box">

                  <span className="contact-input-icon">
                    ✉️
                  </span>

                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter your email address"
                    autoComplete="email"
                    required
                  />

                </div>

              </div>


              {/* MESSAGE */}
              <div className="contact-input-group">

                <label htmlFor="contact-message">
                  Message
                </label>

                <div className="contact-textarea-box">

                  <span className="contact-input-icon">
                    💬
                  </span>

                  <textarea
                    id="contact-message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help you..."
                    rows="6"
                  ></textarea>

                </div>

              </div>


              {/* SUBMIT */}
              <button
                type="submit"
                className="contact-submit-button"
              >

                <span>
                  Send Message
                </span>

                <span className="contact-submit-arrow">
                  →
                </span>

              </button>


              {/* NOTE */}
              <p className="contact-form-note">
                🔒 Your information is safe with us. We will use
                your details only to respond to your enquiry.
              </p>

            </form>

          </div>

        </div>

      </section>


      {/* =====================================================
          OFFICE LOCATIONS
          ===================================================== */}
      <section
        className="contact-offices-section"
        id="contact-offices"
      >

        <div className="contact-container">

          <div className="contact-office-heading">

            <div className="contact-section-label">
              OUR LOCATIONS
            </div>

            <h2>
              Visit Our <span>Offices</span>
            </h2>

            <p>
              Connect with Speed Express at one of our office
              locations.
            </p>

          </div>


          <div className="contact-office-grid">

            {/* OFFICE 1 */}
            <div className="contact-office-card">

              <div className="contact-office-top">

                <div className="contact-office-icon">
                  📍
                </div>

                <span className="contact-office-number">
                  01
                </span>

              </div>

              <span className="contact-office-tag">
                PUNE
              </span>

              <h3>
                Hinjawadi / Pirangut Office
              </h3>

              <p>
                Hinjawadi-Pirangut Road,
                Ghotawada Phata,
                Pirangut, Kasar Amboli,
                Maharashtra – 412115
              </p>

              <a
                href="https://www.google.com/maps/search/?api=1&query=Hinjawadi+Pirangut+Road+Ghotawada+Phata+Pirangut+Maharashtra+412115"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-map-link"
              >
                View on Map →
              </a>

            </div>


            {/* OFFICE 2 */}
            <div className="contact-office-card">

              <div className="contact-office-top">

                <div className="contact-office-icon">
                  📍
                </div>

                <span className="contact-office-number">
                  02
                </span>

              </div>

              <span className="contact-office-tag">
                PUNE
              </span>

              <h3>
                Pune Office
              </h3>

              <p>
                Century Arcade,
                Narangi Baug Road,
                Vrindavan Park Society,
                Sangamvadi,
                Pune, Maharashtra – 411001
              </p>

              <a
                href="https://www.google.com/maps/search/?api=1&query=Century+Arcade+Narangi+Baug+Road+Sangamvadi+Pune+411001"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-map-link"
              >
                View on Map →
              </a>

            </div>


            {/* OFFICE 3 */}
            <div className="contact-office-card">

              <div className="contact-office-top">

                <div className="contact-office-icon">
                  📍
                </div>

                <span className="contact-office-number">
                  03
                </span>

              </div>

              <span className="contact-office-tag">
                PUNE
              </span>

              <h3>
                Somwar Peth Office
              </h3>

              <p>
                Shop No. 14,
                Sadguru Park Co-Op Housing Society,
                Somwar Peth,
                Pune, Maharashtra – 411011
              </p>

              <a
                href="https://www.google.com/maps/search/?api=1&query=Sadguru+Park+Co-Op+Housing+Society+Somwar+Peth+Pune+411011"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-map-link"
              >
                View on Map →
              </a>

            </div>


            {/* OFFICE 4 */}
            <div className="contact-office-card">

              <div className="contact-office-top">

                <div className="contact-office-icon">
                  📍
                </div>

                <span className="contact-office-number">
                  04
                </span>

              </div>

              <span className="contact-office-tag">
                MUMBAI
              </span>

              <h3>
                Malad East Office
              </h3>

              <p>
                Speed Express, Express Zone,
                Office No. G173,
                Near Dindoshi Metro Station,
                Malad East, Mumbai,
                Maharashtra – 400097
              </p>

              <a
                href="https://www.google.com/maps/search/?api=1&query=Express+Zone+G173+Malad+East+Mumbai+400097"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-map-link"
              >
                View on Map →
              </a>

            </div>


            {/* OFFICE 5 */}
            <div className="contact-office-card">

              <div className="contact-office-top">

                <div className="contact-office-icon">
                  📍
                </div>

                <span className="contact-office-number">
                  05
                </span>

              </div>

              <span className="contact-office-tag">
                THANE
              </span>

              <h3>
                Thane West Office
              </h3>

              <p>
                Ground Floor, Shop,
                Cine Wonder Shopping Complex,
                75, Ghodbunder Road,
                Near Orion Business Park,
                Kailash Nagar, Thane West,
                Maharashtra – 400607
              </p>

              <a
                href="https://www.google.com/maps/search/?api=1&query=Cine+Wonder+Shopping+Complex+75+Ghodbunder+Road+Thane+West+400607"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-map-link"
              >
                View on Map →
              </a>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          BOTTOM CTA
          ===================================================== */}
      <section className="contact-bottom-cta">

        <div className="contact-container contact-bottom-content">

          <div>

            <span className="contact-bottom-small">
              SPEED EXPRESS
            </span>

            <h2>
              Ready to Move Your Business Forward?
            </h2>

            <p>
              Talk to our team today for your courier and
              logistics requirements.
            </p>

          </div>


          <div className="contact-bottom-buttons">

            {/* CALL */}
            <a
              href="tel:+919011019656"
              className="contact-bottom-call"
              aria-label="Call Speed Express"
            >
              📞 Call +91 90110 19656
            </a>

            {/* WHATSAPP */}
            <a
              href="https://wa.me/919011019656"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-bottom-whatsapp"
              aria-label="Chat with Speed Express on WhatsApp"
            >
              💬 WhatsApp Us
            </a>

          </div>

        </div>

      </section>

    </div>
  );
}