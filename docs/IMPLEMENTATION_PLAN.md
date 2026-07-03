# Aryansh Gold — Implementation Plan

**Tagline:** Luxury Redefined
**Type:** Luxury artificial jewellery e-commerce (frontend only)

## 1. Design Language

Minimal luxury / editorial / high-end fashion. Large whitespace, clean layouts,
tasteful animation only. No glassmorphism, no neon, no heavy gradients, no bright
gold backgrounds, no clutter.

### Typography
- Headings: **Playfair Display** (serif) — loaded via Google Fonts `<link>` in `__root.tsx`
- Body: **Inter** (sans)

### Color palette (defined as oklch tokens in `src/styles.css`)
| Token | Hex | Role |
|-------|-----|------|
| Ivory White | #FAF8F5 | `--background` |
| Soft Cream | #F5F1EA | `--secondary` / `--muted` surfaces |
| Champagne Gold | #C8A97E | `--primary` accent |
| Charcoal Black | #1F1F1F | `--foreground` |
| Muted Gray | #6B6B6B | `--muted-foreground` |

All colors live in the design system; components never hardcode hex/`text-white`.

## 2. Technology

React + TypeScript + Tailwind CSS v4. Routing uses the project's native
**TanStack Router** (file-based) instead of React Router DOM — same SPA behaviour,
type-safe routes. Frontend only; no backend wired yet.

## 3. Folder Structure

```
src/
  assets/                 generated editorial imagery (hero, banners, products)
  data/
    products.ts           product catalog + categories
    collections.ts        collection + testimonial + nav data
  components/
    layout/
      AnnouncementBar.tsx
      Navbar.tsx          fixed; transparent over hero, solid on scroll
      Footer.tsx
    ui-custom/
      SectionHeading.tsx  reusable eyebrow + serif heading
      ProductCard.tsx     image, name, category, price, wishlist, add to bag
      Reveal.tsx          fade-in-on-scroll wrapper (IntersectionObserver)
    home/
      Hero.tsx                    Section 1  — 3-slide auto slider
      FeaturedCollections.tsx     Section 2  — 3 editorial cards
      PopularCategories.tsx       Section 3  — circular category cards
      TrendingCollection.tsx      Section 4  — product carousel
      TopStyles.tsx               Section 5  — filterable product grid
      BrandStoryVideo.tsx         Section 6  — cinematic video band
      FeaturedBanners.tsx         Section 7  — 2 editorial banners
      VisitStore.tsx              Section 8  — two-column showroom
      WhyUs.tsx                   Section 9  — 4 feature cards
      Testimonials.tsx            Section 10 — testimonial carousel
      Newsletter.tsx              Section 11 — email capture
  routes/
    __root.tsx            fonts, meta, Navbar + Footer shell
    index.tsx             homepage (composes all sections)
    shop.tsx / collections.tsx / about.tsx / contact.tsx   supporting pages
    sitemap[.]xml.ts
```

## 4. Component Architecture

- **Reusable primitives:** `SectionHeading`, `ProductCard`, `Reveal`.
- **Layout shell:** `AnnouncementBar` + `Navbar` + `Footer` live in `__root.tsx`
  so every route shares them. Navbar detects `/` to render transparent-over-hero.
- **Data-driven:** products, categories, collections, testimonials come from
  `src/data/*` so sections stay presentational and scalable.

## 5. Animation

IntersectionObserver-based fade/slide-in (`Reveal`), image zoom on hover, smooth
color transitions on navbar, hover micro-interactions on cards. Nothing excessive.

## 6. Responsiveness

Mobile-first. Grids collapse to 1–2 columns, navbar becomes a slide-in drawer,
carousels remain swipeable. Verified across mobile / tablet / desktop.

## 7. Build order
1. Design tokens + fonts → 2. layout shell → 3. reusable primitives + data →
4. homepage sections → 5. supporting routes → 6. QA & polish.
