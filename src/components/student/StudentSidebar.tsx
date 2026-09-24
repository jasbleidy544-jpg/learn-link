import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Target,
  Brain,
  Trophy,
  Calendar,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

const items = [
  { title: "Inicio", url: "/student", icon: LayoutDashboard, end: true },
  { title: "Mis actividades", url: "/student/activities", icon: ClipboardList },
  { title: "Retos del día", url: "/student/challenges", icon: Target },
  { title: "Mi IA", url: "/student/ai", icon: Brain },
  { title: "Mis logros", url: "/student/achievements", icon: Trophy },
  { title: "Mis mentorías", url: "/student/mentorships", icon: Calendar },
  { title: "Mis docentes", url: "/student/teachers", icon: Users },
];

const bottomItems = [
  { title: "Configuración", url: "/student/settings", icon: Settings },
];

export default function StudentSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { signOut, profile } = useAuth();

  const isActive = (url: string, end?: boolean) =>
    end ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-4 py-4 border-b">
          <h2 className={`font-bold text-lg text-gradient ${collapsed ? "hidden" : ""}`}>
            LearnLink
          </h2>
          <p className={`text-xs text-muted-foreground ${collapsed ? "hidden" : ""}`}>
            {profile?.full_name?.split(" ")[0] || "Estudiante"}
          </p>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Mi aprendizaje</SidebarGroupLabel>
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
          <SidebarGroupLabel>Cuenta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url, true)}>
                    <NavLink to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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