import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { 
  Users, 
  UserPlus, 
  Send, 
  Trash2, 
  ShieldCheck, 
  Loader2, 
  Mail, 
  UserCheck, 
  XCircle,
  Copy,
  Check
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { type AdminRole, type DbAdminInvite } from "@/lib/database.types";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersManagement,
});

interface MappedAdmin {
  userId: string;
  role: AdminRole;
  fullName: string;
  email: string;
  createdAt: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

function AdminUsersManagement() {
  const { isSuperAdmin, user: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"directory" | "invites" | "promote">("directory");
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [admins, setAdmins] = useState<MappedAdmin[]>([]);
  const [invites, setInvites] = useState<DbAdminInvite[]>([]);
  const [customers, setCustomers] = useState<Profile[]>([]);

  // Invite Form States
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("admin");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Security guard check
  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      navigate({ to: "/admin/unauthorized" });
    }
  }, [isSuperAdmin, authLoading, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: adminsData } = await supabase.from("admin_users").select("*");
      const { data: profilesData } = await supabase.from("profiles").select("*");
      const { data: invitesData } = await supabase
        .from("admin_invites")
        .select("*")
        .order("created_at", { ascending: false });

      if (adminsData && profilesData) {
        // Map administrators joined with public profiles details
        const mapped = adminsData.map((admin) => {
          const profile = profilesData.find((p) => p.id === admin.user_id);
          return {
            userId: admin.user_id,
            role: admin.role,
            fullName: profile?.full_name || "Active Administrator",
            email: profile?.email || "Unknown Email",
            createdAt: admin.created_at,
          };
        });
        setAdmins(mapped);

        // Filter registered customers that are not currently administrators
        const custs = profilesData.filter(
          (p) => !adminsData.some((a) => a.user_id === p.id)
        );
        setCustomers(custs);
      }

