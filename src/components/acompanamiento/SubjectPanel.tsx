import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DiagnosticWizard from "./DiagnosticWizard";
import JourneyPath from "./JourneyPath";
import LevelDialog, { Level } from "./LevelDialog";
import LevelProgressBar from "./LevelProgressBar";
import LevelUpCelebration from "./LevelUpCelebration";
import TutorChatFAB from "./TutorChatFAB";

type Journey = {
  id: string;
  subject: string;
  nivel: string;
  temas_fuertes: string[];
  temas_a_reforzar: string[];
  perfil: string;
  mensaje_motivacional: string;
  camino: Level[];
  current_level: number;
};

export default function SubjectPanel({ subject }: { subject: string }) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [startDiag, setStartDiag] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [livePct, setLivePct] = useState(0);
  const [celebration, setCelebration] = useState<{ levelName: string; mensaje: string } | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from("subject_journeys")
      .select("*")
      .eq("user_id", user.id).eq("subject", subject).maybeSingle();
    setJourney(data || null);
    setLoading(false);
  }, [user, subject]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!journey && !startDiag) {
    return (
      <Card className="cloud-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Comienza tu camino en {subject}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Haremos un diagnóstico rápido (cuestionario + ejercicios) para construir un camino personalizado para ti.
          </p>
          <Button size="lg" onClick={() => setStartDiag(true)}>Iniciar Diagnóstico</Button>
        </CardContent>
      </Card>
    );
  }

  if (!journey && startDiag) {
    return (
      <DiagnosticWizard
        subject={subject}
        defaultGrade={profile?.grade}
        onComplete={() => { setStartDiag(false); load(); }}
      />
    );
  }

  if (!journey) return null;
  const nextLevelName = journey.camino[journey.current_level]?.nombre;

  return (
    <div className="space-y-6 relative">
      <Card className="cloud-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Tu perfil en {subject}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LevelProgressBar currentLevel={journey.current_level} levelProgressPct={livePct} />
          {journey.perfil && <p className="text-sm">{journey.perfil}</p>}
          {journey.mensaje_motivacional && (
            <p className="text-sm italic text-primary">"{journey.mensaje_motivacional}"</p>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/10">
              <p className="text-xs font-semibold text-green-400 flex items-center gap-1 mb-2">
                <TrendingUp className="w-3 h-3" /> Temas fuertes
              </p>
              <ul className="text-sm space-y-1">
                {journey.temas_fuertes.map((t, i) => <li key={i}>• {t}</li>)}
              </ul>
            </div>
            <div className="p-3 rounded-lg border border-orange-500/30 bg-orange-500/10">
              <p className="text-xs font-semibold text-orange-400 flex items-center gap-1 mb-2">
                <AlertTriangle className="w-3 h-3" /> Temas a reforzar
              </p>
              <ul className="text-sm space-y-1">
                {journey.temas_a_reforzar.map((t, i) => <li key={i}>• {t}</li>)}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="cloud-card">
        <CardHeader><CardTitle>Tu camino de progreso</CardTitle></CardHeader>
        <CardContent>
          <JourneyPath
            camino={journey.camino}
            currentLevel={journey.current_level}
            onPick={(i) => setSelectedLevel(i)}
          />
        </CardContent>
      </Card>

      <LevelDialog
        open={selectedLevel !== null}
        onOpenChange={(v) => { if (!v) setSelectedLevel(null); }}
        level={selectedLevel !== null ? journey.camino[selectedLevel] : null}
        levelIndex={selectedLevel ?? 0}
        subject={subject}
        userId={user!.id}
        nextLevelName={nextLevelName}
        onProgress={(pct) => setLivePct(pct)}
        onCompleted={(passed, levelName, mensaje) => {
          setSelectedLevel(null);
          setLivePct(0);
          if (passed) setCelebration({ levelName, mensaje });
          load();
        }}
      />

      <LevelUpCelebration
        open={!!celebration}
        onClose={() => setCelebration(null)}
        levelName={celebration?.levelName || ""}
        mensaje={celebration?.mensaje || ""}
      />

      <TutorChatFAB subject={subject} />
    </div>
  );
}