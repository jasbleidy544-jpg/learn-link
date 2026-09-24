import { Crown, Star, Sparkles, Gem, Rocket, Flame, Zap, Moon } from "lucide-react";
// 10 auras, una por nivel
const auras = [
  "from-slate-400 to-slate-600",   // 1 - Huevo
  "from-gray-400 to-gray-600",     // 2 - Polluelo
  "from-blue-400 to-blue-600",     // 3 - Pajarito
  "from-sky-400 to-sky-600",       // 4 - Águila joven
  "from-purple-400 to-purple-600", // 5 - Búho sabio
  "from-violet-400 to-violet-600", // 6 - Zorro astuto
  "from-pink-400 to-pink-600",     // 7 - Lobo
  "from-amber-400 to-amber-600",   // 8 - Tigre
  "from-orange-400 to-orange-600", // 9 - León
  "from-yellow-400 to-red-600",    // 10 - Dragón legendario
];

// 10 decoraciones (uno por nivel, el primero es null)
const decorations = [null, Sparkles, Star, Star, Moon, Gem, Zap, Flame, Rocket, Crown];

export default function EvolvingAvatar({
  name,
  levelIndex,
}: {
  name: string;
  levelIndex: number;
}) {
  const idx = Math.max(0, Math.min(9, levelIndex));
  const aura = auras[idx];
  const Decoration = decorations[idx];

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative inline-block">
      <div
        className={`w-20 h-20 rounded-full bg-gradient-to-br ${aura} flex items-center justify-center text-2xl font-bold text-white shadow-lg transition-all duration-500`}
      >
        {initials}
      </div>
      {Decoration && (
        <Decoration className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 drop-shadow-lg animate-fade-in" />
      )}
    </div>
  );
}