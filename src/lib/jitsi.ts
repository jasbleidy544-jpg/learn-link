/**
 * Genera un enlace único y privado de Jitsi Meet (gratuito, sin licencias)
 * para una cita de mentoría. El nombre de la sala incluye un identificador
 * aleatorio para que cada cita tenga su propia sala privada.
 */
export function generateJitsiLink(): string {
  const randomId = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `https://meet.jit.si/LearnLink-Cita-${randomId}`;
}
