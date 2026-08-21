import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/admin/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, Building2, Calendar, Activity, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#22d3ee", "#f472b6", "#a78bfa"];

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, students: 0, teachers: 0, institutions: 0, meetings: 0, recs: 0 });
  const [byRole, setByRole] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [profiles, roles, insts, meets, recs, inter] = await Promise.all([
        (supabase as any).from("profiles").select("id", { count: "exact", head: true }),
        (supabase as any).from("user_roles").select("role"),
        (supabase as any).from("institutions").select("id", { count: "exact", head: true }),
        (supabase as any).from("meetings").select("id", { count: "exact", head: true }),
        (supabase as any).from("ai_recommendations").select("id", { count: "exact", head: true }),
        (supabase as any).from("platform_interactions").select("created_at").gte("created_at", new Date(Date.now() - 7*24*3600*1000).toISOString()),
      ]);
      const roleCounts: Record<string, number> = {};
      (roles.data || []).forEach((r: any) => { roleCounts[r.role] = (roleCounts[r.role] || 0) + 1; });
      setStats({
        users: profiles.count || 0,
        students: roleCounts.student || 0,
        teachers: roleCounts.teacher || 0,
        institutions: insts.count || 0,
        meetings: meets.count || 0,
        recs: recs.count || 0,
      });
      setByRole(Object.entries(roleCounts).map(([name, value]) => ({ name, value })));
      const days: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i*24*3600*1000).toISOString().slice(5,10);
        days[d] = 0;
      }
      (inter.data || []).forEach((x: any) => {
        const d = x.created_at.slice(5,10);
        if (d in days) days[d]++;
      });
      setActivity(Object.entries(days).map(([day, count]) => ({ day, count })));
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visión general de la plataforma en tiempo real</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Usuarios" value={stats.users} icon={Users} />
        <StatCard label="Estudiantes" value={stats.students} icon={GraduationCap} />
        <StatCard label="Docentes" value={stats.teachers} icon={Users} />
        <StatCard label="Instituciones" value={stats.institutions} icon={Building2} />
        <StatCard label="Reuniones" value={stats.meetings} icon={Calendar} />
        <StatCard label="Recom. IA" value={stats.recs} icon={Award} />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="cloud-card">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5" />Actividad (7 días)</CardTitle></CardHeader>
          <CardContent style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activity}>
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="cloud-card">
          <CardHeader><CardTitle className="text-lg">Usuarios por rol</CardTitle></CardHeader>
          <CardContent style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byRole} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {byRole.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}