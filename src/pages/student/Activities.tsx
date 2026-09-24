import AssignedActivitiesCard from "@/components/dashboard/AssignedActivitiesCard";
import AIActivityCard from "@/components/dashboard/AIActivityCard";

export default function StudentActivities() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📚 Mis actividades</h1>
        <p className="text-muted-foreground">
          Actividades asignadas por tus docentes y recomendadas por la IA
        </p>
      </div>

      <AssignedActivitiesCard />
      <AIActivityCard />
    </div>
  );
}