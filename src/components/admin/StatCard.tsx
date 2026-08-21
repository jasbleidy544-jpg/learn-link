import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface Props { label: string; value: string | number; icon: LucideIcon; accent?: string; }

export default function StatCard({ label, value, icon: Icon, accent = "text-primary" }: Props) {
  return (
    <Card className="cloud-card">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-primary/10 ${accent}`}>
          <Icon className="w-6 h-6" />
        </div>
      </CardContent>
    </Card>
  );
}