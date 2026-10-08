const reasons = [
  ["⚡", "Faster Movement", "Efficient courier operations help reduce unnecessary delays."],
  ["📍", "Shipment Visibility", "Track important shipment milestones with better clarity."],
  ["🤝", "Customer Support", "A responsive team for your courier and business requirements."],
  ["📊", "Smart Reporting", "Use delivery information to understand and improve operations."]
];

export default function WhySpeedExpress() {
  return (
    <section className="section">
      <div className="container why-grid">
        <div className="blue-panel">
          <div className="panel-logo">
            <img
  src={`${import.meta.env.BASE_URL}speed-express-logo.png`}
  alt="Speed Express"
/>
          </div>
          <div className="big-truck">🚚</div>
          <h3>One Platform.<br />Multiple Delivery Solutions.</h3>
          <div className="mini-route">📍 ───────── 🚚 ───────── 📍</div>
        </div>

        <div>
          <span className="eyebrow blue">WHY SPEED EXPRESS</span>
          <h2>More Than Delivery.<br /><span>A Complete Logistics Partner.</span></h2>
          <p className="muted">
            Speed Express combines courier expertise, technology and
            customer-focused service to simplify business deliveries.
          </p>

          <div className="reason-grid">
            {reasons.map(([icon, title, text]) => (
              <div className="reason" key={title}>
                <div className="reason-icon">{icon}</div>
                <div><h3>{title}</h3><p>{text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}