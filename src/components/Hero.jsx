import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-shape shape-one" />
      <div className="hero-shape shape-two" />

      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">SPEED EXPRESS COURIER SERVICES</span>
          <h1>Fast Delivery.<br /><span>Trusted Service.</span></h1>
          <p>
            Reliable courier, parcel and logistics solutions designed
            to move your shipments safely, quickly and transparently.
          </p>

          <div className="hero-actions">
            <Link className="btn btn-primary" to="/tracking">Track Shipment →</Link>
            <Link className="btn btn-light" to="/services">Explore Services</Link>
          </div>

          <div className="hero-stats">
            <div><strong>4–5</strong><span>Days Surface</span></div>
            <div><strong>1–2</strong><span>Days Air</span></div>
            <div><strong>24/7</strong><span>Support</span></div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="route-card">
            <div className="route-head"><span>Shipment Journey</span><b>LIVE</b></div>
            <div className="route-line">
              <div className="route-point active">✓</div>
              <div className="route-dash" />
              <div className="route-point active">🚚</div>
              <div className="route-dash" />
              <div className="route-point">○</div>
            </div>
            <div className="route-labels">
              <span>Picked Up</span><span>In Transit</span><span>Delivered</span>
            </div>
          </div>

          <div className="truck-art">🚚</div>
          <div className="floating-box box-a">📦 <span>Shipment Picked</span></div>
          <div className="floating-box box-b">📍 <span>Delivery On Route</span></div>
        </div>
      </div>
    </section>
  );
}