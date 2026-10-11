import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import StudentSidebar from "@/components/student/StudentSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useAchievements } from "@/hooks/useAchievements";
import { useDailyStreak } from "@/hooks/useDailyStreak";
import MentorChatBubble from "@/components/dashboard/MentorChatBubble";
import AchievementPopup from "@/components/dashboard/AchievementPopup";
import LevelUpPopup from "@/components/dashboard/LevelUpPopup";

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
  const { profile, user } = useAuth();
  const { pathname } = useLocation();
  const {
    currentAchievement,
    levelUpEvent,
    dismissCurrent,
    dismissLevelUp,
  } = useAchievements();

  // ✅ Nuevo: Dispara la racha diaria una vez al día
  useDailyStreak();

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

      {!isAIPage && <MentorChatBubble />}

      <AchievementPopup
        achievement={currentAchievement}
        onDismiss={dismissCurrent}
      />
      <LevelUpPopup
        event={levelUpEvent}
        userId={user?.id}
        onDismiss={dismissLevelUp}
      />
    </SidebarProvider>
  );
}