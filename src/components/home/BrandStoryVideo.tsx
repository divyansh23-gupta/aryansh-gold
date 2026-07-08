import { useEffect, useRef } from "react";
import { Play } from "lucide-react";
import videoPoster from "@/assets/video-poster.jpg";

export function BrandStoryVideo() {
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      imgRef.current.classList.add("is-loaded");
    }
  }, []);

  return (
    <section 
      className="relative h-[88vh] min-h-[560px] w-full overflow-hidden"
      style={{ backgroundColor: "var(--charcoal)" }}
    >
      <img
        ref={imgRef}
        src={videoPoster}
        alt="Aryansh Gold craftsmanship"
        loading="lazy"
        width={1920}
        height={1080}
        className="h-full w-full scale-105 object-cover opacity-0 transition-opacity duration-700 [&.is-loaded]:opacity-100"
        onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
      />
      <div 
        className="absolute inset-0" 
        style={{ backgroundColor: "rgba(28, 28, 28, 0.65)" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "var(--gradient-overlay)" }}
      />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-background">
        <div className="flex items-center gap-3">
          <span className="gold-rule" aria-hidden />
          <p className="eyebrow text-primary-foreground/90">The Aryansh Story</p>
          <span className="gold-rule" aria-hidden />
        </div>
        <h2 className="display-serif mt-8 max-w-3xl text-4xl text-background sm:text-6xl md:text-[4.25rem]">
          Luxury is not worn.
          <br />
          <span className="italic text-primary">It is experienced.</span>
        </h2>
        <p className="mt-7 max-w-md text-sm font-light leading-relaxed text-background/85 sm:text-base">
          Every piece is designed to make the everyday feel extraordinary —
          affordable luxury, crafted for the modern woman.
        </p>
        <button className="group mt-11 flex items-center gap-5">
          <span className="grid h-16 w-16 place-items-center rounded-full border border-background/50 transition-all duration-300 group-hover:scale-105 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
            <Play size={18} className="ml-0.5 fill-current" />
          </span>
          <span className="eyebrow">Watch The Film</span>
        </button>
      </div>
    </section>
  );
}
