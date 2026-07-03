import { Play } from "lucide-react";
import videoPoster from "@/assets/video-poster.jpg";

export function BrandStoryVideo() {
  return (
    <section className="relative h-[80vh] min-h-[480px] w-full overflow-hidden">
      <img
        src={videoPoster}
        alt="Aryansh Gold craftsmanship"
        loading="lazy"
        width={1920}
        height={1080}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-charcoal/55" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-background">
        <p className="eyebrow text-primary">Aryansh Gold</p>
        <h2 className="mt-6 max-w-2xl font-serif text-3xl leading-tight sm:text-5xl">
          Luxury is not worn.
          <br />
          It is experienced.
        </h2>
        <button className="group mt-10 flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-full border border-background/60 transition-colors group-hover:bg-background group-hover:text-foreground">
            <Play size={20} className="ml-1 fill-current" />
          </span>
          <span className="eyebrow">Watch Story</span>
        </button>
      </div>
    </section>
  );
}
