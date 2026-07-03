import bridal from "@/assets/collection-bridal.jpg";
import necklaces from "@/assets/collection-necklaces.jpg";
import rings from "@/assets/collection-rings.jpg";

export interface FeaturedCollection {
  title: string;
  subtitle: string;
  image: string;
}

export const featuredCollections: FeaturedCollection[] = [
  { title: "Bridal Collection", subtitle: "For the day you'll never forget", image: bridal },
  { title: "Necklaces & Sets", subtitle: "Statement pieces, softly refined", image: necklaces },
  { title: "Rings & Earrings", subtitle: "The finishing touch", image: rings },
];

export interface CategoryItem {
  name: string;
  image: string;
}

export const popularCategories: CategoryItem[] = [
  { name: "Necklaces", image: necklaces },
  { name: "Earrings", image: rings },
  { name: "Rings", image: rings },
  { name: "Bracelets", image: necklaces },
  { name: "Jewellery Sets", image: bridal },
  { name: "Bridal Collection", image: bridal },
];

export interface Testimonial {
  quote: string;
  name: string;
  location: string;
}

export const testimonials: Testimonial[] = [
  {
    quote:
      "The craftsmanship is extraordinary. Every piece feels intentional, elegant and effortlessly luxurious.",
    name: "Ananya Mehta",
    location: "Mumbai",
  },
  {
    quote:
      "I wore my Aryansh set to my sister's wedding and received compliments all night. Truly timeless.",
    name: "Ishita Rao",
    location: "Bengaluru",
  },
  {
    quote:
      "Luxury that feels personal. The detailing rivals fine jewellery at a fraction of the price.",
    name: "Priya Sharma",
    location: "Delhi",
  },
];

export const navLinks = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Collections", to: "/collections" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
] as const;
