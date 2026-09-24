import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import StudentSidebar from "@/components/student/StudentSidebar";
import { useAuth } from "@/hooks/useAuth";
import MentorChatBubble from "@/components/dashboard/MentorChatBubble";

const TITLES: Record<string, string> = {
  "/student": "Inicio",
  "/student/activities": "Mis actividades",
  "/student/challenges": "Retos del día",
  "/student/ai": "Mi IA",
  "/student/achievements": "Mis logros",
  "/student/mentorships": "Mis mentorías",
  "/student/teachers": "Mis docentes",
  "/student/settings": "Configuración",
};

export default function StudentLayout() {
  const { profile } = useAuth();
  const { pathname } = useLocation();

  const isAIPage = pathname === "/student/ai";
  const pageTitle = TITLES[pathname] || "Mi panel";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full night-sky">
        <StudentSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b border-border/40 px-4 backdrop-blur-md bg-background/60 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground">{pageTitle}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {profile?.full_name || profile?.email}
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
      {/* El botón flotante solo aparece cuando NO estamos en /student/ai */}
      {!isAIPage && <MentorChatBubble />}
    </SidebarProvider>
  );
}