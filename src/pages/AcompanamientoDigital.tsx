import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Sparkles } from "lucide-react";
import SubjectPanel from "@/components/acompanamiento/SubjectPanel";

const SUBJECTS = [
  "Matemáticas", "Física", "Castellano", "Química",
  "Arte", "Religión", "Filosofía", "Inglés",
];

export default function AcompanamientoDigital() {
  const navigate = useNavigate();
  const [active, setActive] = useState(SUBJECTS[0]);

  return (
    <div className="min-h-screen night-sky">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <Button variant="ghost" onClick={() => navigate("/student-dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al panel
          </Button>

          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-2">
              Mi Acompañamiento Digital <Sparkles className="w-7 h-7 text-primary" />
            </h1>
            <p className="text-muted-foreground mt-1">
              Tu camino personalizado de aprendizaje
            </p>
          </div>

          <Tabs value={active} onValueChange={setActive} className="w-full">
            <div className="overflow-x-auto -mx-1 px-1 mb-4">
              <TabsList className="flex w-max gap-1">
                {SUBJECTS.map((s) => (
                  <TabsTrigger key={s} value={s} className="whitespace-nowrap">{s}</TabsTrigger>
                ))}
              </TabsList>
            </div>
            {SUBJECTS.map((s) => (
              <TabsContent key={s} value={s} className="mt-2">
                {active === s && <SubjectPanel subject={s} />}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}