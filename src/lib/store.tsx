import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { products as staticProducts, categories as staticCategories, type Product, type Category } from "@/data/products";
import { featuredCollections as staticCollections, popularCategories as staticPopularCategories, type FeaturedCollection, type CategoryItem } from "@/data/collections";
import { mapDbProduct, mapDbCollection } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export interface CartLine {
  id: string;
  quantity: number;
}

interface StoreState {
  products: Product[];
  categories: string[];
  collections: FeaturedCollection[];
  popularCategories: CategoryItem[];
  catalogLoading: boolean;
  cart: CartLine[];
  wishlist: string[];
  recentlyViewed: string[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (id: string, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  toggleWishlist: (id: string) => void;
  isWished: (id: string) => boolean;
  removeFromWishlist: (id: string) => void;
  markViewed: (id: string) => void;
  cartCount: number;
  cartSubtotal: number;
  refreshCatalog: () => Promise<void>;
}

const StoreContext = createContext<StoreState | null>(null);

const GUEST_KEY = "aryansh_guest_store_v2";

function loadPersisted(): {
  cart: CartLine[];
  wishlist: string[];
  recentlyViewed: string[];
} {
  if (typeof window === "undefined")
    return { cart: [], wishlist: [], recentlyViewed: [] };
  try {
    const raw = window.localStorage.getItem(GUEST_KEY);
    if (!raw) return { cart: [], wishlist: [], recentlyViewed: [] };
    const parsed = JSON.parse(raw);
    return {
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      wishlist: Array.isArray(parsed.wishlist) ? parsed.wishlist : [],
      recentlyViewed: Array.isArray(parsed.recentlyViewed)
        ? parsed.recentlyViewed
        : [],
    };
  } catch {
    return { cart: [], wishlist: [], recentlyViewed: [] };
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [collectionsList, setCollectionsList] = useState<FeaturedCollection[]>([]);
  const [popularCategoriesList, setPopularCategoriesList] = useState<CategoryItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const refreshCatalog = async () => {
    try {
      const { data: catData, error: catError } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });
        
      const { data: collData, error: collError } = await supabase
        .from("collections")
        .select("*")
        .order("title", { ascending: true });

      const { data: prodData, error: prodError } = await supabase
        .from("products")
        .select("*, categories(name), product_images(image_url), product_variants(*)")
        .order("created_at", { ascending: false });

      if (prodError || catError || collError) {
        throw prodError || catError || collError;
      }

      if (catData && catData.length > 0) {
        setCategoriesList(catData.map((c) => c.name));
        setPopularCategoriesList(catData.map((c) => ({
          name: c.name,
          image: c.image_url || "/src/assets/collection-necklaces.jpg"
        })));
      } else {
        setCategoriesList(staticCategories);
        setPopularCategoriesList(staticPopularCategories);
      }

      if (collData && collData.length > 0) {
        setCollectionsList(collData.map(mapDbCollection));
      } else {
        setCollectionsList(staticCollections);
      }

      if (prodData && prodData.length > 0) {
        setProductsList(prodData.map(mapDbProduct));
      } else {
        setProductsList(staticProducts);
      }
    } catch (err) {
      console.warn("Failed to fetch catalog from Supabase, using static fallback:", err);
      setProductsList(staticProducts);
      setCategoriesList(staticCategories);
      setCollectionsList(staticCollections);
      setPopularCategoriesList(staticPopularCategories);
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    refreshCatalog();
  }, []);

  useEffect(() => {
    // Initial mount hydration
    const rawGuest = window.localStorage.getItem(GUEST_KEY);
    if (rawGuest) {
      try {
        const parsed = JSON.parse(rawGuest);
        setCart(Array.isArray(parsed.cart) ? parsed.cart : []);
        setWishlist(Array.isArray(parsed.wishlist) ? parsed.wishlist : []);
        setRecentlyViewed(Array.isArray(parsed.recentlyViewed) ? parsed.recentlyViewed : []);
      } catch {
        // no-op
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      window.localStorage.setItem(
        GUEST_KEY,
        JSON.stringify({ cart, wishlist, recentlyViewed }),
      );
    } else {
      window.localStorage.setItem(
        `aryansh_user_store_${user.id}`,
        JSON.stringify({ cart, wishlist, recentlyViewed }),
      );
    }
  }, [cart, wishlist, recentlyViewed, hydrated, user]);

  useEffect(() => {
    if (!hydrated) return;

    const syncDb = async () => {
      if (user) {
        // Fetch DB wishlist
        let dbWishIds: string[] = [];
        try {
          const { data: dbWish, error: dbWishErr } = await supabase
            .from("wishlists")
            .select("product_id")
            .eq("user_id", user.id);
          if (!dbWishErr && dbWish) {
            dbWishIds = dbWish.map((w) => w.product_id);
          }
        } catch (e) {
          console.error("Error fetching wishlist:", e);
        }

        // Fetch DB cart
        let dbCartLines: CartLine[] = [];
        try {
          const { data: dbCart, error: dbCartErr } = await supabase
            .from("cart_items")
            .select("variant_id, quantity")
            .eq("user_id", user.id);
          if (!dbCartErr && dbCart) {
            dbCartLines = dbCart.map((item) => ({ id: item.variant_id, quantity: item.quantity }));
          }
        } catch (e) {
          console.error("Error fetching cart:", e);
        }

        // Check if there is guest data in localStorage to merge
        const rawGuest = window.localStorage.getItem(GUEST_KEY);
        if (rawGuest) {
          try {
            const guest = JSON.parse(rawGuest);
            const guestCart = Array.isArray(guest.cart) ? guest.cart : [];
            const guestWish = Array.isArray(guest.wishlist) ? guest.wishlist : [];

            // A. Merge Wishlist
            const mergedWishlist = Array.from(new Set([...guestWish, ...dbWishIds]));
            const wishToInsert = guestWish.filter((id) => !dbWishIds.includes(id));
            if (wishToInsert.length > 0) {
              await supabase.from("wishlists").insert(
                wishToInsert.map((id) => ({ user_id: user.id, product_id: id }))
              );
            }
            setWishlist(mergedWishlist);

            // B. Merge Cart
            const mergedCart = [...dbCartLines];
            for (const guestItem of guestCart) {
              const existingIndex = mergedCart.findIndex((item) => item.id === guestItem.id);
              if (existingIndex > -1) {
                mergedCart[existingIndex].quantity = mergedCart[existingIndex].quantity + guestItem.quantity;
                await supabase.from("cart_items")
                  .update({ quantity: mergedCart[existingIndex].quantity })
                  .eq("user_id", user.id)
                  .eq("variant_id", guestItem.id);
              } else {
                mergedCart.push(guestItem);
                await supabase.from("cart_items").insert({
                  user_id: user.id,
                  variant_id: guestItem.id,
                  quantity: guestItem.quantity
                });
              }
            }
            setCart(mergedCart);

            // C. Delete guest store key after merge is completed
            window.localStorage.removeItem(GUEST_KEY);
          } catch (err) {
            console.error("Failed to merge guest session:", err);
            setCart(dbCartLines);
            setWishlist(dbWishIds);
          }
        } else {
          // No guest data to merge, just load from DB directly
          setCart(dbCartLines);
          setWishlist(dbWishIds);
        }
      } else {
        // Logged out: Load from GUEST_KEY
        const rawGuest = window.localStorage.getItem(GUEST_KEY);
        if (rawGuest) {
          try {
            const parsed = JSON.parse(rawGuest);
            setCart(Array.isArray(parsed.cart) ? parsed.cart : []);
            setWishlist(Array.isArray(parsed.wishlist) ? parsed.wishlist : []);
          } catch {
            setCart([]);
            setWishlist([]);
          }
        } else {
          setCart([]);
          setWishlist([]);
        }
      }
    };

    syncDb();
  }, [user, hydrated]);

  const addToCart = async (id: string, quantity = 1) => {
    let variantId = id;
    const matchedProduct = productsList.find((p) => p.id === id);
    if (matchedProduct) {
      const firstVariant = matchedProduct.variants?.[0];
      if (firstVariant) {
        variantId = firstVariant.id;
      }
    }

    setCart((prev) => {
      const existing = prev.find((l) => l.id === variantId);
      if (existing)
        return prev.map((l) =>
          l.id === variantId ? { ...l, quantity: l.quantity + quantity } : l,
        );
      return [...prev, { id: variantId, quantity }];
    });
    setCartOpen(true);

    if (user) {
      try {
        const { data: existing } = await supabase
          .from("cart_items")
          .select("id, quantity")
          .eq("user_id", user.id)
          .eq("variant_id", variantId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("cart_items")
            .update({ quantity: existing.quantity + quantity })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("cart_items")
            .insert({ user_id: user.id, variant_id: variantId, quantity });
        }
      } catch (err) {
        console.error("Failed to update cart in DB:", err);
      }
    }
  };

  const setQuantity = async (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((l) => l.id !== id));
    } else {
      setCart((prev) => prev.map((l) => (l.id === id ? { ...l, quantity } : l)));
    }

    if (user) {
      try {
        if (quantity <= 0) {
          await supabase
            .from("cart_items")
            .delete()
            .eq("user_id", user.id)
            .eq("variant_id", id);
        } else {
          await supabase
            .from("cart_items")
            .upsert({ user_id: user.id, variant_id: id, quantity }, { onConflict: "user_id,variant_id" });
        }
      } catch (err) {
        console.error("Failed to update quantity in DB:", err);
      }
    }
  };

