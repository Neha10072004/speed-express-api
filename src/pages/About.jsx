export default function About() {
  return (
    <div className="about-page">

      {/* ================= HERO ================= */}
      <section className="about-hero">
        <div className="container about-hero-content">

          <span className="eyebrow">
            ABOUT SPEED EXPRESS
          </span>

          <h1>
            Moving Business <span>Forward.</span>
          </h1>

          <p>
            Speed Express provides practical courier, logistics and
            business delivery solutions designed around speed,
            visibility and reliability.
          </p>

        </div>
      </section>


      {/* ================= ABOUT COMPANY ================= */}
      <section className="about-main">

        <div className="container about-main-grid">

          <div className="about-main-visual">

            <div className="about-floating-card">
              <strong>Speed Express</strong>
              <span>Courier & Logistics</span>
            </div>

            <img
  src={`${import.meta.env.BASE_URL}speed-express-logo.png`}
  alt="Speed Express"
/>

            <div className="about-truck-icon">
              🚚
            </div>

          </div>


          <div className="about-main-content">

            <span className="eyebrow blue">
              WHO WE ARE
            </span>

            <h2>
              A Logistics Partner
              <span> Built Around You.</span>
            </h2>

            <p>
              Speed Express focuses on making business logistics
              simpler, faster and more transparent.
            </p>

            <p>
              From pickup to final delivery, our goal is to connect
              businesses with practical courier and transportation
              solutions.
            </p>

            <div className="about-points">

              <div className="about-point">
                <strong>01</strong>
                <span>Technology</span>
              </div>

              <div className="about-point">
                <strong>02</strong>
                <span>Reliability</span>
              </div>

              <div className="about-point">
                <strong>03</strong>
                <span>Customer Focus</span>
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ================= MISSION / VISION / VALUES ================= */}
      <section className="about-values">

        <div className="container">

          <div className="section-heading">

            <span className="eyebrow blue">
              WHAT DRIVES US
            </span>

            <h2>
              Built For Better
              <span> Business Delivery.</span>
            </h2>

            <p>
              Our approach combines service, technology and
              customer-focused logistics.
            </p>

          </div>


          <div className="about-values-grid">

            <div className="about-value-card">

              <div className="about-value-icon">
                🎯
              </div>

              <h3>
                Our Mission
              </h3>

              <p>
                To simplify courier and logistics operations
                through dependable and customer-focused services.
              </p>

            </div>


            <div className="about-value-card">

              <div className="about-value-icon">
                🚀
              </div>

              <h3>
                Our Vision
              </h3>

              <p>
                To build a connected logistics experience that
                helps businesses move shipments efficiently.
              </p>

            </div>


            <div className="about-value-card">

              <div className="about-value-icon">
                🤝
              </div>

              <h3>
                Our Values
              </h3>

              <p>
                Reliability, transparency, technology and
                customer satisfaction are central to our approach.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* ================= OFFICES ================= */}
      <section className="offices-section">

        <div className="container">

          <div className="offices-heading">

            <span className="eyebrow">
              OUR LOCATIONS
            </span>

            <h2>
              Our <span>Offices</span>
            </h2>

            <p>
              Connect with Speed Express through our office
              locations across Pune, Mumbai and Thane.
            </p>

          </div>


          <div className="office-grid">


            {/* ================= OFFICE 01 ================= */}
            <div className="office-card">

              <div className="office-number">
                01
              </div>

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
                href="https://www.google.com/maps/search/?api=1&query=Hinjawadi-Pirangut+Road+Ghotawada+Phata+Pirangut+Maharashtra+412115"
                target="_blank"
                rel="noreferrer"
              >
                📍 View Location →
              </a>

            </div>


            {/* ================= OFFICE 02 ================= */}
            <div className="office-card">

              <div className="office-number">
                02
              </div>

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
                rel="noreferrer"
              >
                📍 View Location →
              </a>

            </div>


            {/* ================= OFFICE 03 ================= */}
            <div className="office-card">

              <div className="office-number">
                03
              </div>

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
                href="https://www.google.com/maps/search/?api=1&query=Shop+No+14+Sadguru+Park+Co+Op+Housing+Society+Somwar+Peth+Pune+411011"
                target="_blank"
                rel="noreferrer"
              >
                📍 View Location →
              </a>

            </div>


            {/* ================= OFFICE 04 ================= */}
            <div className="office-card">

              <div className="office-number">
                04
              </div>

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
                href="https://www.google.com/maps/search/?api=1&query=Speed+Express+Express+Zone+Office+No+G173+Near+Dindoshi+Metro+Station+Malad+East+Mumbai+Maharashtra+400097"
                target="_blank"
                rel="noreferrer"
              >
                📍 View Location →
              </a>

            </div>


            {/* ================= OFFICE 05 ================= */}
            <div className="office-card">

              <div className="office-number">
                05
              </div>

              <h3>
                Thane West Office
              </h3>

              <p>
                Ground Floor, Shop,
                Cine Wonder Shopping Complex,
                75, Ghodbunder Road,
                Near Orion Business Park,
                Kailash Nagar,
                Thane West, Thane,
                Maharashtra – 400607
              </p>

              <a
                href="https://www.google.com/maps/search/?api=1&query=Cine+Wonder+Shopping+Complex+75+Ghodbunder+Road+Near+Orion+Business+Park+Kailash+Nagar+Thane+West+Thane+Maharashtra+400607"
                target="_blank"
                rel="noreferrer"
              >
                📍 View Location →
              </a>

            </div>


          </div>

        </div>

      </section>


      {/* ================= MAP ================= */}
      <section className="about-map-section">

        <div className="container">

          <div className="section-heading">

            <span className="eyebrow blue">
              FIND US
            </span>

            <h2>
              Speed Express
              <span> Locations</span>
            </h2>

            <p>
              Find our five office locations across Pune,
              Mumbai and Thane and connect with our team.
            </p>

          </div>


          <div className="about-map-container">

            <iframe
              title="Speed Express Locations"
              src="https://www.google.com/maps?q=Pune,Maharashtra,India&output=embed"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>


            <div className="map-overlay-card">

              <h3>
                📍 Speed Express
              </h3>

              <p>
                Five office locations across Pune, Mumbai
                and Thane for convenient courier and
                logistics support.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* ================= CTA ================= */}
      <section className="about-cta">

        <div className="container about-cta-content">

          <h2>
            Ready to Move Your
            <span> Business Forward?</span>
          </h2>

          <p>
            Talk to Speed Express about your courier,
            logistics and business delivery requirements.
          </p>

          <a
            href="/contact"
            className="btn"
          >
            Get In Touch →
          </a>

        </div>

      </section>

    </div>
  );
}