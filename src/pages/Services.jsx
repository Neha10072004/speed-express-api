import ServicesComponent from "../components/Services";

export default function Services() {
  return <>
    <PageBanner title="Our Services" text="Courier and logistics solutions designed around your business." />
    <ServicesComponent />
  </>;
}

function PageBanner({ title, text }) {
  return <section className="page-banner">
    <div className="container">
      <span>SPEED EXPRESS</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  </section>;
}