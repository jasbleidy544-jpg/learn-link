import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const PURPLE = "#8b5cf6";
const PURPLE_DARK = "#6d28d9";

type Option = { value: string; label: string; emoji: string; subtext?: string };

const DESC_OPTS: Option[] = [
  { value: "estres", label: "Me estreso con el colegio", emoji: "😰" },
  { value: "mejorar", label: "Quiero mejorar mis notas", emoji: "📚" },
  { value: "perdido", label: "No sé por dónde empezar", emoji: "🤷" },
  { value: "no_perder", label: "No quiero perder el año", emoji: "💪" },
];

const NEED_OPTS: Option[] = [
  { value: "examen", label: "Tengo un examen próximamente", emoji: "🧨", subtext: "Te damos un plan rápido y sin estrés." },
  { value: "calif", label: "Quiero mejorar mis calificaciones", emoji: "📈", subtext: "Aprende más inteligente, no más duro." },
  { value: "no_entiendo", label: "No entiendo las materias", emoji: "🧠", subtext: "Explicaciones simples a tu ritmo." },
  { value: "no_perder", label: "No quiero perder el año", emoji: "💪", subtext: "Te acompañamos paso a paso." },
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

const TOTAL_STEPS = 9;
const PROGRESS: Record<number, number> = { 1: 0, 2: 14, 3: 28, 4: 42, 5: 57, 6: 71, 7: 85, 8: 100, 9: 100 };

const DiagnosticChat = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"next" | "back">("next");
  const [hydrated, setHydrated] = useState(false);

  const studentFirstName =
    profile?.apodo_estudiante || profile?.full_name?.split(" ")[0] || "Estudiante";

  // Resume from saved step
  useEffect(() => {
    if (!profile || hydrated) return;
    const saved = (profile as any).onboarding_paso_actual as number | undefined;
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

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col overflow-hidden">
      {/* Progress */}
      {step > 1 && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-30">
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{ width: `${PROGRESS[step]}%`, background: `linear-gradient(90deg, ${PURPLE}, #a78bfa)` }}
          />
        </div>
      )}

      {/* Back arrow */}
      {step > 1 && step !== 8 && step !== 9 && (
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
            onSelect={async (v) => { await persist({ diagnostico_descripcion: v }); goTo(3); }}
          />
        )}
        {step === 3 && <Step3 onNext={() => goTo(4)} />}
        {step === 4 && (
          <StepSingleSelect
            subtitle="Para saber cómo ayudarte 👇"
            title="¿Qué necesitas más ahora mismo?"
            options={NEED_OPTS}
            onSelect={async (v) => { await persist({ diagnostico_necesidad: v }); goTo(5); }}
          />
        )}
        {step === 5 && (
          <StepSingleSelect
            subtitle="Personalizo tu plan de estudios... 🎯"
            title="¿En qué grado estás?"
            options={GRADE_OPTS}
            onSelect={async (v) => {
              await persist({ grado: v, grade: v });
              goTo(6);
            }}
          />
        )}
        {step === 6 && (
          <StepSingleSelect
            subtitle="Entiendo, cuéntame... 🫧"
            title="¿Qué es lo que más te preocupa del colegio?"
            options={WORRY_OPTS}
            requireContinue
            continueLabel="Continuar"
            onSelect={async (v) => { await persist({ diagnostico_preocupacion: v }); goTo(7); }}
          />
        )}
        {step === 7 && (
          <Step7
            onContinue={async (vals) => { await persist({ diagnostico_intereses: vals }); goTo(8); }}
            onSkip={() => goTo(8)}
          />
        )}
        {step === 8 && <Step8 onDone={() => goTo(9)} />}
        {step === 9 && (
          <Step9
            name={studentFirstName}
            minutes={15}
            onStart={async () => {
              await persist({
                onboarding_completado: true,
                diagnostico_completado: true,
                onboarding_paso_actual: TOTAL_STEPS,
              });
              navigate("/student-dashboard", { replace: true });
            }}
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

/* ---------------- Shared Building Blocks ---------------- */

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
      square ? "flex-col items-center justify-center text-center min-h-[140px]" : "",
      selected
        ? "border-violet-400 bg-violet-500/10 shadow-[0_0_0_4px_rgba(139,92,246,0.15)]"
        : "border-white/5 bg-[#1a1a1a] hover:border-white/20"
    )}
  >
    <div
      className={cn(
        "rounded-full flex items-center justify-center shrink-0 bg-black/60",
        square ? "w-14 h-14 text-3xl" : "w-12 h-12 text-2xl"
      )}
    >
      <span>{opt.emoji}</span>
    </div>
    <div className={cn("flex-1 min-w-0", square ? "" : "")}>
      <p className={cn("text-white font-semibold", square ? "text-sm leading-tight" : "text-[15px]")}>
        {opt.label}
      </p>
      {opt.subtext && !square && (
        <p className="text-xs text-gray-400 mt-0.5">{opt.subtext}</p>
      )}
    </div>
    {selected && !square && (
      <Check className="w-5 h-5 text-violet-400 shrink-0" />
    )}
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

/* ---------------- Step 1: Emotional hook ---------------- */

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

/* ---------------- Generic single-select step ---------------- */

const StepSingleSelect = ({
  subtitle, title, options, onSelect, grid, requireContinue, continueLabel,
}: {
  subtitle: string;
  title: string;
  options: Option[];
  onSelect: (value: string) => void;
  grid?: boolean;
  requireContinue?: boolean;
  continueLabel?: string;
}) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handlePick = (v: string) => {
    setSelected(v);
    if (!requireContinue) {
      setTimeout(() => onSelect(v), 220);
    }
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
      </div>
      {requireContinue && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black to-transparent">
          <div className="max-w-md mx-auto">
            <PrimaryButton onClick={() => selected && onSelect(selected)} disabled={!selected}>
              {continueLabel || "Continuar"}
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------------- Step 3: Motivational ---------------- */

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

/* ---------------- Step 7: Interests multi-select ---------------- */

const Step7 = ({
  onContinue, onSkip,
}: { onContinue: (values: string[]) => void; onSkip: () => void }) => {
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (v: string) =>
    setPicked((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  return (
    <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
      <Header subtitle="Usaremos esto para que estudiar sea divertido ✨" title="¿Cuáles son tus intereses?" />
      <div className="flex-1 px-6 pb-32">
        <div className="grid grid-cols-2 gap-3">
          {INTEREST_OPTS.map((o) => (
            <OptionCard key={o.value} opt={o} selected={picked.includes(o.value)} onClick={() => toggle(o.value)} square />
          ))}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black to-transparent">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={onSkip} className="text-gray-400 px-4 py-3 text-sm font-medium">
            Omitir
          </button>
          <div className="flex-1">
            <PrimaryButton onClick={() => onContinue(picked)} disabled={picked.length === 0}>
              Continuar
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Step 8: Loading ---------------- */

const Step8 = ({ onDone }: { onDone: () => void }) => {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const total = 3000;
    const id = setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - start) / total) * 100));
      setPct(p);
      if (p >= 100) {
        clearInterval(id);
        setTimeout(onDone, 250);
      }
    }, 40);
    return () => clearInterval(id);
  }, [onDone]);

  const phase =
    pct < 31 ? "Analizando tu perfil..."
      : pct < 61 ? "Preparando tu plan..."
      : pct < 91 ? "Personalizando tu experiencia..."
      : "¡Listo!";

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "linear-gradient(180deg, #000 0%, #1a0a2e 100%)" }}
    >
      <p className="text-white text-lg md:text-xl font-semibold mb-12 max-w-sm">
        Estamos creando tu experiencia<br />personalizada en LearnLink... 💜
      </p>
      <div className="relative w-44 h-44 mb-8">
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-60"
          style={{ background: `radial-gradient(circle, ${PURPLE}, transparent 70%)` }}
        />
        <div
          className="relative w-full h-full rounded-full flex items-center justify-center"
          style={{ background: `conic-gradient(${PURPLE} ${pct * 3.6}deg, rgba(255,255,255,0.06) 0deg)` }}
        >
          <div className="w-[88%] h-[88%] rounded-full bg-black flex items-center justify-center">
            <span className="text-4xl font-bold text-white">{pct}%</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-400 animate-pulse">{phase}</p>
    </div>
  );
};

