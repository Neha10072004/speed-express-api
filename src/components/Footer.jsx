import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <img
  src={`${import.meta.env.BASE_URL}speed-express-logo.png`}
  alt="Speed Express"
/>
          <p>Fast, reliable and technology-driven courier and logistics solutions.</p>
        </div>

        <div>
          <h4>Company</h4>
          <Link to="/about">About Us</Link>
          <Link to="/services">Services</Link>
          <Link to="/contact">Contact</Link>
        </div>

        <div>
          <h4>Services</h4>
          <Link to="/services">Surface Parcel</Link>
          <Link to="/services">Air Express</Link>
          <Link to="/corporate-gifting">Corporate Gifting</Link>
        </div>

        <div>
          <h4>Support</h4>
          <Link to="/tracking">Track Shipment</Link>
          <Link to="/contact">Business Enquiry</Link>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Speed Express. All rights reserved.</span>
        <span>Fast • Reliable • Connected</span>
      </div>
    </footer>
  );
}