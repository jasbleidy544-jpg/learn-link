import AssignedTeachersCard from "@/components/dashboard/AssignedTeachersCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

const supportTeachers = [
  {
    name: "Prof. Ana Martínez",
    specialty: "Matemáticas",
    experience: "15 años",
    phone: "+57 300 123 4567",
    email: "ana.martinez@colegio.edu",
    consultingHours: "Lunes y Miércoles 2-4 PM",
  },
  {
    name: "Prof. Carlos Ruiz",
    specialty: "Psicología",
    experience: "10 años",
    phone: "+57 301 234 5678",
    email: "carlos.ruiz@colegio.edu",
    consultingHours: "Martes y Jueves 1-3 PM",
  },
];

export default function StudentTeachers() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">👨‍🏫 Mis docentes</h1>
        <p className="text-muted-foreground">
          Docentes asignados a tu acompañamiento y maestros de apoyo
        </p>
      </div>

      <AssignedTeachersCard />

      <Card className="cloud-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> Tus Maestros de Apoyo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {supportTeachers.map((teacher, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-primary">{teacher.name}</h4>
                  <p className="text-sm text-muted-foreground">{teacher.specialty}</p>
                  <p className="text-sm">📞 {teacher.phone}</p>
                  <p className="text-sm">✉️ {teacher.email}</p>
                  <p className="text-sm">🕒 {teacher.consultingHours}</p>
                  <div className="text-sm text-accent">
                    {teacher.experience} de experiencia
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}