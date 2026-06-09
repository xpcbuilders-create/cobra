import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { BannerSlide } from '../api';

export function HomeBanner({ banners }: { banners: BannerSlide[] }) {
  const slides = banners.filter((b) => b.imageUrl.trim());
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center bg-gradient-to-r from-indigo-600 to-violet-700 text-white sm:h-64 md:h-80">
        <p className="text-sm opacity-90">Add banner images in Admin → Store &amp; banners</p>
      </div>
    );
  }

  const slide = slides[index];
  const inner = (
    <img
      src={slide.imageUrl}
      alt=""
      className="h-full w-full object-cover"
    />
  );

  return (
    <section className="relative w-full overflow-hidden bg-slate-900">
      <div className="relative aspect-[21/9] max-h-[420px] w-full sm:aspect-[2.5/1]">
        {slide.link ? (
          slide.link.startsWith('http') ? (
            <a href={slide.link} className="block h-full w-full">
              {inner}
            </a>
          ) : (
            <Link to={slide.link} className="block h-full w-full">
              {inner}
            </Link>
          )
        ) : (
          inner
        )}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-3 py-2 text-white hover:bg-black/60 sm:left-4"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-3 py-2 text-white hover:bg-black/60 sm:right-4"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 w-2 rounded-full transition ${
                  i === index ? 'bg-white' : 'bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
