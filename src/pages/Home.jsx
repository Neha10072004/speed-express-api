
import Hero from "../components/Hero";
import Services from "../components/Services";
import WhySpeedExpress from "../components/WhySpeedExpress";
import Tracking from "../components/Tracking";
import CorporateGifting from "../components/CorporateGifting";
import Analytics from "../components/Analytics";
import Contact from "../components/Contact";
import "./Home.css";

export default function Home() {
  const diwaliBanner = `${import.meta.env.BASE_URL}diwali-speed-express.png`;

  return (
    <>
      {/* Diwali Promotional Banner */}
<section className="diwali-banner">
  <img
    src="/diwali-speed-express.png"
    alt="Speed Express Diwali Special Offer"
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
