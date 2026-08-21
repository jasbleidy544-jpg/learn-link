import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLayout() {
  const { profile } = useAuth();
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full night-sky">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b border-border/40 px-4 backdrop-blur-md bg-background/60 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground">Panel del Administrador General</span>
            </div>
            <div className="text-sm text-muted-foreground">{profile?.full_name || profile?.email}</div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}