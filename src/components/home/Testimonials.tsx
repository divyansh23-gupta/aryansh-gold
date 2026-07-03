import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { testimonials } from "@/data/collections";

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const go = (n: number) => setIndex((n + testimonials.length) % testimonials.length);
  const t = testimonials[index];

  return (
    <section className="bg-foreground py-20 text-background md:py-28">
      <div className="mx-auto max-w-3xl px-5 text-center md:px-8">
        <p className="eyebrow text-primary">Kind Words</p>
        <blockquote key={index} className="mt-8 animate-fade-up font-serif text-2xl leading-relaxed sm:text-3xl">
          &ldquo;{t.quote}&rdquo;
        </blockquote>
        <div className="mt-8">
          <p className="text-sm font-medium">{t.name}</p>
          <p className="mt-1 eyebrow text-background/50">{t.location}</p>
        </div>

        <div className="mt-10 flex items-center justify-center gap-5">
          <button
            aria-label="Previous testimonial"
            onClick={() => go(index - 1)}
            className="grid h-11 w-11 place-items-center border border-background/30 transition-colors hover:bg-background hover:text-foreground"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                aria-label={`Testimonial ${i + 1}`}
                onClick={() => go(i)}
                className={
                  "h-1.5 rounded-full transition-all duration-500 " +
                  (i === index ? "w-6 bg-primary" : "w-1.5 bg-background/40")
                }
              />
            ))}
          </div>
          <button
            aria-label="Next testimonial"
            onClick={() => go(index + 1)}
            className="grid h-11 w-11 place-items-center border border-background/30 transition-colors hover:bg-background hover:text-foreground"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
