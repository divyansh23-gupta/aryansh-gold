import { useState, useEffect, useMemo } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/lib/store";
import { formatPrice, type Product } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Reveal } from "@/components/ui-custom/Reveal";
import { 
  User, 
  ShoppingBag, 
  MapPin, 
  Heart, 
  LogOut, 
  Loader2, 
  Plus, 
  Trash, 
  Edit3,
  Calendar,
  Package,
  Truck
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/account")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => {
    return {
      tab: search.tab as string | undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "My Account — Aryansh Gold" },
      { name: "description", content: "Manage your Aryansh Gold account profile, orders, and addresses." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  isDefault: boolean;
}


function AccountPage() {
  const { user, profile, logout, updateProfile, loading: authLoading } = useAuth();
  const { products, wishlist, removeFromWishlist, addToCart } = useStore();
  const navigate = useNavigate({ from: "/account" });

  // Navigation Guard: Redirect to login if not authenticated
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user && !authLoading) {
        toast.info("Please log in to access your account dashboard.");
        navigate({ to: "/login" });
      }
    }, 1500); // Small grace period for auth initialization

    return () => clearTimeout(timer);
  }, [user, authLoading, navigate]);

  // Tab State
  const { tab } = Route.useSearch();
  const activeTab = tab || "profile";
  const setActiveTab = (newTab: string) => {
    navigate({ search: { tab: newTab } });
  };


  // Orders state & fetch
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrdersLoading(false);
      return;
    }

    const fetchUserOrders = async () => {
      setOrdersLoading(true);
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data) {
          const mappedOrders = data.map((o: any) => ({
            id: o.order_number,
            rawId: o.id,
            date: new Date(o.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            status: o.status.charAt(0).toUpperCase() + o.status.slice(1),
            total: Number(o.total_amount),
            items: o.order_items.map((item: any) => {
              const p = products.find((prod) => prod.id === item.product_id);
              return {
                name: item.product_name_snapshot,
                qty: item.quantity,
                price: Number(item.unit_price),
                image: p?.image || "/src/assets/showroom.jpg",
              };
            }),
          }));
          setOrders(mappedOrders);
        }
      } catch (err) {
        console.error("Error fetching customer orders:", err);
        toast.error("Failed to load your order history.");
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchUserOrders();
  }, [user, products]);

  // Profile Form States
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Address Book States
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  
  // Address Form Inputs
  const [addrName, setAddrName] = useState("");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrZip, setAddrZip] = useState("");
  const [addrPhone, setAddrPhone] = useState("");

  // Sync profile details
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  // Load addresses from local storage (keyed by user id for privacy/persistence)
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`aryansh_addresses_${user.id}`);
      if (saved) {
        try {
          setAddresses(JSON.parse(saved));
        } catch (e) {
          console.error("Error loading addresses", e);
        }
      } else {
        // Seed default sample address
        const seed: Address[] = [
          {
            id: "1",
            name: profile?.full_name || "Jane Doe",
            street: "123 Royale Boulevard, Suite 400",
            city: "Mumbai",
            state: "Maharashtra",
            zip: "400001",
            phone: profile?.phone || "+91 98765 43210",
            isDefault: true
          }
        ];
        setAddresses(seed);
        localStorage.setItem(`aryansh_addresses_${user.id}`, JSON.stringify(seed));
      }
    }
  }, [user, profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) {
      toast.error("Full Name is required.");
      return;
    }

    setUpdatingProfile(true);
    await updateProfile({
      full_name: fullName,
      phone: phone || null
    });
    setUpdatingProfile(false);
  };

  // Address Actions
  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrName || !addrStreet || !addrCity || !addrState || !addrZip || !addrPhone) {
      toast.error("All address fields are required.");
      return;
    }

    let updatedList = [...addresses];

    if (editingAddressId) {
      // Edit mode
      updatedList = updatedList.map((addr) =>
        addr.id === editingAddressId
          ? {
              ...addr,
              name: addrName,
              street: addrStreet,
              city: addrCity,
              state: addrState,
              zip: addrZip,
              phone: addrPhone,
            }
          : addr
      );
      toast.success("Address updated successfully.");
    } else {
      // Add mode
      const newAddr: Address = {
        id: Date.now().toString(),
        name: addrName,
        street: addrStreet,
        city: addrCity,
        state: addrState,
        zip: addrZip,
        phone: addrPhone,
        isDefault: addresses.length === 0, // Default if first address
      };
      updatedList.push(newAddr);
      toast.success("Address saved successfully.");
    }

    setAddresses(updatedList);
    localStorage.setItem(`aryansh_addresses_${user!.id}`, JSON.stringify(updatedList));
    resetAddressForm();
  };

  const handleDeleteAddress = (id: string) => {
    const updatedList = addresses.filter((addr) => addr.id !== id);
    // If we deleted the default, set default to the first remaining one
    if (addresses.find((addr) => addr.id === id)?.isDefault && updatedList.length > 0) {
      updatedList[0].isDefault = true;
    }
    setAddresses(updatedList);
    localStorage.setItem(`aryansh_addresses_${user!.id}`, JSON.stringify(updatedList));
    toast.success("Address deleted successfully.");
  };

  const handleSetDefaultAddress = (id: string) => {
    const updatedList = addresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === id,
    }));
    setAddresses(updatedList);
    localStorage.setItem(`aryansh_addresses_${user!.id}`, JSON.stringify(updatedList));
    toast.success("Default address updated.");
  };

  const startEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddrName(addr.name);
    setAddrStreet(addr.street);
    setAddrCity(addr.city);
    setAddrState(addr.state);
    setAddrZip(addr.zip);
    setAddrPhone(addr.phone);
    setShowAddressForm(true);
  };

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddrName("");
    setAddrStreet("");
    setAddrCity("");
    setAddrState("");
    setAddrZip("");
    setAddrPhone("");
    setShowAddressForm(false);
  };

  const handleLogoutClick = async () => {
    const { error } = await logout();
    if (!error) {
      navigate({ to: "/login" });
    }
  };

  // Get Wishlist items details
  const wishlistItems = useMemo(() => {
    return wishlist
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
  }, [wishlist, products]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream/10 pt-28">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground font-serif">Verifying credentials...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 md:pt-28 bg-cream/10 min-h-screen pb-16">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        <div className="flex flex-col gap-2 border-b border-border/80 pb-8">
          <p className="eyebrow text-primary text-xs tracking-wider">Welcome back</p>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">
            Hello, {profile?.full_name || "Guest"}
          </h1>
          <p className="text-xs text-muted-foreground">{profile?.email}</p>
        </div>

        {/* Dashboard Tabs Layout */}
        <div className="mt-10">
          <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="flex flex-col lg:flex-row gap-10">
            {/* Sidebar Controls */}
            <TabsList className="flex flex-row lg:flex-col items-start justify-start gap-1 bg-transparent p-0 w-full lg:w-64 shrink-0 overflow-x-auto lg:overflow-visible border-b lg:border-b-0 border-border/60 pb-3 lg:pb-0 h-auto">
              <TabsTrigger 
                value="profile"
                className="flex items-center gap-3 px-4 py-3 eyebrow text-[0.7rem] text-muted-foreground border-b-2 lg:border-b-0 lg:border-l-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground bg-transparent data-[state=active]:bg-transparent shadow-none rounded-none w-auto lg:w-full text-left justify-start"
              >
                <User size={15} strokeWidth={1.5} />
                My Profile
              </TabsTrigger>
              <TabsTrigger 
                value="orders"
                className="flex items-center gap-3 px-4 py-3 eyebrow text-[0.7rem] text-muted-foreground border-b-2 lg:border-b-0 lg:border-l-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground bg-transparent data-[state=active]:bg-transparent shadow-none rounded-none w-auto lg:w-full text-left justify-start"
              >
                <ShoppingBag size={15} strokeWidth={1.5} />
                My Orders
              </TabsTrigger>
              <TabsTrigger 
                value="addresses"
                className="flex items-center gap-3 px-4 py-3 eyebrow text-[0.7rem] text-muted-foreground border-b-2 lg:border-b-0 lg:border-l-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground bg-transparent data-[state=active]:bg-transparent shadow-none rounded-none w-auto lg:w-full text-left justify-start"
              >
                <MapPin size={15} strokeWidth={1.5} />
                Saved Addresses
              </TabsTrigger>
              <TabsTrigger 
                value="wishlist"
                className="flex items-center gap-3 px-4 py-3 eyebrow text-[0.7rem] text-muted-foreground border-b-2 lg:border-b-0 lg:border-l-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground bg-transparent data-[state=active]:bg-transparent shadow-none rounded-none w-auto lg:w-full text-left justify-start"
              >
                <Heart size={15} strokeWidth={1.5} />
                Wishlist ({wishlist.length})
              </TabsTrigger>
              <button 
                onClick={handleLogoutClick}
                className="flex items-center gap-3 px-4 py-3 eyebrow text-[0.7rem] text-destructive border-l-2 border-transparent hover:border-destructive/30 w-full text-left justify-start mt-auto cursor-pointer"
              >
                <LogOut size={15} strokeWidth={1.5} />
                Logout
              </button>
            </TabsList>

            {/* Content Sheets */}
            <div className="flex-1 bg-background border border-border/80 p-6 md:p-8 shadow-sm min-h-[50vh]">
              
              {/* PROFILE TAB */}
              <TabsContent value="profile" className="mt-0 space-y-6">
                <div>
                  <h2 className="font-serif text-2xl text-foreground">My Profile</h2>
                  <p className="text-xs text-muted-foreground mt-1">Manage your contact details and account profile data.</p>
                </div>
                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="profEmail" className="eyebrow text-[0.6rem] text-muted-foreground">Email Address (Read-only)</Label>
                    <Input id="profEmail" type="email" value={profile?.email || ""} disabled className="bg-muted text-muted-foreground border-border rounded-sm h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profName" className="eyebrow text-[0.6rem] text-foreground">Full Name</Label>
                    <Input 
                      id="profName" 
                      type="text" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      required
                      disabled={updatingProfile}
                      className="border-border focus-visible:ring-primary rounded-sm h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profPhone" className="eyebrow text-[0.6rem] text-foreground">Phone Number</Label>
                    <Input 
                      id="profPhone" 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="+91 99999 99999"
                      disabled={updatingProfile}
                      className="border-border focus-visible:ring-primary rounded-sm h-11"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={updatingProfile}
                    className="bg-foreground text-background py-5 rounded-sm hover:bg-primary hover:text-primary-foreground transition-all duration-300 eyebrow text-[0.62rem]"
                  >
                    {updatingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Profile Changes
                  </Button>
                </form>
              </TabsContent>

              {/* ORDERS TAB */}
              <TabsContent value="orders" className="mt-0 space-y-6">
                <div>
                  <h2 className="font-serif text-2xl text-foreground">My Orders</h2>
                  <p className="text-xs text-muted-foreground mt-1">Track current shipments and view order history.</p>
                </div>
                {ordersLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <Loader2 className="animate-spin text-primary" size={24} />
                  </div>
                ) : orders.length > 0 ? (
                  <div className="pt-4 space-y-6">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-border/70 rounded-sm bg-cream/10 p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border/50 pb-4">
                          <div className="space-y-1">
                            <p className="eyebrow text-[0.65rem] text-primary">{order.id}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar size={13} />
                              Ordered on {order.date}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.58rem] eyebrow ${
                              order.status === "Delivered" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-amber-100 text-amber-800"
                            }`}>
                              {order.status === "Delivered" ? <Package size={11} /> : <Truck size={11} />}
                              {order.status}
                            </span>
                            <span className="font-serif text-sm font-semibold">{formatPrice(order.total)}</span>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-3">
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex gap-4 items-center">
                              <div className="h-14 w-12 shrink-0 bg-cream border border-border/50 rounded-sm overflow-hidden">
                                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-serif text-sm text-foreground truncate">{item.name}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">Quantity: {item.qty}</p>
                              </div>
                              <p className="text-sm font-serif text-foreground shrink-0">{formatPrice(item.price)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-border/80 p-10 rounded-sm text-center flex flex-col items-center justify-center space-y-5 bg-cream/[0.02] mt-4">
                    <ShoppingBag size={28} strokeWidth={1.1} className="text-primary" />
                    <div className="space-y-1">
                      <p className="text-sm font-serif text-foreground">You have not placed any orders yet.</p>
                      <p className="text-xs text-muted-foreground">Your order history will appear here once you make your first purchase.</p>
                    </div>
                    <Link
                      to="/shop"
                      className="inline-flex items-center justify-center bg-foreground px-6 py-3.5 eyebrow text-[0.62rem] text-background transition-colors hover:bg-primary hover:text-primary-foreground rounded-sm"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                )}
              </TabsContent>

              {/* ADDRESSES TAB */}
              <TabsContent value="addresses" className="mt-0 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-serif text-2xl text-foreground">Saved Addresses</h2>
                    <p className="text-xs text-muted-foreground mt-1">Manage delivery locations and default shipping addresses.</p>
                  </div>
                  {!showAddressForm && (
                    <Button 
                      onClick={() => setShowAddressForm(true)}
                      className="bg-foreground text-background rounded-sm hover:bg-primary hover:text-primary-foreground border-none transition-all py-4 px-4 eyebrow text-[0.58rem] flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Add Address
                    </Button>
                  )}
                </div>

                {showAddressForm && (
                  <form onSubmit={handleSaveAddress} className="border border-border p-5 rounded-sm space-y-4 max-w-lg bg-cream/10">
                    <h3 className="font-serif text-lg text-foreground pb-2 border-b border-border/40">
                      {editingAddressId ? "Edit Address" : "Add New Address"}
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="addrName" className="eyebrow text-[0.6rem]">Contact Full Name</Label>
                        <Input id="addrName" value={addrName} onChange={(e) => setAddrName(e.target.value)} required className="h-10 border-border rounded-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="addrPhone" className="eyebrow text-[0.6rem]">Phone Number</Label>
                        <Input id="addrPhone" type="tel" value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)} required className="h-10 border-border rounded-sm" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="addrStreet" className="eyebrow text-[0.6rem]">Street Address / Suite</Label>
                      <Input id="addrStreet" value={addrStreet} onChange={(e) => setAddrStreet(e.target.value)} required className="h-10 border-border rounded-sm" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="addrCity" className="eyebrow text-[0.6rem]">City</Label>
                        <Input id="addrCity" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} required className="h-10 border-border rounded-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="addrState" className="eyebrow text-[0.6rem]">State</Label>
                        <Input id="addrState" value={addrState} onChange={(e) => setAddrState(e.target.value)} required className="h-10 border-border rounded-sm" />
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <Label htmlFor="addrZip" className="eyebrow text-[0.6rem]">ZIP / Postal Code</Label>
                        <Input id="addrZip" value={addrZip} onChange={(e) => setAddrZip(e.target.value)} required className="h-10 border-border rounded-sm" />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button type="submit" className="bg-foreground hover:bg-primary text-background hover:text-primary-foreground eyebrow text-[0.6rem] px-5 py-4 h-auto rounded-sm">
                        {editingAddressId ? "Update Address" : "Save Address"}
                      </Button>
                      <Button type="button" onClick={resetAddressForm} className="bg-transparent hover:bg-muted border border-border text-foreground eyebrow text-[0.6rem] px-5 py-4 h-auto rounded-sm">
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {addresses.map((addr) => (
                    <div 
                      key={addr.id} 
                      className={`border p-5 rounded-sm flex flex-col justify-between space-y-4 ${
                        addr.isDefault ? "border-primary bg-primary/[0.02]" : "border-border/80 bg-background"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-serif text-sm font-semibold">{addr.name}</h4>
                          {addr.isDefault && (
                            <span className="bg-primary/20 text-primary-foreground text-[0.55rem] px-2 py-0.5 rounded-sm eyebrow border border-primary/20">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {addr.street}<br />
                          {addr.city}, {addr.state} - {addr.zip}<br />
                          T: {addr.phone}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 pt-2 border-t border-border/40 text-xs">
                        {!addr.isDefault && (
                          <button 
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-primary hover:underline eyebrow text-[0.55rem]"
                          >
                            Set Default
                          </button>
                        )}
                        <button 
                          onClick={() => startEditAddress(addr)}
                          className="text-foreground hover:text-primary flex items-center gap-1 eyebrow text-[0.55rem] ml-auto"
                        >
                          <Edit3 size={11} /> Edit
                        </button>
                        {!addr.isDefault && (
                          <button 
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-destructive hover:text-destructive/80 flex items-center gap-1 eyebrow text-[0.55rem]"
                          >
                            <Trash size={11} /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {addresses.length === 0 && !showAddressForm && (
                    <div className="border border-dashed border-border/80 p-8 rounded-sm text-center col-span-2">
                      <p className="text-sm text-muted-foreground font-serif">No addresses saved yet.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* WISHLIST TAB */}
              <TabsContent value="wishlist" className="mt-0 space-y-6">
                <div>
                  <h2 className="font-serif text-2xl text-foreground">My Wishlist</h2>
                  <p className="text-xs text-muted-foreground mt-1">Your curated collection of favorite Aryansh Gold jewelry pieces.</p>
                </div>

                <div className="pt-4 grid grid-cols-2 md:grid-cols-3 gap-6">
                  {wishlistItems.map((p) => (
                    <article key={p.id} className="border border-border/50 bg-cream/[0.07] p-3 rounded-sm flex flex-col justify-between">
                      <div className="relative group overflow-hidden rounded-sm bg-cream">
                        <Link to="/product/$slug" params={{ slug: p.slug }} className="block">
                          <img src={p.image} alt={p.name} className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        </Link>
                        <button
                          onClick={() => {
                            removeFromWishlist(p.id);
                            toast.success("Removed from wishlist.");
                          }}
                          className="absolute right-2 top-2 p-1.5 rounded-full bg-background/80 text-foreground hover:text-destructive shadow-sm backdrop-blur-sm transition-all"
                        >
                          <Trash size={13} />
                        </button>
                      </div>
                      
                      <div className="mt-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-serif text-xs font-medium text-foreground truncate">{p.name}</h4>
                          <p className="text-xs text-primary font-serif mt-1">{formatPrice(p.price)}</p>
                        </div>
                        
                        <Button
                          onClick={() => {
                            addToCart(p.id);
                            removeFromWishlist(p.id);
                            toast.success("Added to shopping bag.");
                          }}
                          className="w-full mt-3 bg-foreground text-background py-3 rounded-none eyebrow text-[0.55rem] h-auto flex items-center justify-center gap-1"
                        >
                          <ShoppingBag size={11} /> Move to Bag
                        </Button>
                      </div>
                    </article>
                  ))}

                  {wishlistItems.length === 0 && (
                    <div className="border border-dashed border-border/80 p-8 rounded-sm text-center col-span-3">
                      <p className="text-sm text-muted-foreground font-serif">Your wishlist is currently empty.</p>
                      <Link to="/shop" className="mt-4 inline-block text-xs text-primary eyebrow underline">
                        Browse Collection
                      </Link>
                    </div>
                  )}
                </div>
              </TabsContent>

            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
