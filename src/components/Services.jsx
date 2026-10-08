import { Link } from "react-router-dom";

const services = [
  ["📦", "Surface Parcel", "Reliable road transportation for regular shipments.", "4–5 Days"],
  ["✈️", "Air Express", "Fast transportation for urgent and time-sensitive deliveries.", "1–2 Days"],
  ["⚡", "Priority Shipment", "Priority handling for important and urgent shipments.", "Priority"],
  ["🏢", "Corporate Logistics", "Business-focused pickup, delivery and logistics support.", "Business"],
  ["🎁", "Corporate Gifting", "Employee and customer gifting with multi-city delivery.", "Gifting"],
  ["📊", "Delivery Analytics", "Shipment reports and useful delivery visibility.", "Analytics"]
];

export default function Services() {
  return (
    <section className="section light-section">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow blue">OUR SERVICES</span>
          <h2>Complete Courier & <span>Logistics Solutions</span></h2>
          <p>Choose the service that matches your delivery requirement.</p>
        </div>

        <div className="service-grid">
          {services.map(([icon, title, text, tag]) => (
            <article className="service-card" key={title}>
              <div className="service-icon">{icon}</div>
              <span className="service-tag">{tag}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              <Link to="/contact">Know More →</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}