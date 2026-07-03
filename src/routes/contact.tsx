import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Clock, Phone, Mail } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Aryansh Gold" },
      { name: "description", content: "Get in touch with Aryansh Gold — visit our showroom or reach our team." },
      { property: "og:title", content: "Contact — Aryansh Gold" },
      { property: "og:description", content: "Get in touch with the Aryansh Gold team." },
    ],
  }),
  component: ContactPage,
});

const details = [
  { icon: MapPin, label: "Showroom", value: "12 Marine Drive, Mumbai 400020" },
  { icon: Clock, label: "Hours", value: "Mon – Sun · 10:00 AM – 9:00 PM" },
  { icon: Phone, label: "Phone", value: "+91 98765 43210" },
  { icon: Mail, label: "Email", value: "hello@aryanshgold.com" },
];

function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="pt-28 md:pt-32">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <p className="eyebrow text-primary">Get In Touch</p>
        <h1 className="mt-4 font-serif text-4xl text-foreground sm:text-5xl">Contact Us</h1>
        <div className="mt-12 grid gap-12 md:grid-cols-2 lg:gap-20">
          <div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Questions about an order, a styling appointment, or a bespoke request?
              Our team would love to help.
            </p>
            <ul className="mt-10 space-y-6">
              {details.map((d) => (
                <li key={d.label} className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cream text-primary">
                    <d.icon size={18} strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className="eyebrow text-muted-foreground">{d.label}</p>
                    <p className="mt-1 text-sm text-foreground">{d.value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="space-y-4"
          >
            <input
              required
              placeholder="Your name"
              className="w-full border border-border bg-background px-5 py-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
            <input
              required
              type="email"
              placeholder="Your email"
              className="w-full border border-border bg-background px-5 py-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
            <textarea
              required
              rows={5}
              placeholder="Your message"
              className="w-full resize-none border border-border bg-background px-5 py-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
            <button
              type="submit"
              className="bg-foreground px-8 py-3.5 eyebrow text-background transition-colors hover:bg-primary"
            >
              Send Message
            </button>
            {sent && <p className="text-sm text-primary">Thank you — we'll be in touch shortly.</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
