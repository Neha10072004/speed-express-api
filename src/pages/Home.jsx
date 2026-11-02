
import Hero from "../components/Hero";
import Services from "../components/Services";
import WhySpeedExpress from "../components/WhySpeedExpress";
import Tracking from "../components/Tracking";
import CorporateGifting from "../components/CorporateGifting";
import Analytics from "../components/Analytics";
import Contact from "../components/Contact";

export default function Home() {
  const diwaliBanner = `${import.meta.env.BASE_URL}diwali-speed-express.png`;

  return (
    <>
      {/* Diwali Promotional Banner */}
      <section className="diwali-banner">
        <img
  src={diwaliBanner}
  alt="Speed Express Diwali special offer"
  className="diwali-banner-image"
/>
      </section>

      <Hero />
      <Services />
      <WhySpeedExpress />
      <Tracking />
      <CorporateGifting />
      <Analytics />
      <Contact />
    </>
  );
}
