import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      {eyebrow && (
        <div
          className={cn(
            "flex items-center gap-3",
            align === "center" ? "justify-center" : "justify-start",
          )}
        >
          <span className="gold-rule" aria-hidden />
          <p className="eyebrow text-primary">{eyebrow}</p>
          {align === "center" && <span className="gold-rule" aria-hidden />}
        </div>
      )}
      <h2 className="display-serif mt-5 text-[1.9rem] text-foreground sm:text-4xl md:text-[3rem]">
        {title}
      </h2>
      {description && (
        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}
