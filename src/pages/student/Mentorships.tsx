import MyMentorshipsStudentCard from "@/components/dashboard/MyMentorshipsStudentCard";

export default function StudentMentorships() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📅 Mis mentorías</h1>
        <p className="text-muted-foreground">
          Sesiones agendadas con tus mentores y docentes voluntarios
        </p>
      </div>

      <MyMentorshipsStudentCard />
    </div>
  );
}