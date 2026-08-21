import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAssignedStudents } from "./useInstitucionData";
import PanelInstitucionalResumen from "./PanelInstitucionalResumen";
import AlertasTempranasTab from "./AlertasTempranasTab";
import RemisionesTab from "./RemisionesTab";
import ComunicacionInstitucionalTab from "./ComunicacionInstitucionalTab";
import ReportesTab from "./ReportesTab";

export default function MiInstitucionSection() {
  const { profile } = useAuth();
  const { students } = useAssignedStudents();

  return (
    <Card className="cloud-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-wrap">
          <Building2 className="w-5 h-5 text-primary" />
          Mi institución
          {profile?.institution && <Badge variant="outline">{profile.institution}</Badge>}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Tu enlace entre el estudiante y los procesos institucionales.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="panel" className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="mb-4 w-max">
              <TabsTrigger value="panel">Panel</TabsTrigger>
              <TabsTrigger value="alertas">Alertas</TabsTrigger>
              <TabsTrigger value="remisiones">Remisiones</TabsTrigger>
              <TabsTrigger value="comunicacion">Comunicación</TabsTrigger>
              <TabsTrigger value="reportes">Reportes</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="panel"><PanelInstitucionalResumen students={students} /></TabsContent>
          <TabsContent value="alertas"><AlertasTempranasTab students={students} /></TabsContent>
          <TabsContent value="remisiones"><RemisionesTab students={students} /></TabsContent>
          <TabsContent value="comunicacion"><ComunicacionInstitucionalTab /></TabsContent>
          <TabsContent value="reportes"><ReportesTab students={students} /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}