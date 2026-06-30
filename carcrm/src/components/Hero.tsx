import Link from 'next/link';

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="container">
        <h1 className="display-lg">The First Class of the Road</h1>
        <p className="body-lg hero-subtitle">
          Ексклюзивні міжміські та міжнародні трансфери для тих, хто цінує час та бездоганний сервіс.
        </p>
        <div className="hero-actions">
          <Link href="#calculator" className="btn-primary">
            Розрахувати вартість
          </Link>
          <Link href="#gallery" className="btn-secondary">
            Переглянути автопарк
          </Link>
        </div>
      </div>
    </section>
  );
}
