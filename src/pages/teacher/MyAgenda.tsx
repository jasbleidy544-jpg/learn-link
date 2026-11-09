import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AvailabilityManager from "@/components/mentorship/AvailabilityManager";
import { useAuth } from "@/hooks/useAuth";

export default function MyAgenda() {
  const { profile } = useAuth();
  const isRetired = profile?.teacher_type === "retired";
  const backTo = isRetired ? "/panel-jubilado" : "/teacher-dashboard";

  return (
    <div className="min-h-screen night-sky">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <Button asChild variant="ghost" size="sm">
            <Link to={backTo}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver a mi panel
            </Link>
          </Button>
          <AvailabilityManager simple={isRetired} />
        </div>
      </div>
    </div>
  );
}
