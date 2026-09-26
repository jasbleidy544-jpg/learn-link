import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const PURPLE = "#8b5cf6";
const PURPLE_DARK = "#6d28d9";

type Option = { value: string; label: string; emoji: string; subtext?: string };

/* ============================== OPCIONES ============================== */

const DESC_OPTS: Option[] = [
  { value: "estres", label: "Me estreso con el colegio", emoji: "😰" },
  { value: "mejorar", label: "Quiero mejorar mis notas", emoji: "📚" },
  { value: "perdido", label: "No sé por dónde empezar", emoji: "🤷" },
  { value: "no_perder", label: "No quiero perder el año", emoji: "💪" },
];

const NEED_OPTS: Option[] = [
  { value: "examen", label: "Tengo un examen próximamente", emoji: "🧨" },
  { value: "calif", label: "Quiero mejorar mis calificaciones", emoji: "📈" },
  { value: "no_entiendo", label: "No entiendo las materias", emoji: "🧠" },
  { value: "no_perder", label: "No quiero perder el año", emoji: "💪" },
];

const GRADE_OPTS: Option[] = [
  { value: "6", label: "Sexto grado", emoji: "📗" },
  { value: "7", label: "Séptimo grado", emoji: "📘" },
  { value: "8", label: "Octavo grado", emoji: "📙" },
  { value: "9", label: "Noveno grado", emoji: "📕" },
  { value: "10", label: "Décimo grado", emoji: "🟣" },
  { value: "11", label: "Undécimo grado", emoji: "🏆" },
];

const WORRY_OPTS: Option[] = [
  { value: "examenes", label: "Los exámenes me estresan mucho.", emoji: "🤯" },
  { value: "no_entiendo", label: "No entiendo las explicaciones en clase.", emoji: "😵" },
  { value: "tiempo", label: "Pierdo mucho tiempo y no aprendo nada.", emoji: "⏳" },
  { value: "empezar", label: "No sé por dónde empezar a estudiar.", emoji: "😶" },
  { value: "notas", label: "Quiero mejores notas pero no sé cómo.", emoji: "🏫" },
  { value: "solo", label: "Me siento solo/a en mi proceso.", emoji: "😞" },
];

// Emocional
const MOOD_OPTS: Option[] = [
  { value: "bien", label: "Bien, todo tranquilo", emoji: "😊" },
  { value: "regular", label: "Regular, hay días buenos y malos", emoji: "😐" },
  { value: "estresado", label: "Estresado/a o ansioso/a", emoji: "😰" },
  { value: "mal", label: "Muy mal, la paso difícil", emoji: "😔" },
  { value: "no_decir", label: "Prefiero no decirlo", emoji: "🙈" },
];

const SUPPORT_OPTS: Option[] = [
  { value: "si", label: "Sí, tengo personas de confianza", emoji: "👥" },
  { value: "aveces", label: "A veces", emoji: "🤝" },
  { value: "no", label: "No realmente", emoji: "🚪" },
  { value: "no_decir", label: "Prefiero no decirlo", emoji: "🙈" },
];

const FACTOR_OPTS: Option[] = [
  { value: "nada", label: "Nada, todo bien", emoji: "✅" },
  { value: "familia", label: "Situación familiar", emoji: "🏠" },
  { value: "economico", label: "Situación económica", emoji: "💸" },
  { value: "salud", label: "Salud (física o emocional)", emoji: "🩺" },
  { value: "otro", label: "Otro (lo escribo)", emoji: "✏️" },
];

// Social
const LIKE_SCHOOL_OPTS: Option[] = [
  { value: "me_gusta", label: "Me gusta estar ahí", emoji: "❤️" },
  { value: "regular", label: "Es regular", emoji: "😐" },
  { value: "no_ir", label: "Preferiría no ir", emoji: "😞" },
  { value: "depende", label: "Depende del día", emoji: "🤷" },
];

const FRIENDS_OPTS: Option[] = [
  { value: "varios", label: "Sí, varios amigos", emoji: "👥" },
  { value: "pocos", label: "Pocos pero buenos", emoji: "🤝" },
  { value: "casi_no", label: "Casi no tengo", emoji: "😶" },
  { value: "no", label: "No tengo", emoji: "🚪" },
];

