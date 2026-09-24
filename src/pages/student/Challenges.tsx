import DailyChallenges from "@/components/dashboard/DailyChallenges";

export default function StudentChallenges() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🎯 Retos del día</h1>
        <p className="text-muted-foreground">
          Completa retos diarios y gana XP extra para subir de nivel
        </p>
      </div>

      <DailyChallenges />
    </div>
  );
}