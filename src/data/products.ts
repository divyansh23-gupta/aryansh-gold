import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";

export type Category =
  | "Necklaces"
  | "Earrings"
  | "Rings"
  | "Bracelets"
  | "Jewellery Sets"
  | "Bridal";

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  size: string | null;
  color: string | null;
  price: number;
  comparePrice?: number;
  stockQuantity: number;
  reservedQuantity: number;
  status: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: Category;
  price: number;
  originalPrice?: number;
  image: string;
  gallery: string[];
  inStock: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  description: string;
  materials: string;
  care: string;
  variants?: ProductVariant[];
  collections?: { id: string; title: string }[];
}


const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
export const formatPrice = inr;

export const discountPercent = (p: Product) =>
  p.originalPrice && p.originalPrice > p.price
    ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
    : 0;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const DESC =
  "A refined statement of quiet luxury. Hand-finished with a warm champagne-gold tone and a lustrous, jeweller-grade finish that catches the light with every movement — designed to elevate both everyday elegance and occasion dressing.";
const MATERIALS =
  "Hypoallergenic brass base with 18k champagne-gold micron plating. Set with premium hand-cut cubic zirconia and AAA crystal stones. Nickel-free and skin-safe.";
const CARE =
  "Store in the provided pouch away from moisture and direct sunlight. Wipe gently with a soft dry cloth. Avoid contact with perfume, water and lotions to preserve the plating.";

interface Seed {
  name: string;
  category: Category;
  price: number;
  originalPrice?: number;
  image: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  inStock?: boolean;
}

const seeds: Seed[] = [
  { name: "Astra Solitaire Necklace", category: "Necklaces", price: 2499, originalPrice: 3299, image: product1, isBestSeller: true },
  { name: "Lumière Drop Earrings", category: "Earrings", price: 1499, originalPrice: 1999, image: product2, isBestSeller: true },
  { name: "Éclat Solitaire Ring", category: "Rings", price: 1899, image: product3, isNew: true },
  { name: "Seraphine Diamond Bangle", category: "Bracelets", price: 2199, originalPrice: 2899, image: product4 },
  { name: "Aurelia Bridal Set", category: "Jewellery Sets", price: 4999, originalPrice: 6499, image: product5, isBestSeller: true },
  { name: "Celeste Pendant", category: "Necklaces", price: 1799, image: product6, isNew: true },
  { name: "Noor Chandelier Earrings", category: "Earrings", price: 2099, originalPrice: 2699, image: product2 },
  { name: "Vivienne Stacking Ring", category: "Rings", price: 1299, image: product3 },
  { name: "Amara Tennis Bracelet", category: "Bracelets", price: 2799, originalPrice: 3499, image: product4, isBestSeller: true },
  { name: "Isadora Bridal Necklace", category: "Bridal", price: 5499, originalPrice: 6999, image: product1, isNew: true },
  { name: "Selene Statement Set", category: "Jewellery Sets", price: 3899, image: product5 },
  { name: "Odette Halo Ring", category: "Bridal", price: 3299, originalPrice: 3999, image: product6 },
  { name: "Mira Pearl Drops", category: "Earrings", price: 1699, image: product2, isNew: true },
  { name: "Aria Layered Necklace", category: "Necklaces", price: 2299, originalPrice: 2899, image: product6 },
  { name: "Elara Cuff Bracelet", category: "Bracelets", price: 1999, image: product4, inStock: false },
  { name: "Rosalind Cocktail Ring", category: "Rings", price: 1599, originalPrice: 2099, image: product3, isBestSeller: true },
];

export const products: Product[] = seeds.map((s, i) => ({
  id: `p${i + 1}`,
  slug: slugify(s.name),
  name: s.name,
  category: s.category,
  price: s.price,
  originalPrice: s.originalPrice,
  image: s.image,
  gallery: [s.image, product1, product3, product5].filter(
    (v, idx, arr) => arr.indexOf(v) === idx,
  ),
  inStock: s.inStock ?? true,
  isNew: s.isNew,
  isBestSeller: s.isBestSeller,
  description: DESC,
  materials: MATERIALS,
  care: CARE,
}));

export const getProductBySlug = (slug: string) =>
  products.find((p) => p.slug === slug);

export const relatedProducts = (product: Product, count = 4) =>
  products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .concat(products.filter((p) => p.id !== product.id && p.category !== product.category))
    .slice(0, count);

export const trendingProducts = products.slice(0, 8);

export const topStyleFilters = [
  "All",
  "Necklaces",
  "Earrings",
  "Rings",
  "Bracelets",
  "Jewellery Sets",
  "Bridal",
] as const;

export type TopStyleFilter = (typeof topStyleFilters)[number];

export const categories: Category[] = [
  "Necklaces",
  "Earrings",
  "Rings",
  "Bracelets",
  "Jewellery Sets",
  "Bridal",
];
