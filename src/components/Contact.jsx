import { useState } from "react";

export default function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <section className="section light-section">
      <div className="container contact-grid">
        <div>
          <span className="eyebrow blue">GET IN TOUCH</span>
          <h2>Let's Talk About <span>Your Delivery.</span></h2>
          <p className="muted">Tell us what you need and our team can help with your courier requirements.</p>

          <div className="contact-details">
            <div>📍 <span><b>Office</b><small>Pune, Maharashtra, India</small></span></div>
            <div>📞 <span><b>Phone</b><small>+91 84460 51800</small></span></div>
            <div>✉️ <span><b>Email</b><small>speedexp2022@gmail.com</small></span></div>
          </div>
        </div>

        <div className="form-card">
          {sent ? (
            <div className="success">
              <div>✓</div><h3>Thank You!</h3><p>Your enquiry has been submitted.</p>
              <button className="btn btn-primary" onClick={() => setSent(false)}>Send Another Enquiry</button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
              <div className="form-two">
                <label>Name<input required placeholder="Your Name" /></label>
                <label>Phone<input required type="tel" placeholder="Phone Number" /></label>
              </div>
              <label>Email<input required type="email" placeholder="Email Address" /></label>
              <label>Service
                <select defaultValue="">
                  <option value="" disabled>Select Service</option>
                  <option>Surface Parcel</option>
                  <option>Air Express</option>
                  <option>Priority Shipment</option>
                  <option>Corporate Logistics</option>
                  <option>Corporate Gifting</option>
                </select>
              </label>
              <label>Message<textarea rows="5" placeholder="Tell us about your requirement" /></label>
              <button className="btn btn-primary full">Submit Enquiry →</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}