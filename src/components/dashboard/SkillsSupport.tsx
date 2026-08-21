import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BookOpen, Users, MessageCircle, Handshake, Wind,
  Heart, Brain, ListChecks, Target, Play, ExternalLink, X, TrendingUp
} from "lucide-react";

type SkillCategory = "academic" | "social" | "emotional" | "general";

type SkillKey =
  | "tecnicas" | "equipo" | "comunicacion" | "conflictos" | "estres"
  | "autoestima" | "emocional" | "organizacion" | "metas";

interface Skill {
  key: SkillKey;
  category: SkillCategory;
  title: string;
  description: string;
  icon: typeof BookOpen;
  videos: string[]; // YouTube IDs
  gradient: string;
}

// Extract YouTube ID from various URL formats
const ytId = (url: string): string => {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  return m ? m[1] : url;
};

const SKILLS: Skill[] = [
  {
    key: "tecnicas",
    category: "academic",
    title: "Técnicas de Estudio",
    description: "Métodos efectivos para aprender mejor",
    icon: BookOpen,
    gradient: "from-blue-500/20 to-cyan-500/20",
    videos: ["A4KnrbHVyIA", "-WmY6tJHgJc", "1daXCbiSRuA", "42HTPKXAy90"].map(ytId),
  },
  {
    key: "equipo",
    category: "social",
    title: "Trabajo en Equipo",
    description: "Colaboración y sinergia grupal",
    icon: Users,
    gradient: "from-emerald-500/20 to-teal-500/20",
    videos: ["INRzFKTzmZs", "LZGl-1FX_HA", "6B8ILp9hMsc"].map(ytId),
  },
  {
    key: "comunicacion",
    category: "social",
    title: "Comunicación Efectiva",
    description: "Expresa tus ideas con claridad",
    icon: MessageCircle,
    gradient: "from-violet-500/20 to-purple-500/20",
    videos: ["YBWIMFjzy5o", "42lbE_N4-bo", "Bzox8Cdm6EI"].map(ytId),
  },
  {
    key: "conflictos",
    category: "social",
    title: "Resolución de Conflictos",
    description: "Maneja desacuerdos de forma sana",
    icon: Handshake,
    gradient: "from-amber-500/20 to-orange-500/20",
    videos: ["xCGAbLga8Ac", "OYmJYqrhaLA", "dtFtbMEIB0E"].map(ytId),
  },
  {
    key: "estres",
    category: "emotional",
    title: "Manejo del Estrés",
    description: "Técnicas para mantener la calma",
    icon: Wind,
    gradient: "from-sky-500/20 to-blue-500/20",
    videos: ["OQPcaNEyhuQ", "6LiMuJkp2Ig", "Ox7_4rNkLHk"].map(ytId),
  },
  {
    key: "autoestima",
    category: "emotional",
    title: "Autoestima",
    description: "Valora y conoce tu propio valor",
    icon: Heart,
    gradient: "from-pink-500/20 to-rose-500/20",
    videos: ["guStACMAov8", "mT8qVzEhiEA", "q0odVeLB6Fw"].map(ytId),
  },
  {
    key: "emocional",
    category: "emotional",
    title: "Inteligencia Emocional",
    description: "Reconoce y gestiona tus emociones",
    icon: Brain,
    gradient: "from-fuchsia-500/20 to-pink-500/20",
    videos: ["ztG9kd7Xblo", "76bet9gVDOA", "PQ19AYNwK3U"].map(ytId),
  },
  {
    key: "organizacion",
    category: "general",
    title: "Organización Personal",
    description: "Planifica y gestiona tu tiempo",
    icon: ListChecks,
    gradient: "from-indigo-500/20 to-violet-500/20",
    videos: ["46bDxQg8xek", "H8NLXFVWC0Y"].map(ytId),
  },
  {
    key: "metas",
    category: "general",
    title: "Metas y Objetivos",
    description: "Define y alcanza tus sueños",
    icon: Target,
    gradient: "from-yellow-500/20 to-amber-500/20",
    videos: ["quQKyihbuzo", "oQB3EiF_Lcs", "P3jP_8JITmA"].map(ytId),
  },
];

const SkillsSupport = () => {
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [category, setCategory] = useState<SkillCategory>("academic");

  const filtered = SKILLS.filter((s) => s.category === category);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gradient">Habilidades y Apoyo</h2>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          La práctica adaptativa con IA se encuentra en “Retos del día”.
        </span>
      </div>

      <Tabs value={category} onValueChange={(v) => setCategory(v as SkillCategory)}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="academic" className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Académica</TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2"><Users className="w-4 h-4" /> Social</TabsTrigger>
          <TabsTrigger value="emotional" className="flex items-center gap-2"><Heart className="w-4 h-4" /> Emocional</TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2"><TrendingUp className="w-4 h-4" /> General</TabsTrigger>
        </TabsList>
        <TabsContent value={category} forceMount>
          <div key={category} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {filtered.map((skill) => {
          const Icon = skill.icon;
          return (
            <button
              key={skill.key}
              onClick={() => { setActiveSkill(skill); setPlayingVideo(null); }}
              className={`cloud-card p-5 rounded-lg text-left transition-all hover:glow-effect hover:scale-[1.02] bg-gradient-to-br ${skill.gradient} group`}
            >
              <Icon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold mb-1">{skill.title}</h3>
              <p className="text-xs text-muted-foreground mb-3">{skill.description}</p>
              <span className="text-xs text-primary inline-flex items-center gap-1">
                Ver videos ({skill.videos.length}) <Play className="w-3 h-3" />
              </span>
            </button>
          );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Skill detail modal */}
      <Dialog open={!!activeSkill} onOpenChange={(o) => { if (!o) { setActiveSkill(null); setPlayingVideo(null); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {activeSkill && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <activeSkill.icon className="w-5 h-5 text-primary" />
                  {activeSkill.title}
                </DialogTitle>
                <DialogDescription>{activeSkill.description}</DialogDescription>
              </DialogHeader>

              {playingVideo ? (
                <div className="space-y-3">
                  <div className="aspect-video w-full overflow-hidden rounded-lg border bg-black">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${playingVideo}?autoplay=1`}
                      title="Video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPlayingVideo(null)}>
                      <X className="w-4 h-4 mr-1" /> Cerrar video
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`https://youtu.be/${playingVideo}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1" /> Abrir en YouTube
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeSkill.videos.map((id) => (
                    <Card key={id} className="overflow-hidden cloud-card group">
                      <button
                        onClick={() => setPlayingVideo(id)}
                        className="relative w-full aspect-video bg-muted overflow-hidden"
                      >
                        <img
                          src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
                          alt="Miniatura del video"
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-12 h-12 text-white" />
                        </div>
                      </button>
                      <CardContent className="p-3 space-y-2">
                        <p className="text-sm font-medium line-clamp-2">Video sobre {activeSkill.title.toLowerCase()}</p>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1" onClick={() => setPlayingVideo(id)}>
                            <Play className="w-3 h-3 mr-1" /> Ver video
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <a href={`https://youtu.be/${id}`} target="_blank" rel="noopener noreferrer" aria-label="Abrir en YouTube">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

    </section>
  );
};

export default SkillsSupport;
