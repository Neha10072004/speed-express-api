const stats = [
  ["12K+", "Shipments Managed"],
  ["98%", "Delivery Visibility"],
  ["250+", "Business Clients"],
  ["50+", "Delivery Locations"],
];

export default function Analytics() {
  return (
    <section className="section analytics">
      <div className="container">
        <div className="section-heading left">
          <span className="eyebrow blue">LOGISTICS ANALYTICS</span>

          <h2>
            Data That Helps You <span>Deliver Better.</span>
          </h2>

          <p>
            Useful shipment information for better operational visibility.
          </p>
        </div>

        <div className="stats-grid">
          {stats.map(([number, label]) => (
            <div className="stat-card" key={label}>
              <strong>{number}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="dashboard">
          <div className="dashboard-head">
            <div>
              <small>Shipment Overview</small>
              <h3>Delivery Performance</h3>
            </div>

            <span>LIVE DATA</span>
          </div>

          <div className="bars">
            {[45, 62, 55, 78, 68, 88, 74, 94].map((height, index) => (
              <i
                key={index}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}