/* ---------------- Step 9: Profile ready ---------------- */

const Step9 = ({
  name, minutes, onStart,
}: { name: string; minutes: number; onStart: () => void }) => {
  return (
    <div
      className="flex-1 flex flex-col px-6 pt-16 pb-28"
      style={{ background: "linear-gradient(180deg, #1a0a2e 0%, #000 100%)" }}
    >
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center">
            <Check className="w-10 h-10 text-emerald-400" strokeWidth={3} />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center mb-1">{name},</h1>
        <p className="text-center text-white/80 mb-8">¡Tu perfil está listo!</p>

        <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-white/5 mb-8">
          <p className="text-sm font-semibold text-white mb-4">Lo que vas a lograr:</p>
          <ul className="space-y-3">
            {[
              { emoji: "🧠", text: "Entender los temas más fácil" },
              { emoji: "⭐", text: `Estudiar solo ${minutes} min al día` },
              { emoji: "💜", text: "Avanzar a tu propio ritmo" },
            ].map((r) => (
              <li key={r.text} className="flex items-center gap-3 text-white">
                <span className="text-xl">{r.emoji}</span>
                <span className="flex-1 text-[15px]">{r.text}</span>
                <Check className="w-5 h-5 text-violet-400" />
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-sm text-gray-400 mt-auto mb-6">
          Miles de estudiantes colombianos<br />ya están mejorando con LearnLink.
        </p>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black to-transparent">
        <div className="max-w-md mx-auto">
          <PrimaryButton onClick={onStart}>¡Empecemos! 🚀</PrimaryButton>
        </div>
      </div>
    </div>
  );
};