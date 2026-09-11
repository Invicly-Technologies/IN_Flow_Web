import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { MobileNav } from "@/components/shell/mobile-nav";
import { TaskDetailPanel } from "@/components/overlays/task-detail-panel";
import { SearchModal } from "@/components/overlays/search-modal";
import { ToastStack } from "@/components/overlays/toast-stack";
import { ThemeInitializer } from "@/components/providers/theme-initializer";
import { AuthGuard } from "@/components/providers/auth-guard";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <div className="scrollbar-thin flex-1 px-7 pb-20 pt-6 max-md:px-4 max-md:pb-24 max-md:pt-4">
              {children}
            </div>
          </main>
        </div>
        <MobileNav />
        <TaskDetailPanel />
        <SearchModal />
        <ToastStack />
        <ThemeInitializer />
      </div>
    </AuthGuard>
  );
}
