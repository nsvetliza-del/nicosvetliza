import React from 'react'
export default function BrandLogoStrip({ brands }) {
  return (
    <section className="brand-strip">
      <p className="section-label">Selected brands</p>
      <div className="brand-strip-track">
        {brands.map((brand, index) => (
          <div key={brand} className="brand-pill">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{brand}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
