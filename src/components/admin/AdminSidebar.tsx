import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Building2, BookOpen, Calendar, Trophy, ShieldAlert, LogOut } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

const items = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true },
  { title: "Usuarios", url: "/admin/users", icon: Users },
  { title: "Instituciones", url: "/admin/institutions", icon: Building2 },
  { title: "Académico", url: "/admin/academic", icon: BookOpen },
  { title: "Reuniones", url: "/admin/meetings", icon: Calendar },
  { title: "Gamificación", url: "/admin/gamification", icon: Trophy },
  { title: "Auditoría", url: "/admin/audit", icon: ShieldAlert },
];

export default function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { signOut } = useAuth();

  const isActive = (url: string, end?: boolean) =>
    end ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-4 py-4 border-b">
          <h2 className={`font-bold text-lg text-gradient ${collapsed ? "hidden" : ""}`}>LearnLink</h2>
          <p className={`text-xs text-muted-foreground ${collapsed ? "hidden" : ""}`}>Admin General</p>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url, item.end)}>
                    <NavLink to={item.url} end={item.end} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} className="text-destructive">
                  <LogOut className="h-4 w-4" />
                  {!collapsed && <span>Cerrar sesión</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}