const EXCLUSION_OPTS: Option[] = [
  { value: "nunca", label: "No, nunca", emoji: "🚫" },
  { value: "aveces", label: "A veces", emoji: "😐" },
  { value: "si", label: "Sí, ha pasado", emoji: "😢" },
  { value: "no_decir", label: "Prefiero no decirlo", emoji: "🙈" },
];

// Académico
const PERF_OPTS: Option[] = [
  { value: "muy_bien", label: "Muy bien, saco buenas notas", emoji: "🌟" },
  { value: "bien", label: "Bien, sin problema", emoji: "👍" },
  { value: "regular", label: "Regular", emoji: "😐" },
  { value: "dificil", label: "Me está costando", emoji: "😟" },
  { value: "muy_dificil", label: "Muy difícil, me está superando", emoji: "🔴" },
];

const STUDY_OPTS: Option[] = [
  { value: "rutina", label: "Tengo una rutina fija", emoji: "📅" },
  { value: "aveces", label: "Estudio cuando puedo", emoji: "🕐" },
  { value: "examenes", label: "Solo cuando hay examen", emoji: "📝" },
  { value: "nunca", label: "Casi no estudio en casa", emoji: "🚫" },
];

const DIFFICULTY_OPTS: Option[] = [
  { value: "entender", label: "Entender los temas", emoji: "🧩" },
  { value: "concentrar", label: "Concentrarme", emoji: "🎯" },
  { value: "memorizar", label: "Memorizar", emoji: "🧠" },
  { value: "organizar", label: "Organizarme", emoji: "🗂️" },
  { value: "mates", label: "Matemáticas", emoji: "🔢" },
  { value: "lectura", label: "Lectura y escritura", emoji: "📖" },
  { value: "otra", label: "Otra (la escribo)", emoji: "✏️" },
];

const REPEAT_OPTS: Option[] = [
  { value: "no", label: "No, nunca", emoji: "✅" },
  { value: "perdido", label: "He perdido materias", emoji: "📉" },
  { value: "una_vez", label: "He repetido un año", emoji: "🔁" },
  { value: "varias", label: "Más de una vez", emoji: "🔁" },
];

// Motivación
const REASON_OPTS: Option[] = [
  { value: "aprender", label: "Porque quiero aprender", emoji: "📚" },
  { value: "familia", label: "Por mi familia", emoji: "👨‍👩‍👧" },
  { value: "toca", label: "Porque toca", emoji: "😕" },
  { value: "meta", label: "Tengo una meta clara", emoji: "🎯" },
  { value: "nose", label: "No estoy muy seguro/a", emoji: "🤷" },
];

const INTEREST_OPTS: Option[] = [
  { value: "videojuegos", label: "Videojuegos", emoji: "🎮" },
  { value: "musica", label: "Música", emoji: "🎵" },
  { value: "deportes", label: "Deportes", emoji: "⚽" },
  { value: "peliculas", label: "Películas y series", emoji: "🎬" },
  { value: "tecnologia", label: "Tecnología", emoji: "💻" },
  { value: "lectura", label: "Lectura", emoji: "📖" },
  { value: "arte", label: "Arte y diseño", emoji: "🎨" },
  { value: "cocina", label: "Cocina", emoji: "🍳" },
  { value: "fotografia", label: "Fotografía", emoji: "📸" },
  { value: "animales", label: "Animales", emoji: "🐾" },
];

/* ============================== COMPONENTE ============================== */

const TOTAL_STEPS = 12;
const PROGRESS: Record<number, number> = {
  1: 0, 2: 10, 3: 20, 4: 30, 5: 40, 6: 50, 7: 60, 8: 70, 9: 80, 10: 90, 11: 95, 12: 100,
};