      if (invitesData) {
        setInvites(invitesData);
      }
    } catch (err: any) {
      console.error("Error loading administration data:", err);
      toast.error("Failed to load user management directories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
    }
  }, [isSuperAdmin]);

  const handlePromote = async (userId: string, targetName: string) => {
    if (!confirm(`Are you sure you want to promote ${targetName} to an Administrator?`)) return;

    try {
      const { error } = await supabase
        .from("admin_users")
        .insert({
          user_id: userId,
          role: "admin",
          invited_by: currentUser?.id || null
        });

      if (error) throw error;

      toast.success(`${targetName} promoted to Admin successfully!`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to promote user.");
    }
  };

  const handleRevokeRole = async (userId: string, targetEmail: string) => {
    if (userId === currentUser?.id) {
      toast.error("You cannot revoke your own administrative privileges.");
      return;
    }

    if (!confirm(`Are you sure you want to revoke administrative access for ${targetEmail}?`)) return;

    try {
      const { error } = await supabase
        .from("admin_users")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Administrator access revoked successfully.");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke access.");
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setSendingInvite(true);
    try {
      const token = window.crypto.randomUUID().replace(/-/g, "");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

      const { error } = await supabase
        .from("admin_invites")
        .insert({
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          token,
          status: "pending",
          invited_by: currentUser?.id,
          expires_at: expiresAt
        });

      if (error) throw error;

      toast.success("Invitation generated successfully!");
      setInviteEmail("");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to send invitation.");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm("Are you sure you want to revoke this invitation?")) return;

    try {
      const { error } = await supabase
        .from("admin_invites")
        .update({ status: "revoked" })
        .eq("id", inviteId);

      if (error) throw error;

      toast.success("Invitation revoked successfully.");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke invitation.");
    }
  };

  const copyInviteLink = (token: string, id: string) => {
    const inviteLink = `${window.location.origin}/register?token=${token}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedId(id);
    toast.success("Invitation registration link copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Retrieving backoffice users configurations...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div>
        <h1 className="font-serif text-3xl text-foreground flex items-center gap-2.5">
          <Users className="text-primary" size={28} />
          Administrators Management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure backoffice administrative access levels and invite tokens</p>
      </div>

      {/* Tabs selectors */}
      <div className="flex border-b border-border">
        {[
          { id: "directory", label: "Directory", icon: ShieldCheck },
          { id: "invites", label: "Send Invites", icon: Mail },
          { id: "promote", label: "Promote Shoppers", icon: UserPlus },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 border-b-2 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content area */}
      <div className="mt-6">
        {/* TAB 1: Admin Directory */}
        {activeTab === "directory" && (
          <div className="overflow-hidden rounded-sm border border-border bg-background shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Access Role</th>
                  <th className="px-6 py-4">Date Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                {admins.map((adm) => (
                  <tr key={adm.userId} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 font-sans text-xs font-bold text-primary uppercase">
                          {adm.email.slice(0, 2)}
                        </div>
                        <span>{adm.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{adm.fullName}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-2xs font-semibold tracking-wider uppercase",
                        adm.role === "super_admin" 
                          ? "bg-primary/10 text-primary" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {adm.role === "super_admin" ? "Super Admin" : "Admin"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(adm.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        disabled={adm.userId === currentUser?.id}
                        onClick={() => handleRevokeRole(adm.userId, adm.email)}
                        className="inline-flex items-center gap-1.5 text-xs text-destructive hover:underline disabled:opacity-40"
                      >
                        <Trash2 size={13} />
                        Revoke Access
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: Secure Invitations */}
        {activeTab === "invites" && (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Invite Form */}
            <div className="bg-background rounded-sm border border-border p-6 shadow-sm h-fit">
              <h2 className="font-serif text-lg text-foreground mb-4">Send New Invitation</h2>
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label htmlFor="invite-email" className="block text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Email Address</label>
                  <input
                    id="invite-email"
                    type="email"
                    required
                    placeholder="partner@aryansh.in"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full rounded-sm border border-border bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="invite-role" className="block text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Access Role</label>
                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as AdminRole)}
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={sendingInvite}
                  className="inline-flex w-full items-center justify-center gap-2 bg-primary px-4 py-2.5 eyebrow text-xs text-primary-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
                >
                  {sendingInvite ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                  Create Invitation
                </button>
              </form>
            </div>

            {/* Pending Invites List */}
            <div className="lg:col-span-2 overflow-hidden rounded-sm border border-border bg-background shadow-sm">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-4">Invited Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-sm">
                  {invites.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground text-xs italic">
                        No invitations generated yet.
                      </td>
                    </tr>
                  ) : (
                    invites.map((inv) => {
                      const isPending = inv.status === "pending";
                      return (
                        <tr key={inv.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4 font-medium text-foreground">{inv.email}</td>
                          <td className="px-6 py-4 text-xs capitalize text-muted-foreground">{inv.role}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold tracking-wider uppercase",
                              inv.status === "pending" && "bg-amber-100 text-amber-800",
                              inv.status === "accepted" && "bg-emerald-100 text-emerald-800",
                              inv.status === "revoked" && "bg-red-100 text-red-800",
                              inv.status === "expired" && "bg-gray-100 text-gray-800"
                            )}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => copyInviteLink(inv.token, inv.id)}
                                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                    title="Copy registration link"
                                  >
                                    {copiedId === inv.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                  </button>
                                  <button
                                    onClick={() => handleRevokeInvite(inv.id)}
                                    className="text-xs text-destructive hover:underline flex items-center gap-1"
                                  >
                                    <XCircle size={13} />
                                    Revoke
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Promote shoppers */}
        {activeTab === "promote" && (
          <div className="overflow-hidden rounded-sm border border-border bg-background shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">Customer Email</th>
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Registered Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground text-xs italic">
                      No customer registrations available to promote.
                    </td>
                  </tr>
                ) : (
                  customers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{cust.email}</td>
                      <td className="px-6 py-4 text-muted-foreground">{cust.full_name}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(cust.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handlePromote(cust.id, cust.full_name)}
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                        >
                          <UserCheck size={13} />
                          Promote to Admin
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
