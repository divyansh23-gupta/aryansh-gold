import { useState } from "react";
import { Reveal } from "@/components/ui-custom/Reveal";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setDone(true);
    setEmail("");
  };

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
      <Reveal className="mx-auto max-w-2xl bg-cream px-6 py-16 text-center md:px-12">
        <p className="eyebrow text-primary">Newsletter</p>
        <h2 className="mt-4 font-serif text-3xl text-foreground sm:text-4xl">
          Join The Aryansh Gold Community
        </h2>
        <p className="mt-4 text-sm text-muted-foreground">
          Be the first to discover new collections, private events and members-only offers.
        </p>
        <form onSubmit={submit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full border border-border bg-background px-5 py-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
          <button
            type="submit"
            className="shrink-0 bg-foreground px-8 py-3.5 eyebrow text-background transition-colors hover:bg-primary"
          >
            Subscribe
          </button>
        </form>
        {done && (
          <p className="mt-4 text-sm text-primary">
            Thank you — welcome to Aryansh Gold.
          </p>
        )}
      </Reveal>
    </section>
  );
}
