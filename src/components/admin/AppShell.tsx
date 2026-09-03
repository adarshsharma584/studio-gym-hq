import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { InitialsAvatar } from "@/components/admin/ui";
import {
  Bell,
  BellRing,
  Blocks,
  Camera,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Dumbbell,
  Gauge,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Package,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  children?: { title: string; href: string }[];
};

const NAV: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Member Management", href: "/dashboard/members", icon: Users },
  { title: "Trainer Management", href: "/dashboard/trainers", icon: Dumbbell },
  { title: "Subscriptions & Plans", href: "/dashboard/plans", icon: CreditCard },
  { title: "Services & Facilities", href: "/dashboard/services", icon: Blocks },
  { title: "Equipment Management", href: "/dashboard/equipment", icon: Wrench },
  { title: "Inventory & Stock", href: "/dashboard/inventory", icon: Package },
  {
    title: "Content Management",
    href: "/dashboard/content",
    icon: Megaphone,
    children: [
      { title: "Banners", href: "/dashboard/content?tab=banners" },
      { title: "Reels / Videos", href: "/dashboard/content?tab=reels" },
      { title: "Announcements", href: "/dashboard/content?tab=announcements" },
      { title: "Blog / Gallery", href: "/dashboard/content?tab=posts" },
    ],
  },
  { title: "Financials & Revenue", href: "/dashboard/financials", icon: Wallet },
  { title: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { title: "System Settings", href: "/dashboard/settings", icon: Settings },
];

const STAFF_ROLES = ["superAdmin", "admin", "staff"];

function SidebarNav() {
  const location = useLocation();
  return (
    <SidebarMenu>
      {NAV.map((item) => {
        const isActive = item.href === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(item.href.split("?")[0]);
        const isOpen = item.children?.some((c) => location.pathname.startsWith(c.href.split("?")[0])) ?? false;
        if (item.children) {
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive || isOpen}>
                <NavLink to={item.href}>
                  <item.icon />
                  <span>{item.title}</span>
                  {isOpen ? <ChevronDown className="ml-auto size-3.5" /> : <ChevronRight className="ml-auto size-3.5" />}
                </NavLink>
              </SidebarMenuButton>
              {isOpen && (
                <SidebarMenuSub>
                  {item.children.map((c) => (
                    <SidebarMenuSubItem key={c.title}>
                      <SidebarMenuSubButton asChild isActive={location.pathname + location.search === c.href}>
                        <NavLink to={c.href}>{c.title}</NavLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          );
        }
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
              <NavLink to={item.href}>
                <item.icon />
                <span>{item.title}</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export default function AppShell() {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useQuery(api.settings.get);
  const ensureSeeded = useMutation(api.seed.ensureSeeded);
  const [seedAttempted, setSeedAttempted] = useState(false);

  useEffect(() => {
    if (user && settings === null && !seedAttempted) {
      setSeedAttempted(true);
      void ensureSeeded().catch((err) => console.error("Seed failed:", err));
    }
  }, [user, settings, seedAttempted, ensureSeeded]);

  const isStaff = user && STAFF_ROLES.includes(user.role ?? "");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const currentNav = NAV.find(
    (n) =>
      (n.href === "/dashboard" && location.pathname === "/dashboard") ||
      (n.href !== "/dashboard" && location.pathname.startsWith(n.href.split("?")[0])),
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-sm text-muted-foreground">Loading workspace…</div>
      </div>
    );
  }

  if (!user) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!isStaff) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <ShieldCheck className="size-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Staff access required</h1>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            The Pulse Athletics admin dashboard is for staff accounts. If you just signed up, your
            account may not have been granted staff access yet.
          </p>
        </div>
        <Button variant="outline" className="cursor-pointer" onClick={handleSignOut}>
          <LogOut className="mr-2 size-4" />
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Gauge className="size-[18px]" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">Pulse Athletics</span>
              <span className="text-[11px] text-muted-foreground">Admin Console</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Overview</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarNav />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarSeparator />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <button type="button" onClick={() => navigate("/")} className="cursor-pointer">
                  <Camera className="size-4" />
                  <span>View customer site</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <InitialsAvatar name={user.name ?? user.email ?? "A"} className="size-8 text-[11px]" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-medium">{user.name ?? "Admin"}</p>
              <p className="truncate text-[11px] text-muted-foreground capitalize">{user.role ?? "member"}</p>
            </div>
            <Button variant="ghost" size="icon" className="size-8 cursor-pointer" onClick={handleSignOut} title="Sign out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
          <SidebarTrigger />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{currentNav?.title ?? "Dashboard"}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative cursor-pointer" title="Notifications" onClick={() => navigate("/dashboard/notifications")}>
              <BellRing className="size-4" />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-red-500" />
            </Button>
            <NavLink to="/dashboard/settings" className={cn("flex items-center gap-2", location.pathname === "/dashboard/settings" && "text-foreground")}>
              <InitialsAvatar name={user.name ?? user.email ?? "A"} className="size-7 text-[10px]" />
            </NavLink>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}