interface Respuestas {
  descripcion?: string;
  necesidad?: string;
  grado?: string;
  preocupacion?: string;
  emocional?: {
    sentimiento?: string;
    apoyo?: string;
    factor?: string;
    factor_detalle?: string;
  };
  social?: {
    gusto_colegio?: string;
    amigos?: string;
    exclusion?: string;
  };
  academico?: {
    desempeno?: string;
    metodo?: string;
    dificultad?: string;
    dificultad_detalle?: string;
    repeticion?: string;
  };
  motivacion?: {
    razon?: string;
    sueno?: string;
    que_cambia?: string;
  };
  intereses?: string[];
}

const DiagnosticChat = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"next" | "back">("next");
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [respuestas, setRespuestas] = useState<Respuestas>({});

  const studentFirstName =
    (profile as any)?.apodo_estudiante ||
    profile?.full_name?.split(" ")[0] ||
    "Estudiante";

  // Hidratar desde el perfil si existen respuestas previas
  useEffect(() => {
    if (!profile || hydrated) return;
    const p = profile as any;
    setRespuestas({
      descripcion: p.diagnostico_descripcion || undefined,
      necesidad: p.diagnostico_necesidad || undefined,
      grado: p.grado || p.grade || undefined,
      preocupacion: p.diagnostico_preocupacion || undefined,
      emocional: p.diagnostico_emocional || undefined,
      social: p.diagnostico_social || undefined,
      academico: p.diagnostico_academico || undefined,
      motivacion: p.diagnostico_motivacion || undefined,
      intereses: (() => {
        const raw = p.diagnostico_intereses;
        if (!raw) return undefined;
        if (Array.isArray(raw)) return raw;
        try { return JSON.parse(raw); } catch { return undefined; }
      })(),
    });
    const saved = p.onboarding_paso_actual as number | undefined;
    if (saved && saved >= 1 && saved <= TOTAL_STEPS) setStep(saved);
    setHydrated(true);
  }, [profile, hydrated]);

  const persist = async (data: Record<string, any>) => {
    if (!user) return;
    await updateProfile(data);
  };

  const goTo = (next: number) => {
    setDirection(next > step ? "next" : "back");
    setStep(next);
    persist({ onboarding_paso_actual: next });
  };

  const updateRespuestas = (partial: Partial<Respuestas>) => {
    setRespuestas((prev) => ({ ...prev, ...partial }));
  };

  const finalize = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Guardar todo en profiles antes de llamar a la IA
      await updateProfile({
        diagnostico_descripcion: respuestas.descripcion || null,
        diagnostico_necesidad: respuestas.necesidad || null,
        diagnostico_preocupacion: respuestas.preocupacion || null,
        diagnostico_intereses: JSON.stringify(respuestas.intereses || []),
        diagnostico_emocional: respuestas.emocional || {},
        diagnostico_social: respuestas.social || {},
        diagnostico_academico: respuestas.academico || {},
        diagnostico_motivacion: respuestas.motivacion || {},
        grado: respuestas.grado || null,
        grade: respuestas.grado || null,
      });

      // Llamar a la Edge Function con las respuestas estructuradas
      const { data, error } = await supabase.functions.invoke("diagnostic-finalize", {
        body: { respuestas },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Marcar como completado
      await updateProfile({
        diagnostico_completado: true,
        diagnostico_ultima_fecha: new Date().toISOString(),
        onboarding_completado: true,
        onboarding_paso_actual: TOTAL_STEPS,
      });

      navigate("/student", { replace: true });
    } catch (err) {
      console.error("Error finalizando diagnóstico:", err);
      // Aun si la IA falla, marcamos completado y enviamos a /student
      await updateProfile({
        diagnostico_completado: true,
        onboarding_completado: true,
        onboarding_paso_actual: TOTAL_STEPS,
      });
      navigate("/student", { replace: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col overflow-hidden">
      {step > 1 && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-30">
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{ width: `${PROGRESS[step] || 0}%`, background: `linear-gradient(90deg, ${PURPLE}, #a78bfa)` }}
          />
        </div>
      )}

      {step > 1 && step !== 11 && step !== 12 && (
        <button
          aria-label="Volver"
          onClick={() => goTo(Math.max(1, step - 1))}
          className="fixed top-4 left-4 z-30 p-2 rounded-full hover:bg-white/10 transition"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
      )}

      <div
        key={step}
        className={cn(
          "flex-1 flex flex-col",
          direction === "next" ? "animate-[slideInRight_0.35s_ease-out]" : "animate-[slideInLeft_0.35s_ease-out]"
        )}
      >
        {step === 1 && <Step1 onNext={() => goTo(2)} />}
        {step === 2 && (
          <StepSingleSelect
            subtitle="Comencemos 🚀"
            title="¿Cuál de estas opciones te describe mejor?"
            options={DESC_OPTS}
            grid
            onSelect={async (v) => { updateRespuestas({ descripcion: v }); await persist({ diagnostico_descripcion: v }); goTo(3); }}
          />
        )}
        {step === 3 && <Step3 onNext={() => goTo(4)} />}

        {/* BLOQUE EMOCIONAL */}
        {step === 4 && (
          <StepSingleSelect
            subtitle="Antes de lo académico, lo importante eres tú 💜"
            title="¿Cómo te has sentido últimamente?"
            options={MOOD_OPTS}
            onSelect={(v) => {
              updateRespuestas({ emocional: { ...respuestas.emocional, sentimiento: v } });
              goTo(5);
            }}
          />
        )}
        {step === 5 && (
          <StepSingleSelect
            subtitle="Gracias por contarme 🤗"
            title="¿Tienes a alguien con quien hablar cuando algo te preocupa?"
            options={SUPPORT_OPTS}
            onSelect={(v) => {
              updateRespuestas({ emocional: { ...respuestas.emocional, apoyo: v } });
              goTo(6);
            }}
          />
        )}
        {step === 6 && (
          <StepSingleSelect
            subtitle="Lo que sea, aquí estoy para escucharte 🫂"
            title="¿Algo fuera del colegio te está afectando?"
            options={FACTOR_OPTS}
            onSelect={(v) => {
              updateRespuestas({ emocional: { ...respuestas.emocional, factor: v } });
              if (v === "otro") return; // paso especial
              persist({ diagnostico_emocional: { ...respuestas.emocional, factor: v } });
              goTo(7);
            }}
            specialTextStep={{
              trigger: "otro",
              onSave: async (text) => {
                const next = { ...respuestas.emocional, factor: "otro", factor_detalle: text };
                updateRespuestas({ emocional: next });
                await persist({ diagnostico_emocional: next });
                goTo(7);
              },
              placeholder: "Cuéntame brevemente…",
            }}
          />
        )}

        {/* BLOQUE SOCIAL */}
        {step === 7 && (
          <StepSingleSelect
            subtitle="Hablemos del cole 🏫"
            title="¿Te gusta ir al colegio?"
            options={LIKE_SCHOOL_OPTS}
            onSelect={(v) => {
              updateRespuestas({ social: { ...respuestas.social, gusto_colegio: v } });
              goTo(8);
            }}
          />
        )}
        {step === 8 && (
          <StepSingleSelect
            subtitle="Tus amistades importan 💜"
            title="¿Tienes amigos en el colegio?"
            options={FRIENDS_OPTS}
            onSelect={(v) => {
              updateRespuestas({ social: { ...respuestas.social, amigos: v } });
              goTo(9);
            }}
          />
        )}
        {step === 9 && (
          <StepSingleSelect
            subtitle="Gracias por confiar en mí 🙏"
            title="¿Te has sentido excluido o molestado?"
            options={EXCLUSION_OPTS}
            onSelect={(v) => {
              updateRespuestas({ social: { ...respuestas.social, exclusion: v } });
              persist({ diagnostico_social: { ...respuestas.social, exclusion: v } });
              goTo(10);
            }}
          />
        )}

        {/* BLOQUE ACADÉMICO */}
        {step === 10 && (
          <StepSingleSelect
            subtitle="Ahora hablemos de tus clases 📚"
            title="¿Cómo te va académicamente?"
            options={PERF_OPTS}
            onSelect={(v) => {
              updateRespuestas({ academico: { ...respuestas.academico, desempeno: v } });
              goTo(11);
            }}
          />
        )}
        {step === 11 && (
          <StepMultiStage
            steps={[
              {
                subtitle: "Tus hábitos importan 🕐",
                title: "¿Cómo estudias normalmente?",
                options: STUDY_OPTS,
                field: "metodo",
              },
              {
                subtitle: "¿Qué es lo que más se te dificulta?",
                title: "Elige tu mayor dificultad 🧩",
                options: DIFFICULTY_OPTS,
                field: "dificultad",
                allowText: "otra",
              },
              {
                subtitle: "Últimas preguntas del bloque 📝",
                title: "¿Has repetido o perdido materias?",
                options: REPEAT_OPTS,
                field: "repeticion",
              },
            ]}
            onComplete={async (values) => {
              const next = { ...respuestas.academico, ...values };
              updateRespuestas({ academico: next });
              await persist({ diagnostico_academico: next });
              goTo(12);
            }}
          />
        )}

        {/* MOTIVACIÓN Y FUTURO */}
        {step === 12 && (
          <StepMultiStage
            steps={[
              {
                subtitle: "Casi terminamos ✨",
                title: "¿Por qué vas al colegio?",
                options: REASON_OPTS,
                field: "razon",
              },
              {
                subtitle: "Cuéntame tus sueños 🌟",
                title: "¿Tienes alguna meta o sueño?",
                freeText: true,
                field: "sueno",
                placeholder: "Escríbelo aquí…",
              },
              {
                subtitle: "Tu opinión vale 💜",
                title: "¿Qué cambiaría tu motivación en el colegio?",
                freeText: true,
                field: "que_cambia",
                placeholder: "Escríbelo aquí…",
              },
              {
                subtitle: "Última parada 🎨",
                title: "¿Cuáles son tus intereses?",
                options: INTEREST_OPTS,
                multiSelect: true,
                field: "intereses",
              },
            ]}
            onComplete={async (values) => {
              const motiv = {
                razon: values.razon as string,
                sueno: values.sueno as string,
                que_cambia: values.que_cambia as string,
              };
              const intereses = (values.intereses as string[]) || [];
              updateRespuestas({ motivacion: motiv, intereses });
              await persist({
                diagnostico_motivacion: motiv,
                diagnostico_intereses: JSON.stringify(intereses),
              });
              await finalize();
            }}
            isFinal
          />
        )}
      </div>

      <style>{`
        @keyframes slideInRight { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInLeft  { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
};

export default DiagnosticChat;

/* ============================== COMPONENTES ============================== */

const PrimaryButton = ({
  children, onClick, disabled,
}: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
    style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})` }}
  >
    {children}
  </button>
);