  const removeFromCart = async (id: string) => {
    setCart((prev) => prev.filter((l) => l.id !== id));

    if (user) {
      try {
        await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", user.id)
          .eq("variant_id", id);
      } catch (err) {
        console.error("Failed to remove item from DB cart:", err);
      }
    }
  };

  const clearCart = async () => {
    setCart([]);

    if (user) {
      try {
        await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", user.id);
      } catch (err) {
        console.error("Failed to clear DB cart:", err);
      }
    }
  };

  const toggleWishlist = async (id: string) => {
    let added = false;
    setWishlist((prev) => {
      if (prev.includes(id)) {
        added = false;
        return prev.filter((x) => x !== id);
      } else {
        added = true;
        return [id, ...prev];
      }
    });

    if (user) {
      try {
        if (added) {
          await supabase
            .from("wishlists")
            .insert({ user_id: user.id, product_id: id });
        } else {
          await supabase
            .from("wishlists")
            .delete()
            .eq("user_id", user.id)
            .eq("product_id", id);
        }
      } catch (err) {
        console.error("Failed to toggle DB wishlist:", err);
      }
    }
  };

  const removeFromWishlist = async (id: string) => {
    setWishlist((prev) => prev.filter((x) => x !== id));

    if (user) {
      try {
        await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", id);
      } catch (err) {
        console.error("Failed to remove item from DB wishlist:", err);
      }
    }
  };

