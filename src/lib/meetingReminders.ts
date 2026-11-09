import { supabase } from "@/integrations/supabase/client";

export type ReminderMeeting = {
  id: string;
  host_id: string;
  student_id: string;
  title: string;
  scheduled_at: string;
  meet_link: string | null;
  status: string;
  recordatorio_15min?: boolean;
};

/**
 * Cuando una reunión está a ~15 minutos de empezar, notifica tanto al
 * estudiante como al mentor en su campana de notificaciones. Cualquiera de
 * los dos lados (estudiante o mentor) que tenga la app abierta primero
 * dispara el aviso para AMBOS, usando el mismo flag en "meetings" para no
 * duplicar el recordatorio.
 *
 * La tabla "student_notifications" solo tiene permisos de lectura para
 * auth.uid() = student_id, así que para notificar al mentor insertamos una
 * fila con student_id = host_id (el destinatario real, aunque la columna se
 * llame "student_id" por el diseño original de la tabla).
 */
export async function maybeSendMeetingReminder(
  meeting: ReminderMeeting,
  studentName: string,
  mentorName: string
): Promise<boolean> {
  if (meeting.status !== "scheduled" || meeting.recordatorio_15min) return false;
  const diffMin = (new Date(meeting.scheduled_at).getTime() - Date.now()) / 60000;
  if (diffMin > 16 || diffMin < 2) return false;

  const when = new Date(meeting.scheduled_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

  // Marcamos el flag primero para minimizar la posibilidad de duplicados si
  // dos pestañas detectan la ventana casi al mismo tiempo.
  const { error: flagError } = await (supabase as any)
    .from("meetings")
    .update({ recordatorio_15min: true })
    .eq("id", meeting.id)
    .eq("recordatorio_15min", false);
  if (flagError) return false;

  await (supabase as any).from("student_notifications").insert([
    {
      student_id: meeting.student_id,
      type: "meeting",
      title: "🔴 Tu mentoría empieza en 15 minutos",
      content: `Tu sesión "${meeting.title}" con ${mentorName} empieza a las ${when}. ¡Prepárate y entra a la videollamada!`,
      link: meeting.meet_link,
    },
    {
      student_id: meeting.host_id,
      type: "meeting",
      title: "🔴 Tu mentoría empieza en 15 minutos",
      content: `Tu sesión "${meeting.title}" con ${studentName} empieza a las ${when}. ¡Prepárate y entra a la videollamada!`,
      link: meeting.meet_link,
    },
  ]);

  return true;
}
