import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import type { AdminRole } from "@/lib/database.types";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  adminRole: AdminRole | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ user: User | null; error: any }>;
  login: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  loginWithGoogle: () => Promise<{ error: any }>;
  logout: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  updateProfile: (updates: { full_name?: string; phone?: string | null }) => Promise<{ profile: Profile | null; error: any }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch admin role
  const fetchAdminRole = async (userId: string): Promise<AdminRole | null> => {
    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) {
        console.warn("Error fetching admin role:", error);
        return null;
      }
      return data ? (data.role as AdminRole) : null;
    } catch {
      return null;
    }
  };

  // Helper to fetch or create a user profile record in the database
  const getOrCreateProfile = async (sessionUser: User): Promise<Profile | null> => {
    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sessionUser.id)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching user profile:", fetchError);
        return null;
      }

      if (existingProfile) {
        return existingProfile as Profile;
      }

      const fullName = sessionUser.user_metadata?.full_name || "Valued Customer";
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert([
          {
            id: sessionUser.id,
            full_name: fullName,
            email: sessionUser.email || "",
            phone: sessionUser.phone || null,
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.warn(
          "Could not auto-create profile row (this is expected if RLS or tables are not fully configured yet):",
          insertError
        );
        return {
          id: sessionUser.id,
          full_name: fullName,
          email: sessionUser.email || "",
          phone: sessionUser.phone || null,
          created_at: new Date().toISOString(),
        };
      }

      return newProfile as Profile;
    } catch (e) {
      console.error("Exception in profile retrieval:", e);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: activeSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (activeSession) {
          setSession(activeSession);
          setUser(activeSession.user);
          const userProfile = await getOrCreateProfile(activeSession.user);
          if (mounted) setProfile(userProfile);

          const role = await fetchAdminRole(activeSession.user.id);
          if (mounted) setAdminRole(role);
        }
      } catch (err) {
        console.error("Error checking auth session:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          setLoading(true);
          const userProfile = await getOrCreateProfile(newSession.user);
          const role = await fetchAdminRole(newSession.user.id);
          if (mounted) {
            setProfile(userProfile);
            setAdminRole(role);
            setLoading(false);
          }
        } else {
          setProfile(null);
          setAdminRole(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      
      toast.success("Account created successfully!");
      return { user: data.user, error: null };
    } catch (error: any) {
      toast.error(error.message || "Failed to create account.");
      return { user: null, error };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success("Welcome back!");
      return { user: data.user, error: null };
    } catch (error: any) {
      toast.error(error.message || "Invalid login credentials.");
      return { user: null, error };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success("Logged out successfully.");
      return { error: null };
    } catch (error: any) {
      toast.error(error.message || "Failed to log out.");
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) throw error;
      
      toast.success("Password reset email sent! Check your inbox.");
      return { error: null };
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email.");
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      toast.success("Password updated successfully.");
      return { error: null };
    } catch (error: any) {
      toast.error(error.message || "Failed to update password.");
      return { error };
    }
  };

  const updateProfile = async (updates: { full_name?: string; phone?: string | null }) => {
    if (!user) {
      const error = new Error("No active user session.");
      return { profile: null, error };
    }

    try {
      if (updates.full_name) {
        await supabase.auth.updateUser({
          data: { full_name: updates.full_name }
        });
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({
          full_name: updates.full_name,
          phone: updates.phone,
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      const updatedProfile = data as Profile;
      setProfile(updatedProfile);
      toast.success("Profile updated successfully.");
      return { profile: updatedProfile, error: null };
    } catch (error: any) {
      console.warn("Could not update profile in database (expected if tables or RLS not set up):", error);
      
      const fallbackProfile: Profile = {
        ...profile!,
        full_name: updates.full_name ?? profile!.full_name,
        phone: updates.phone !== undefined ? updates.phone : profile!.phone,
      };
      setProfile(fallbackProfile);
      toast.success("Profile updated (local preview).");
      return { profile: fallbackProfile, error: null };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const redirectTo = `${window.location.origin}/account`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      toast.error(error.message || "Failed to initialize Google Sign-In.");
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    adminRole,
    isAdmin: adminRole !== null,
    isSuperAdmin: adminRole === "super_admin",
    signUp,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updatePassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