  const isWished = (id: string) => wishlist.includes(id);

  const markViewed = (id: string) =>
    setRecentlyViewed((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 8));

  const priceOf = (variantId: string) => {
    const prod = productsList.find((p) => p.variants?.some((v: any) => v.id === variantId));
    if (prod) {
      const variant = prod.variants?.find((v: any) => v.id === variantId);
      return variant ? variant.price : prod.price;
    }
    return productsList.find((p) => p.id === variantId)?.price ?? 0;
  };

  const cartCount = useMemo(
    () => cart.reduce((sum, l) => sum + l.quantity, 0),
    [cart],
  );
  
  const cartSubtotal = useMemo(
    () => cart.reduce((sum, l) => sum + priceOf(l.id) * l.quantity, 0),
    [cart, productsList],
  );

  const value: StoreState = {
    products: productsList,
    categories: categoriesList,
    collections: collectionsList,
    popularCategories: popularCategoriesList,
    catalogLoading,
    cart,
    wishlist,
    recentlyViewed,
    cartOpen,
    setCartOpen,
    addToCart,
    setQuantity,
    removeFromCart,
    clearCart,
    toggleWishlist,
    isWished,
    removeFromWishlist,
    markViewed,
    cartCount,
    cartSubtotal,
    refreshCatalog,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export const cartLineProduct = (line: CartLine, products: Product[]): Product | undefined => {
  return products.find((p) => p.id === line.id || p.variants?.some((v: any) => v.id === line.id));
};
