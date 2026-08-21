import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Access from "./pages/Access";
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import StudentDashboard from "./pages/StudentDashboard";
import DiagnosticChat from "./pages/DiagnosticChat";
import AcompanamientoDigital from "./pages/AcompanamientoDigital";
import TeacherDashboard from "./pages/TeacherDashboard";
import RetiredTeacherDashboard from "./pages/RetiredTeacherDashboard";
import TeacherHistory from "./pages/TeacherHistory";
import TeacherActivityDetail from "./pages/TeacherActivityDetail";
import InstitutionDashboard from "./pages/InstitutionDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminInstitutions from "./pages/admin/AdminInstitutions";
import AdminAcademic from "./pages/admin/AdminAcademic";
import AdminMeetings from "./pages/admin/AdminMeetings";
import AdminGamification from "./pages/admin/AdminGamification";
import AdminAudit from "./pages/admin/AdminAudit";
import OAuthConsent from "./pages/OAuthConsent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/register/:userType" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/access" element={<Access />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/student-dashboard" element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/diagnostico-inicial" element={
              <ProtectedRoute allowedRoles={["student"]}>
                <DiagnosticChat />
              </ProtectedRoute>
            } />
            <Route path="/acompanamiento-digital" element={
              <ProtectedRoute allowedRoles={["student"]}>
                <AcompanamientoDigital />
              </ProtectedRoute>
            } />
            <Route path="/teacher-dashboard" element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            <Route path="/panel-jubilado" element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <RetiredTeacherDashboard />
              </ProtectedRoute>
            } />
            <Route path="/teacher-dashboard/historial" element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherHistory />
              </ProtectedRoute>
            } />
            <Route path="/teacher-dashboard/historial/:id" element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherActivityDetail />
              </ProtectedRoute>
            } />
            <Route path="/institution-dashboard" element={
              <ProtectedRoute allowedRoles={["institution"]}>
                <InstitutionDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={["super_admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="institutions" element={<AdminInstitutions />} />
              <Route path="academic" element={<AdminAcademic />} />
              <Route path="meetings" element={<AdminMeetings />} />
              <Route path="gamification" element={<AdminGamification />} />
              <Route path="audit" element={<AdminAudit />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