const OptionCard = ({
  opt, selected, onClick, square,
}: { opt: Option; selected: boolean; onClick: () => void; square?: boolean }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full text-left rounded-2xl p-4 transition-all border-2 flex gap-3 items-center",
      square ? "flex-col items-center justify-center text-center min-h-[120px]" : "",
      selected
        ? "border-violet-400 bg-violet-500/10 shadow-[0_0_0_4px_rgba(139,92,246,0.15)]"
        : "border-white/5 bg-[#1a1a1a] hover:border-white/20"
    )}
  >
    <div
      className={cn(
        "rounded-full flex items-center justify-center shrink-0 bg-black/60",
        square ? "w-12 h-12 text-2xl" : "w-12 h-12 text-2xl"
      )}
    >
      <span>{opt.emoji}</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className={cn("text-white font-semibold", square ? "text-sm leading-tight" : "text-[15px]")}>
        {opt.label}
      </p>
      {opt.subtext && !square && (
        <p className="text-xs text-gray-400 mt-0.5">{opt.subtext}</p>
      )}
    </div>
    {selected && !square && <Check className="w-5 h-5 text-violet-400 shrink-0" />}
    {selected && square && (
      <div className="absolute top-2 right-2">
        <Check className="w-5 h-5 text-violet-400" />
      </div>
    )}
  </button>
);

