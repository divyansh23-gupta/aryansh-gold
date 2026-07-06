import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { products, type Product } from "@/data/products";

export interface CartLine {
  id: string;
  quantity: number;
}

interface StoreState {
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
}

const StoreContext = createContext<StoreState | null>(null);

const KEY = "aryansh_store_v1";

function loadPersisted(): {
  cart: CartLine[];
  wishlist: string[];
  recentlyViewed: string[];
} {
  if (typeof window === "undefined")
    return { cart: [], wishlist: [], recentlyViewed: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
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
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const p = loadPersisted();
    setCart(p.cart);
    setWishlist(p.wishlist);
    setRecentlyViewed(p.recentlyViewed);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ cart, wishlist, recentlyViewed }),
    );
  }, [cart, wishlist, recentlyViewed, hydrated]);

  const addToCart = (id: string, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.id === id);
      if (existing)
        return prev.map((l) =>
          l.id === id ? { ...l, quantity: l.quantity + quantity } : l,
        );
      return [...prev, { id, quantity }];
    });
    setCartOpen(true);
  };

  const setQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((l) => l.id !== id));
      return;
    }
    setCart((prev) => prev.map((l) => (l.id === id ? { ...l, quantity } : l)));
  };

  const removeFromCart = (id: string) =>
    setCart((prev) => prev.filter((l) => l.id !== id));

  const clearCart = () => setCart([]);

  const toggleWishlist = (id: string) =>
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev],
    );

  const removeFromWishlist = (id: string) =>
    setWishlist((prev) => prev.filter((x) => x !== id));

  const isWished = (id: string) => wishlist.includes(id);

  const markViewed = (id: string) =>
    setRecentlyViewed((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 8));

  const priceOf = (id: string) => products.find((p) => p.id === id)?.price ?? 0;

  const cartCount = useMemo(
    () => cart.reduce((sum, l) => sum + l.quantity, 0),
    [cart],
  );
  const cartSubtotal = useMemo(
    () => cart.reduce((sum, l) => sum + priceOf(l.id) * l.quantity, 0),
    [cart],
  );

  const value: StoreState = {
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
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export const cartLineProduct = (line: CartLine): Product | undefined =>
  products.find((p) => p.id === line.id);
