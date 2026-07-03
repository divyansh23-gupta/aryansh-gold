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

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  image: string;
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
export const formatPrice = inr;

export const products: Product[] = [
  { id: "p1", name: "Astra Solitaire Necklace", category: "Necklaces", price: 2499, image: product1 },
  { id: "p2", name: "Lumière Drop Earrings", category: "Earrings", price: 1499, image: product2 },
  { id: "p3", name: "Éclat Solitaire Ring", category: "Rings", price: 1899, image: product3 },
  { id: "p4", name: "Seraphine Diamond Bangle", category: "Bracelets", price: 2199, image: product4 },
  { id: "p5", name: "Aurelia Bridal Set", category: "Jewellery Sets", price: 4999, image: product5 },
  { id: "p6", name: "Celeste Pendant", category: "Necklaces", price: 1799, image: product6 },
  { id: "p7", name: "Noor Chandelier Earrings", category: "Earrings", price: 2099, image: product2 },
  { id: "p8", name: "Vivienne Stacking Ring", category: "Rings", price: 1299, image: product3 },
  { id: "p9", name: "Amara Tennis Bracelet", category: "Bracelets", price: 2799, image: product4 },
  { id: "p10", name: "Isadora Bridal Necklace", category: "Bridal", price: 5499, image: product1 },
  { id: "p11", name: "Selene Statement Set", category: "Jewellery Sets", price: 3899, image: product5 },
  { id: "p12", name: "Odette Halo Ring", category: "Bridal", price: 3299, image: product6 },
];

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