const Header = ({ subtitle, title }: { subtitle: string; title: string }) => (
  <div className="px-6 pt-16 pb-6 text-center">
    <p className="text-sm text-gray-400 mb-2">{subtitle}</p>
    <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{title}</h1>
  </div>
);

/* ============================== STEPS ============================== */

const Step1 = ({ onNext }: { onNext: () => void }) => {
  const [screen, setScreen] = useState<"A" | "B">("A");
  useEffect(() => {
    if (screen === "A") {
      const t = setTimeout(() => setScreen("B"), 1500);
      return () => clearTimeout(t);
    }
  }, [screen]);

  const aItems = ["No entiendo nada", "¿Por dónde empiezo?", "Ya es muy tarde"];
  const bItems = ["Tengo un plan claro ✓", "Entiendo los temas ✓", "Me siento preparado ✓"];

  return (
    <div className="flex-1 flex flex-col px-6 pt-16 pb-8 max-w-md mx-auto w-full">
      <div key={screen} className="flex-1 flex flex-col animate-[slideInRight_0.4s_ease-out]">
        <p className="text-sm text-gray-400 text-center mb-2">
          {screen === "A" ? "¿Te suena familiar? 🤔" : "Imagínate ahora... ✨"}
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-8">
          La noche antes de un parcial...
        </h1>
        <div className="text-7xl text-center mb-3">{screen === "A" ? "🤯" : "😌"}</div>
        <p className="text-center text-gray-400 mb-6">
          {screen === "A" ? "Sin LearnLink" : "Con LearnLink"}
        </p>
        <div className="space-y-3 mt-2">
          {(screen === "A" ? aItems : bItems).map((t) => (
            <div
              key={t}
              className={cn(
                "w-full rounded-2xl p-4 border-2",
                screen === "A"
                  ? "bg-[#1a1a1a] border-white/5 text-white"
                  : "bg-emerald-900/30 border-emerald-500/30 text-emerald-100"
              )}
            >
              <p className="font-medium text-[15px]">{t}</p>
            </div>
          ))}
        </div>
      </div>
      {screen === "B" && (
        <div className="pt-6 animate-[slideInRight_0.4s_ease-out]">
          <PrimaryButton onClick={onNext}>¡Quiero esto! 🚀</PrimaryButton>
        </div>
      )}
    </div>
  );
};

