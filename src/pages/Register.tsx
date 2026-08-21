import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import InstitutionCodeInput, { InstitutionMatch } from "@/components/InstitutionCodeInput";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GraduationCap, Users, Building, Mail, Lock, User, Phone, MapPin, BookOpen } from "lucide-react";

const Register = () => {
  const { userType } = useParams();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const presetType = searchParams.get("type"); // 'active' | 'retired'
  const [isLoading, setIsLoading] = useState(false);
  const [studentAffiliation, setStudentAffiliation] = useState<"none" | "linked">("linked");
  const [instCode, setInstCode] = useState("");
  const [instMatch, setInstMatch] = useState<InstitutionMatch>(null);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', location: '', institution: '', grade: '', subjects: '', description: '',
    teacherType: (presetType === 'retired' || presetType === 'active') ? presetType : 'active'
  });

  const getUserTypeInfo = () => {
    switch (userType) {
      case 'student': return { title: 'Registro de Estudiante', icon: <GraduationCap className="w-8 h-8" />, description: 'Acceso gratuito a diagnósticos y planes de apoyo personalizados', color: 'text-accent' };
      case 'teacher': return { title: 'Registro de Maestro', icon: <Users className="w-8 h-8" />, description: 'Herramientas para acompañar y apoyar a tus estudiantes', color: 'text-primary' };
      case 'institution': return { title: 'Registro de Institución', icon: <Building className="w-8 h-8" />, description: 'Plataforma completa para gestionar el bienestar estudiantil', color: 'text-light-blue' };
      default: return { title: 'Registro', icon: <User className="w-8 h-8" />, description: 'Únete a LearnLink', color: 'text-primary' };
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    // Validations for institutional code linking
    if (userType === "student" && !instMatch) {
      toast({ title: "Código institucional no válido. Verifica con tu institución.", description: "El código institucional es obligatorio para estudiantes.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (userType === "teacher" && formData.teacherType === "active" && !instMatch) {
      toast({ title: "Código institucional no válido. Verifica con tu institución.", description: "Los docentes activos voluntarios deben ingresar un código institucional válido.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    // Retired teachers no longer require an institutional code.

    const { error } = await signUp(formData.email, formData.password, {
      full_name: formData.name,
      user_type: userType,
      institution_id: instMatch?.id ?? null,
      institution: instMatch?.name ?? null,
      teacher_type: userType === 'teacher' ? formData.teacherType : null,
    });

    if (error) {
      toast({ title: "Error al registrar", description: error.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    // Update profile with additional data
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: { user } } = await supabase.auth.getUser();
    let linkedInstitutionId: string | null = instMatch?.id ?? null;
    let linkedInstitutionName: string | null = instMatch?.name ?? null;

    // For institution accounts: create the institution row and link the owner
    if (user && userType === "institution") {
      const { data: inst, error: instErr } = await (supabase as any)
        .from("institutions")
        .insert({
          name: formData.name,
          contact_email: formData.email,
          contact_phone: formData.phone || null,
          address: formData.location || null,
          notes: formData.description || null,
          status: "approved",
          owner_id: user.id,
        })
        .select()
        .single();
      if (!instErr && inst) {
        linkedInstitutionId = inst.id;
        linkedInstitutionName = inst.name;
      }
    }

    if (user) {
      await (supabase as any).from("profiles").update({
        phone: formData.phone,
        location: formData.location,
        institution: linkedInstitutionName ?? formData.institution,
        institution_id: linkedInstitutionId,
        grade: formData.grade,
        subjects: formData.subjects,
        description: formData.description,
        teacher_type: userType === 'teacher' ? formData.teacherType : null,
        is_available: userType === 'teacher' ? true : null,
      }).eq("id", user.id);

      // Auto-assign teacher + send mentor requests for institution-linked students
      if (userType === 'student' && linkedInstitutionId) {
        try {
          await (supabase as any).rpc('assign_active_teacher', { _student_id: user.id });
          await (supabase as any).rpc('create_mentor_requests', { _student_id: user.id });
        } catch (err) {
          console.warn('Mentor assignment skipped:', err);
        }
      }
    }

    toast({ title: "¡Cuenta creada!", description: "Bienvenido a LearnLink." });
    setIsLoading(false);

    if (userType === 'student') navigate('/student-dashboard');
    else if (userType === 'teacher') {
      navigate(formData.teacherType === 'retired' ? '/panel-jubilado' : '/teacher-dashboard');
    }
    else navigate('/institution-dashboard');
  };

  const typeInfo = getUserTypeInfo();

  return (
    <div className="min-h-screen night-sky">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="cloud-card glow-effect">
            <CardHeader className="text-center">
              <div className={`${typeInfo.color} mb-4 flex justify-center`}>{typeInfo.icon}</div>
              <CardTitle className="text-3xl font-bold mb-2">{typeInfo.title}</CardTitle>
              <p className="text-muted-foreground">{typeInfo.description}</p>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{userType === 'institution' ? 'Nombre de la Institución' : 'Nombre Completo'}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="name" name="name" type="text" placeholder={userType === 'institution' ? 'Colegio XYZ' : 'Tu nombre completo'} className="pl-10" value={formData.name} onChange={handleInputChange} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="email" name="email" type="email" placeholder="tu@email.com" className="pl-10" value={formData.email} onChange={handleInputChange} required />
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="password" name="password" type="password" placeholder="Mínimo 6 caracteres" className="pl-10" value={formData.password} onChange={handleInputChange} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Repite tu contraseña" className="pl-10" value={formData.confirmPassword} onChange={handleInputChange} required />
                    </div>
                  </div>
                </div>

                {userType === 'student' && (
                  <>
                  <div className="space-y-3 p-4 rounded-lg border border-border bg-card/40">
                    <Label>¿Tu cuenta estará afiliada a una institución educativa?</Label>
                    <RadioGroup value={studentAffiliation} onValueChange={(v: any) => setStudentAffiliation(v)} className="space-y-2">
                      <div className="flex items-start gap-2">
                        <RadioGroupItem value="none" id="aff-none" className="mt-1" />
                        <Label htmlFor="aff-none" className="font-normal cursor-pointer">No, cuenta independiente</Label>
                      </div>
                      <div className="flex items-start gap-2">
                        <RadioGroupItem value="linked" id="aff-linked" className="mt-1" />
                        <Label htmlFor="aff-linked" className="font-normal cursor-pointer">Sí, estoy afiliado a una institución</Label>
                      </div>
                    </RadioGroup>
                    {studentAffiliation === "linked" && (
                      <div className="pt-2">
                        <InstitutionCodeInput
                          expectedType="student"
                          value={instCode}
                          onChange={setInstCode}
                          onMatch={setInstMatch}
                          label="Código institucional para estudiantes"
                          required
                        />
                      </div>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="institution">Institución Educativa</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="institution" name="institution" type="text" placeholder="Nombre de tu colegio" className="pl-10" value={instMatch?.name || formData.institution} onChange={handleInputChange} disabled={studentAffiliation === "linked" && !!instMatch} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grade">Grado</Label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="grade" name="grade" type="text" placeholder="Ej: 10°, 11°" className="pl-10" value={formData.grade} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>
                  </>
                )}

                {userType === 'teacher' && (
                  <>
                  <div className="space-y-2">
                    <Label htmlFor="teacherType">Tipo de docente</Label>
                    <Select value={formData.teacherType} onValueChange={(v) => setFormData(p => ({ ...p, teacherType: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">👨‍🏫 Docente Activo Voluntario</SelectItem>
                        <SelectItem value="retired">👴 Docente Voluntario Jubilado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.teacherType === "active" && (
                    <InstitutionCodeInput
                      expectedType="teacher"
                      value={instCode}
                      onChange={setInstCode}
                      onMatch={setInstMatch}
                      label="Código de tu institución"
                      required
                    />
                  )}
                  {formData.teacherType === "retired" && (
                    <div className="p-3 rounded-lg border border-pink-500/30 bg-pink-500/5 text-sm text-muted-foreground">
                      💜 Como docente jubilado voluntario no necesitas un código institucional. Las instituciones podrán enviarte solicitudes de asignación directamente.
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    {formData.teacherType === "active" && (
                      <div className="space-y-2">
                        <Label htmlFor="institution">Institución</Label>
                        <div className="relative">
                          <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input id="institution" name="institution" type="text" placeholder="Nombre de tu institución" className="pl-10" value={instMatch?.name || formData.institution} onChange={handleInputChange} disabled={!!instMatch} />
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="subjects">Materias que enseñas</Label>
                      <div className="relative">
                        <BookOpen className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="subjects" name="subjects" type="text" placeholder="Ej: Matemáticas, Física" className="pl-10" value={formData.subjects} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>
                  </>
                )}

                {userType === 'institution' && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input id="phone" name="phone" type="tel" placeholder="+57 300 123 4567" className="pl-10" value={formData.phone} onChange={handleInputChange} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Ubicación</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input id="location" name="location" type="text" placeholder="Ciudad, País" className="pl-10" value={formData.location} onChange={handleInputChange} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción de la Institución</Label>
                      <Textarea id="description" name="description" placeholder="Cuéntanos sobre tu institución, número de estudiantes, etc." className="min-h-24" value={formData.description} onChange={handleInputChange} />
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full glow-effect text-lg py-6" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                      Creando cuenta...
                    </div>
                  ) : `Crear Cuenta ${userType === 'student' ? 'Gratuita' : ''}`}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  ¿Ya tienes cuenta?{' '}
                  <Button variant="link" className="p-0 h-auto font-normal text-primary hover:text-accent" onClick={() => navigate('/login')}>
                    Inicia sesión aquí
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;
