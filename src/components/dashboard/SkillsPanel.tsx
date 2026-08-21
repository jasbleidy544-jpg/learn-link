import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Search, Lightbulb } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";

export default function SkillsPanel() {
  const { data } = useGamification();
  if (!data) return null;

  const skills = [
    { key: "critical", label: "Pensador Crítico", value: data.skill_critical, icon: Brain, color: "from-purple-400 to-purple-600" },
    { key: "researcher", label: "Investigador", value: data.skill_researcher, icon: Search, color: "from-blue-400 to-blue-600" },
    { key: "creative", label: "Creativo", value: data.skill_creative, icon: Lightbulb, color: "from-amber-400 to-pink-500" },
  ];

  return (
    <Card className="cloud-card animate-fade-in">
      <CardHeader>
        <CardTitle>Tus habilidades</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {skills.map((s) => {
          const pct = Math.min(100, s.value);
          const Icon = s.icon;
          return (
            <div key={s.key}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="flex items-center gap-2"><Icon className="w-4 h-4" /> {s.label}</span>
                <span className="text-muted-foreground">{s.value}</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${s.color} transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}