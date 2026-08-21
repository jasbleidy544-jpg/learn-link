import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Brain,
  Heart,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  CheckCircle,
} from "lucide-react";

interface Recommendation {
  id: string;
  type: string;
  title: string;
  content: string;
  priority: string;
  is_read: boolean;
  generated_at: string;
}

interface Metrics {
  avgGrade: string;
  attendanceRate: string;
  recentInteractions: number;
  totalInteractions: number;
}

const RecommendationsPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (user) fetchRecommendations();
  }, [user]);

  const fetchRecommendations = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("ai_recommendations")
      .select("*")
      .eq("student_id", user!.id)
      .order("generated_at", { ascending: false })
      .limit(10);

    if (!error && data) setRecommendations(data as Recommendation[]);
    setLoading(false);
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-student`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (resp.status === 429) {
        toast({ title: "Límite alcanzado", description: "Intenta de nuevo más tarde.", variant: "destructive" });
        return;
      }
      if (resp.status === 402) {
        toast({ title: "Créditos insuficientes", description: "Contacta al administrador.", variant: "destructive" });
        return;
      }
      if (!resp.ok) throw new Error("Error en el análisis");

      const result = await resp.json();
      setMetrics(result.metrics);
      await fetchRecommendations();
      toast({ title: "Análisis completado", description: "Se generaron nuevas recomendaciones personalizadas." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "No se pudo completar el análisis.", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const markAsRead = async (id: string) => {
    await (supabase as any).from("ai_recommendations").update({ is_read: true }).eq("id", id);
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_read: true } : r))
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "academic": return <Brain className="w-5 h-5" />;
      case "motivational": return <Heart className="w-5 h-5" />;
      case "improvement": return <TrendingUp className="w-5 h-5" />;
      case "risk_alert": return <AlertTriangle className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "academic": return "Académica";
      case "motivational": return "Motivacional";
      case "improvement": return "Mejora";
      case "risk_alert": return "Alerta";
      default: return type;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "border-destructive/30 text-destructive";
      case "high": return "border-orange-500/30 text-orange-400";
      case "medium": return "border-yellow-500/30 text-yellow-400";
      case "low": return "border-green-500/30 text-green-400";
      default: return "text-muted-foreground";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "academic": return "text-accent";
      case "motivational": return "text-primary";
      case "improvement": return "text-accent";
      case "risk_alert": return "text-destructive";
      default: return "text-primary";
    }
  };

  const unreadCount = recommendations.filter((r) => !r.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header with analyze button */}
      <Card className="cloud-card glow-effect border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Sistema de Acompañamiento IA</h3>
                <p className="text-sm text-muted-foreground">
                  Análisis personalizado de tu rendimiento académico y emocional
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  {unreadCount} nuevas
                </Badge>
              )}
              <Button onClick={runAnalysis} disabled={analyzing} className="glow-effect">
                <RefreshCw className={`w-4 h-4 mr-2 ${analyzing ? "animate-spin" : ""}`} />
                {analyzing ? "Analizando..." : "Analizar"}
              </Button>
            </div>
          </div>

          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <div className="text-xl font-bold text-primary">{metrics.avgGrade}</div>
                <p className="text-xs text-muted-foreground">Promedio</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <div className="text-xl font-bold text-accent">{metrics.attendanceRate}%</div>
                <p className="text-xs text-muted-foreground">Asistencia</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <div className="text-xl font-bold text-accent">{metrics.recentInteractions}</div>
                <p className="text-xs text-muted-foreground">Interacciones (7d)</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <div className="text-xl font-bold text-muted-foreground">{metrics.totalInteractions}</div>
                <p className="text-xs text-muted-foreground">Total interacciones</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Las recomendaciones generadas se muestran dentro de la campana de notificaciones */}
      {!loading && unreadCount > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Tienes {unreadCount} recomendación(es) nueva(s). Ábrelas en el ícono de notificaciones.
        </p>
      )}
    </div>
  );
};

export default RecommendationsPanel;