const Step3 = ({ onNext }: { onNext: () => void }) => {
  const fired = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => { if (!fired.current) { fired.current = true; onNext(); } }, 3000);
    return () => clearTimeout(t);
  }, [onNext]);

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "radial-gradient(ellipse at center, rgba(109,40,217,0.35), #000 70%)" }}
    >
      <div className="max-w-md mx-auto w-full">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 leading-snug">
          15 minutos al día son suficientes<br />para cambiar tu historia. 💜
        </h2>
        <p className="text-gray-400 mb-10 text-sm">
          El 89% de estudiantes que usan LearnLink mejoran en menos de 2 semanas.
        </p>
        <PrimaryButton onClick={() => { if (!fired.current) { fired.current = true; onNext(); } }}>
          Continuar
        </PrimaryButton>
      </div>
    </div>
  );
};

const StepSingleSelect = ({
  subtitle, title, options, onSelect, grid, specialTextStep,
}: {
  subtitle: string;
  title: string;
  options: Option[];
  onSelect: (value: string) => void;
  grid?: boolean;
  specialTextStep?: {
    trigger: string;
    onSave: (text: string) => void;
    placeholder: string;
  };
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [showText, setShowText] = useState(false);
  const [textValue, setTextValue] = useState("");

  const handlePick = (v: string) => {
    setSelected(v);
    if (specialTextStep && v === specialTextStep.trigger) {
      setShowText(true);
      return;
    }
    setTimeout(() => onSelect(v), 220);
  };

  return (
    <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
      <Header subtitle={subtitle} title={title} />
      <div className="flex-1 px-6 pb-32">
        {grid ? (
          <div className="grid grid-cols-2 gap-3">
            {options.map((o) => (
              <div key={o.value} className="relative">
                <OptionCard opt={o} selected={selected === o.value} onClick={() => handlePick(o.value)} square />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {options.map((o) => (
              <OptionCard key={o.value} opt={o} selected={selected === o.value} onClick={() => handlePick(o.value)} />
            ))}
          </div>
        )}

        {showText && specialTextStep && (
          <div className="mt-4 space-y-3">
            <textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder={specialTextStep.placeholder}
              className="w-full rounded-2xl p-4 bg-[#1a1a1a] border-2 border-white/5 text-white placeholder:text-gray-500 focus:border-violet-400 outline-none resize-none h-24"
            />
            <PrimaryButton
              onClick={() => textValue.trim() && specialTextStep.onSave(textValue.trim())}
              disabled={!textValue.trim()}
            >
              Continuar
            </PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
};

const StepMultiStage = ({
  steps, onComplete, isFinal,
}: {
  steps: {
    subtitle: string;
    title: string;
    options?: Option[];
    freeText?: boolean;
    multiSelect?: boolean;
    field: string;
    placeholder?: string;
    allowText?: string;
  }[];
  onComplete: (values: Record<string, any>) => void | Promise<void>;
  isFinal?: boolean;
}) => {
  const [idx, setIdx] = useState(0);
  const [values, setValues] = useState<Record<string, any>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [multi, setMulti] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [subText, setSubText] = useState("");
  const [loading, setLoading] = useState(false);

  const current = steps[idx];

  const next = async () => {
    const newValues = { ...values };
    if (current.multiSelect) {
      newValues[current.field] = multi;
    } else if (current.freeText) {
      newValues[current.field] = text.trim();
    } else {
      newValues[current.field] = selected;
      if (current.allowText && selected === current.allowText && subText.trim()) {
        newValues[`${current.field}_detalle`] = subText.trim();
      }
    }
    setValues(newValues);

    if (idx < steps.length - 1) {
      setIdx(idx + 1);
      setSelected(null);
      setMulti([]);
      setText("");
      setSubText("");
    } else {
      setLoading(true);
      await onComplete(newValues);
      setLoading(false);
    }
  };

  const canContinue = (() => {
    if (current.multiSelect) return multi.length > 0;
    if (current.freeText) return text.trim().length > 0;
    return !!selected;
  })();

  return (
    <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
      <Header subtitle={current.subtitle} title={current.title} />
      <div className="flex-1 px-6 pb-32">
        {current.options && current.multiSelect && (
          <div className="grid grid-cols-2 gap-3">
            {current.options.map((o) => {
              const isSelected = multi.includes(o.value);
              return (
                <div key={o.value} className="relative">
                  <OptionCard
                    opt={o}
                    selected={isSelected}
                    onClick={() =>
                      setMulti((p) => (p.includes(o.value) ? p.filter((x) => x !== o.value) : [...p, o.value]))
                    }
                    square
                  />
                </div>
              );
            })}
          </div>
        )}

        {current.options && !current.multiSelect && (
          <div className="space-y-3">
            {current.options.map((o) => (
              <OptionCard
                key={o.value}
                opt={o}
                selected={selected === o.value}
                onClick={() => setSelected(o.value)}
              />
            ))}
          </div>
        )}

        {current.freeText && (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={current.placeholder || "Escribe aquí…"}
            className="w-full rounded-2xl p-4 bg-[#1a1a1a] border-2 border-white/5 text-white placeholder:text-gray-500 focus:border-violet-400 outline-none resize-none h-32"
          />
        )}

        {current.allowText && selected === current.allowText && (
          <textarea
            value={subText}
            onChange={(e) => setSubText(e.target.value)}
            placeholder="Escríbelo aquí…"
            className="w-full mt-3 rounded-2xl p-4 bg-[#1a1a1a] border-2 border-white/5 text-white placeholder:text-gray-500 focus:border-violet-400 outline-none resize-none h-20"
          />
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black to-transparent">
        <div className="max-w-md mx-auto">
          <PrimaryButton onClick={next} disabled={!canContinue || loading}>
            {loading ? "Analizando tus respuestas…" : idx === steps.length - 1 ? "Finalizar" : "Continuar"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};