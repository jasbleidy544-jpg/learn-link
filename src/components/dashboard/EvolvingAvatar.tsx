import { Crown, Star, Sparkles, Sun } from "lucide-react";

const auras = [
  "from-slate-400 to-slate-600",
  "from-blue-400 to-blue-600",
  "from-purple-400 to-purple-600",
  "from-pink-400 to-pink-600",
  "from-amber-400 to-amber-600",
  "from-emerald-400 to-emerald-600",
];

const decorations = [null, Sparkles, Star, Star, Crown, Sun];

export default function EvolvingAvatar({ name, levelIndex }: { name: string; levelIndex: number }) {
  const aura = auras[Math.min(levelIndex, auras.length - 1)];
  const Decoration = decorations[Math.min(levelIndex, decorations.length - 1)];
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative inline-block">
      <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${aura} flex items-center justify-center text-2xl font-bold text-white shadow-lg animate-pulse`}>
        {initials}
      </div>
      {Decoration && (
        <Decoration className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 drop-shadow-glow animate-fade-in" />
      )}
    </div>
  );
}