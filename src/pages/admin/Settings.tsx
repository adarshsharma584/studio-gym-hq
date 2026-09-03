import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, StatusBadge, formatDate } from "@/components/admin/ui";
import { Building2, CreditCard, Mail, ShieldCheck, UserPlus, UserX } from "lucide-react";

const ALL_PERMISSIONS = [
  "dashboard", "members", "trainers", "plans", "services", "equipment",
  "inventory", "content", "financials", "notifications", "settings.read", "settings.write",
];

const ROLE_ORDER = ["superAdmin", "admin", "staff"] as const;

function SaveBar({ onSave, dirty }: { onSave: () => void; dirty: boolean }) {
  return (
    <div className="flex justify-end gap-2 border-t pt-4">
      <Button className="cursor-pointer" onClick={onSave} disabled={!dirty}>
        Save changes
      </Button>
    </div>
  );
}

export default function Settings() {
  const settings = useQuery(api.settings.get);
  const staff = useQuery(api.settings.listStaff);

  const updateGym = useMutation(api.settings.updateGym);
  const updatePayment = useMutation(api.settings.updatePayment);
  const updateSmtp = useMutation(api.settings.updateSmtp);
  const updatePermissions = useMutation(api.settings.updatePermissions);
  const inviteStaff = useMutation(api.settings.inviteStaff);
  const revokeStaff = useMutation(api.settings.revokeStaff);
  const setUserRole = useMutation(api.settings.setUserRole);

  // General form
  const [gym, setGym] = useState<{
    name: string; tagline: string; address: string; city: string; phone: string; email: string;
    weekdays: string; saturday: string; sunday: string;
  } | null>(null);
  const gymDirty = gym !== null && settings !== undefined && JSON.stringify(gym) !== JSON.stringify({
    name: settings?.gym.name ?? "",
    tagline: settings?.gym.tagline ?? "",
    address: settings?.gym.address ?? "",
    city: settings?.gym.city ?? "",
    phone: settings?.gym.phone ?? "",
    email: settings?.gym.email ?? "",
    weekdays: settings?.gym.hours.weekdays ?? "",
    saturday: settings?.gym.hours.saturday ?? "",
    sunday: settings?.gym.hours.sunday ?? "",
  });

  const [payment, setPayment] = useState<{
    provider: string; stripePublishableKey: string; stripeSecretKey: string;
    razorpayKeyId: string; razorpayKeySecret: string; currency: string;
  } | null>(null);

  const [smtp, setSmtp] = useState<{
    host: string; port: string; user: string; password: string;
    fromName: string; fromEmail: string; secure: boolean;
  } | null>(null);

  const [permissionEdits, setPermissionEdits] = useState<Record<string, string[]>>({});

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("staff");

  if (!settings) {
    return (
      <div className="space-y-6">
        <PageHeader title="System Settings" description="Gym identity, gateways, email delivery and staff access." />
        <Card className="border-border/70 shadow-none"><CardContent className="p-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="mb-3 h-14 w-full" />)}</CardContent></Card>
      </div>
    );
  }

  const gymValues = gym ?? {
    name: settings.gym.name,
    tagline: settings.gym.tagline,
    address: settings.gym.address,
    city: settings.gym.city,
    phone: settings.gym.phone,
    email: settings.gym.email,
    weekdays: settings.gym.hours.weekdays,
    saturday: settings.gym.hours.saturday,
    sunday: settings.gym.hours.sunday,
  };
  const paymentValues = payment ?? {
    provider: settings.paymentGateway.provider,
    stripePublishableKey: settings.paymentGateway.stripePublishableKey ?? "",
    stripeSecretKey: settings.paymentGateway.stripeSecretKey ?? "",
    razorpayKeyId: settings.paymentGateway.razorpayKeyId ?? "",
    razorpayKeySecret: settings.paymentGateway.razorpayKeySecret ?? "",
    currency: settings.paymentGateway.currency,
  };
  const smtpValues = smtp ?? {
    host: settings.smtp.host ?? "",
    port: settings.smtp.port ? String(settings.smtp.port) : "",
    user: settings.smtp.user ?? "",
    password: settings.smtp.password ?? "",
    fromName: settings.smtp.fromName ?? "",
    fromEmail: settings.smtp.fromEmail ?? "",
    secure: settings.smtp.secure ?? true,
  };

  const saveGym = async () => {
    await updateGym({ ...gymValues });
    setGym(null);
    toast.success("Gym details saved");
  };

  const savePayment = async () => {
    await updatePayment({
      provider: paymentValues.provider,
      stripePublishableKey: paymentValues.stripePublishableKey || undefined,
      stripeSecretKey: paymentValues.stripeSecretKey || undefined,
      razorpayKeyId: paymentValues.razorpayKeyId || undefined,
      razorpayKeySecret: paymentValues.razorpayKeySecret || undefined,
      currency: paymentValues.currency,
    });
    setPayment(null);
    toast.success("Payment gateway saved");
  };

  const saveSmtp = async () => {
    await updateSmtp({
      host: smtpValues.host || undefined,
      port: smtpValues.port ? Number(smtpValues.port) : undefined,
      user: smtpValues.user || undefined,
      password: smtpValues.password || undefined,
      fromName: smtpValues.fromName || undefined,
      fromEmail: smtpValues.fromEmail || undefined,
      secure: smtpValues.secure,
    });
    setSmtp(null);
    toast.success("SMTP configuration saved");
  };

  const savePermissions = async (role: string) => {
    const perms = permissionEdits[role] ?? settings.rolePermissions[role] ?? [];
    await updatePermissions({ role, permissions: perms });
    setPermissionEdits((e) => {
      const next = { ...e };
      delete next[role];
      return next;
    });
    toast.success(`${role} permissions updated`);
  };

  const submitInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      await inviteStaff({ email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail("");
      toast.success(`Invite sent to ${inviteEmail.trim()}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invite failed");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        description="Gym identity, payment gateway, email delivery and staff access control."
      />

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="email">Email / SMTP</TabsTrigger>
          <TabsTrigger value="roles">Roles & Staff</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card className="border-border/70 shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Gym Profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="g-name">Gym name</Label>
                  <Input id="g-name" value={gymValues.name} onChange={(e) => setGym({ ...gymValues, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="g-tagline">Tagline</Label>
                  <Input id="g-tagline" value={gymValues.tagline} onChange={(e) => setGym({ ...gymValues, tagline: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="g-address">Address</Label>
                  <Input id="g-address" value={gymValues.address} onChange={(e) => setGym({ ...gymValues, address: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="g-city">City</Label>
                  <Input id="g-city" value={gymValues.city} onChange={(e) => setGym({ ...gymValues, city: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="g-phone">Phone</Label>
                  <Input id="g-phone" value={gymValues.phone} onChange={(e) => setGym({ ...gymValues, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="g-email">Contact email</Label>
                  <Input id="g-email" type="email" value={gymValues.email} onChange={(e) => setGym({ ...gymValues, email: e.target.value })} />
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Business hours</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="g-wd">Weekdays</Label>
                    <Input id="g-wd" value={gymValues.weekdays} onChange={(e) => setGym({ ...gymValues, weekdays: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="g-sat">Saturday</Label>
                    <Input id="g-sat" value={gymValues.saturday} onChange={(e) => setGym({ ...gymValues, saturday: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="g-sun">Sunday</Label>
                    <Input id="g-sun" value={gymValues.sunday} onChange={(e) => setGym({ ...gymValues, sunday: e.target.value })} />
                  </div>
                </div>
              </div>
              <SaveBar onSave={saveGym} dirty={gymDirty} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card className="border-border/70 shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Payment Gateway</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Provider</Label>
                  <Select
                    value={paymentValues.provider}
                    onValueChange={(v) => setPayment({ ...paymentValues, provider: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="razorpay">Razorpay</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="g-cur">Currency</Label>
                  <Input id="g-cur" value={paymentValues.currency} onChange={(e) => setPayment({ ...paymentValues, currency: e.target.value })} />
                </div>
              </div>

              {paymentValues.provider === "razorpay" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="rz-id">Razorpay Key ID</Label>
                    <Input id="rz-id" value={paymentValues.razorpayKeyId} onChange={(e) => setPayment({ ...paymentValues, razorpayKeyId: e.target.value })} placeholder="rzp_live_…" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rz-secret">Razorpay Key Secret</Label>
                    <Input id="rz-secret" type="password" value={paymentValues.razorpayKeySecret} onChange={(e) => setPayment({ ...paymentValues, razorpayKeySecret: e.target.value })} placeholder="••••••••" />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="st-pub">Stripe Publishable Key</Label>
                    <Input id="st-pub" value={paymentValues.stripePublishableKey} onChange={(e) => setPayment({ ...paymentValues, stripePublishableKey: e.target.value })} placeholder="pk_live_…" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="st-sec">Stripe Secret Key</Label>
                    <Input id="st-sec" type="password" value={paymentValues.stripeSecretKey} onChange={(e) => setPayment({ ...paymentValues, stripeSecretKey: e.target.value })} placeholder="sk_live_…" />
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Keys are stored in your project settings. The online checkout on the customer site is wired to this provider.
              </p>
              <SaveBar onSave={savePayment} dirty={payment !== null} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="mt-4">
          <Card className="border-border/70 shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Email / SMTP</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="s-host">SMTP host</Label>
                  <Input id="s-host" value={smtpValues.host} onChange={(e) => setSmtp({ ...smtpValues, host: e.target.value })} placeholder="smtp.example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-port">Port</Label>
                  <Input id="s-port" value={smtpValues.port} onChange={(e) => setSmtp({ ...smtpValues, port: e.target.value })} placeholder="587" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-user">Username</Label>
                  <Input id="s-user" value={smtpValues.user} onChange={(e) => setSmtp({ ...smtpValues, user: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-pass">Password / API key</Label>
                  <Input id="s-pass" type="password" value={smtpValues.password} onChange={(e) => setSmtp({ ...smtpValues, password: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-from">From name</Label>
                  <Input id="s-from" value={smtpValues.fromName} onChange={(e) => setSmtp({ ...smtpValues, fromName: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-from-email">From email</Label>
                  <Input id="s-from-email" value={smtpValues.fromEmail} onChange={(e) => setSmtp({ ...smtpValues, fromEmail: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Use TLS/SSL</p>
                  <p className="text-xs text-muted-foreground">Secure connection for port 465/587</p>
                </div>
                <Switch checked={smtpValues.secure} onCheckedChange={(v) => setSmtp({ ...smtpValues, secure: v })} />
              </div>
              <SaveBar onSave={saveSmtp} dirty={smtp !== null} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4 space-y-4">
          <Card className="border-border/70 shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-muted-foreground" />
                  <CardTitle className="text-base">Staff & Invites</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@example.com"
                    className="h-9 w-56"
                  />
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="cursor-pointer gap-1.5" onClick={submitInvite} disabled={!inviteEmail.trim()}>
                    <UserPlus className="size-3.5" /> Invite
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!staff ? (
                <div className="space-y-3 p-6">{[0, 1].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="hidden md:table-cell">Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{s.name}</span>
                            {s.kind === "invite" && <Badge variant="secondary" className="font-normal">invited</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">{s.email}</TableCell>
                        <TableCell>
                          <Select
                            value={s.role}
                            onValueChange={async (v) => {
                              if (s.kind !== "user") return;
                              try {
                                await setUserRole({ userId: s.id, role: v });
                                toast.success(`${s.email} is now ${v}`);
                              } catch (e) {
                                toast.error(e instanceof Error ? e.message : "Role change failed");
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="superAdmin">Super Admin</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="staff">Staff</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{formatDate(s.invitedAt)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 cursor-pointer gap-1 text-xs text-destructive"
                              onClick={async () => {
                                await revokeStaff({ email: s.email });
                                toast.success(`${s.email} removed from staff`);
                              }}
                            >
                              <UserX className="size-3.5" /> Revoke
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Role Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {ROLE_ORDER.map((role) => {
                const current = settings.rolePermissions[role] ?? [];
                const allAccess = current.includes("*");
                const edited = permissionEdits[role] ?? current;
                return (
                  <div key={role} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold capitalize">{role.replace("superAdmin", "Super Admin")}</p>
                        <p className="text-xs text-muted-foreground">
                          {allAccess ? "Full access to every module" : `${edited.length} of ${ALL_PERMISSIONS.length} module permissions`}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="cursor-pointer" disabled={JSON.stringify(edited) === JSON.stringify(current)} onClick={() => savePermissions(role)}>
                        Save
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                      {allAccess ? (
                        <Badge variant="secondary" className="font-normal">All modules enabled</Badge>
                      ) : (
                        ALL_PERMISSIONS.map((perm) => {
                          const on = edited.includes(perm);
                          return (
                            <label key={perm} className="flex cursor-pointer items-center gap-1.5 text-[13px]">
                              <Switch
                                checked={on}
                                onCheckedChange={(v) =>
                                  setPermissionEdits((e) => {
                                    const base = e[role] ?? current;
                                    return {
                                      ...e,
                                      [role]: v ? [...base, perm] : base.filter((p) => p !== perm),
                                    };
                                  })
                                }
                              />
                              <span className={on ? "text-foreground" : "text-muted-foreground"}>{perm}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground">
                Permissions gate each sidebar module for the signed-in staff role. Super Admin bypasses all checks.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}