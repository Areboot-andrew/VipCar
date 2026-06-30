'use client';

type Car = {
  id: string;
  make: string;
  model: string;
  year: number;
  baseRate: number;
};

export default function CarGallery({ cars }: { cars: Car[] }) {
  return (
    <section id="gallery" className="gallery-section">
      <div className="container">
        <h2 className="headline-lg text-center" style={{ marginBottom: '64px' }}>Наш Автопарк</h2>
        
        {cars.length === 0 ? (
          <p className="text-center" style={{ color: 'var(--text-secondary)' }}>Наразі автопарк оновлюється...</p>
        ) : (
          <div className="gallery-grid">
            {cars.map(car => (
              <div key={car.id} className="car-card">
                <div className="car-card-image-placeholder">
                  {/* Here goes the image/video */}
                  <span style={{ opacity: 0.5 }}>Зображення авто</span>
                </div>
                <div className="car-card-content">
                  <h3 className="headline-md">{car.make} {car.model}</h3>
                  <p className="label-caps">{car.year} • Від ${car.baseRate}/км</p>
                  <button className="btn-secondary" style={{ width: '100%', marginTop: '24px' }}>
                    Забронювати
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
