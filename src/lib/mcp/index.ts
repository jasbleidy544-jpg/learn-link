import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfile from "./tools/get-my-profile";
import getMyProgress from "./tools/get-my-progress";
import listMyActivities from "./tools/list-my-activities";
import listMyMeetings from "./tools/list-my-meetings";
import listMyNotifications from "./tools/list-my-notifications";
import listMyStudents from "./tools/list-my-students";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "star-path-learn",
  title: "star-path-learn",
  version: "0.1.0",
  instructions:
    "Herramientas de LearnLink (star-path-learn), plataforma contra la deserción escolar. Cada llamada actúa como el usuario autenticado: estudiantes pueden consultar su perfil, progreso, actividades, mentorías y notificaciones; docentes pueden listar sus estudiantes asignados y sus mentorías.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getMyProfile,
    getMyProgress,
    listMyActivities,
    listMyMeetings,
    listMyNotifications,
    listMyStudents,
  ],
});