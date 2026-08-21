import { Card } from "@/components/ui/card";
import { Users, GraduationCap, AlertTriangle, AlertOctagon, CheckCircle2, Activity } from "lucide-react";

interface Props {
  totalStudents: number;
  totalTeachers: number;
  avgRiskScore: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}

const cardCls = "cloud-card text-center p-4";

export default function InstitutionSummary({ totalStudents, totalTeachers, avgRiskScore, highRisk, mediumRisk, lowRisk }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      <Card className={cardCls}>
        <Users className="w-6 h-6 text-primary mx-auto mb-2" />
        <div className="text-2xl font-bold">{totalStudents}</div>
        <p className="text-xs text-muted-foreground">Estudiantes</p>
      </Card>
      <Card className={cardCls}>
        <GraduationCap className="w-6 h-6 text-blue-400 mx-auto mb-2" />
        <div className="text-2xl font-bold">{totalTeachers}</div>
        <p className="text-xs text-muted-foreground">Docentes voluntarios</p>
      </Card>
      <Card className={cardCls}>
        <Activity className="w-6 h-6 text-accent mx-auto mb-2" />
        <div className="text-2xl font-bold">{avgRiskScore}%</div>
        <p className="text-xs text-muted-foreground">Riesgo promedio (IA)</p>
      </Card>
      <Card className={`${cardCls} border-red-500/40`}>
        <AlertOctagon className="w-6 h-6 text-red-400 mx-auto mb-2" />
        <div className="text-2xl font-bold text-red-400">{highRisk}</div>
        <p className="text-xs text-muted-foreground">Riesgo alto</p>
      </Card>
      <Card className={`${cardCls} border-orange-500/40`}>
        <AlertTriangle className="w-6 h-6 text-orange-400 mx-auto mb-2" />
        <div className="text-2xl font-bold text-orange-400">{mediumRisk}</div>
        <p className="text-xs text-muted-foreground">Riesgo medio</p>
      </Card>
      <Card className={`${cardCls} border-green-500/40`}>
        <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-2" />
        <div className="text-2xl font-bold text-green-400">{lowRisk}</div>
        <p className="text-xs text-muted-foreground">Riesgo bajo</p>
      </Card>
    </div>
  );
}