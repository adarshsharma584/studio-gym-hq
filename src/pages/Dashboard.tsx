// Compatibility shim for stale preview sessions.
//
// The starter "Dashboard" page was replaced by the full admin app (see
// src/components/admin/AppShell.tsx and src/pages/admin/*). Browsers that
// loaded the app before that change still hold a module graph that
// lazy-imports this file; deleting it made those sessions 404 and crash.
// This shim renders the admin Overview so stale sessions stay functional
// until their next full reload, at which point the new router takes over.
import Overview from "./admin/Overview";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-background p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-7xl">
        <Overview />
      </div>
    </main>
  );
}