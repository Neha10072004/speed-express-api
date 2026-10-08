import { Link } from "react-router-dom";

export default function CorporateGifting() {
  return (
    <section className="section light-section">
      <div className="container gift-grid">
        <div>
          <span className="eyebrow blue">CORPORATE GIFTING</span>
          <h2>One Platform for <span>Corporate Delivery.</span></h2>
          <p className="muted">
            Manage employee and customer gifting, fulfillment and
            multi-city delivery through one coordinated process.
          </p>

          <div className="check-list">
            <div>✓ Employee gifting programs</div>
            <div>✓ Performance-based rewards</div>
            <div>✓ Multi-office delivery</div>
            <div>✓ Personalized thank-you notes</div>
          </div>

          <Link className="btn btn-primary" to="/contact">Start Corporate Gifting →</Link>
        </div>

        <div className="gift-visual">
          <div className="gift-emoji">🎁</div>
          <div className="gift-card">
            <strong>Corporate Celebration</strong>
            <p>Delivered with care.</p>
            <div className="city-pills">
              <span>Delhi</span><span>Mumbai</span><span>Pune</span><span>Bangalore</span><span>Hyderabad</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}