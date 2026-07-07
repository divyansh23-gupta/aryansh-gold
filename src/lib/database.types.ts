import { type Product, type Category } from "@/data/products";
import { type FeaturedCollection } from "@/data/collections";

export type AdminRole = "super_admin" | "admin";
export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";

export interface DbAdminUser {
  user_id: string;
  role: AdminRole;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAdminInvite {
  id: string;
  email: string;
  role: AdminRole;
  token: string;
  status: InviteStatus;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCollection {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbProductCollection {
  id: string;
  product_id: string;
  collection_id: string;
  created_at: string;
  updated_at: string;
}

export type VariantStatus = "active" | "draft" | "archived" | "out_of_stock";

export interface DbProductVariant {
  id: string;
  product_id: string;
  sku: string;
  size: string | null;
  color: string | null;
  price: number;
  compare_price: number | null;
  stock_quantity: number;
  reserved_quantity: number;
  status: VariantStatus;
  created_at: string;
  updated_at: string;
}

export interface DbProduct {
  id: string;
  slug: string;
  name: string;
  category_id: string | null;
  image_url: string;
  is_new: boolean;
  is_best_seller: boolean;
  is_featured: boolean;
  is_trending: boolean;
  description: string | null;
  materials: string | null;
  care: string | null;
  created_at: string;
  updated_at: string;
  categories?: DbCategory | null;
  product_variants?: DbProductVariant[];
  product_images?: DbProductImage[];
  product_collections?: { collections: DbCollection }[];
}

export interface DbProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbWishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  updated_at: string;
  products?: DbProduct;
}

export interface DbCartItem {
  id: string;
  user_id: string;
  variant_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product_variants?: DbProductVariant & { products: DbProduct };
}

// Mapper helpers
export const mapDbCollection = (row: any): FeaturedCollection => ({
  title: row.title,
  subtitle: row.subtitle || "",
  image: row.image_url || "/src/assets/collection-bridal.jpg",
});

export const mapDbProduct = (row: any): Product => {
  const variants = row.product_variants || [];
  const activeVariants = variants.filter((v: any) => v.status === "active");
  
  // Find cheapest active variant
  let cheapestVariant = activeVariants[0];
  for (const v of activeVariants) {
    if (!cheapestVariant || Number(v.price) < Number(cheapestVariant.price)) {
      cheapestVariant = v;
    }
  }

  // Calculate pricing metrics dynamically based on the cheapest active variant
  const price = cheapestVariant ? Number(cheapestVariant.price) : 0;
  const originalPrice = cheapestVariant?.compare_price ? Number(cheapestVariant.compare_price) : undefined;

  // Calculate inventory dynamically across active variants (available = stock - reserved)
  const inStock = activeVariants.length > 0
    ? activeVariants.some((v: any) => (Number(v.stock_quantity) - Number(v.reserved_quantity || 0)) > 0)
    : false;

  // Map variants to front-end interface structure
  const mappedVariants = activeVariants.map((v: any) => ({
    id: v.id,
    productId: v.product_id,
    sku: v.sku,
    size: v.size,
    color: v.color,
    price: Number(v.price),
    comparePrice: v.compare_price ? Number(v.compare_price) : undefined,
    stockQuantity: v.stock_quantity,
    reservedQuantity: v.reserved_quantity,
    status: v.status
  }));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: (row.categories?.name || row.category || "Necklaces") as Category,
    price,
    originalPrice,
    image: row.image_url,
    gallery: row.product_images?.length 
      ? row.product_images.map((img: any) => img.image_url)
      : [row.image_url],
    inStock,
    isNew: row.is_new ?? false,
    isBestSeller: row.is_best_seller ?? false,
    description: row.description || "",
    materials: row.materials || "",
    care: row.care || "",
    variants: mappedVariants
  } as any;
};
