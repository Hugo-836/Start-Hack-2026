import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/DashboardLayout";
import AuthPage from "./pages/Auth";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentProject from "./pages/student/StudentProject";
import StudentMilestones from "./pages/student/StudentMilestones";
import StudentFeedback from "./pages/student/StudentFeedback";
import StudentPeers from "./pages/student/StudentPeers";
import StudentSixtySeven from "./pages/student/StudentSixtySeven";
import StudentSharedDocuments from "./pages/student/StudentSharedDocuments";
import MentorDashboard from "./pages/mentor/MentorDashboard";
import MentorStudents from "./pages/mentor/MentorStudents";
import MentorFeedback from "./pages/mentor/MentorFeedback";
import { DemoAuthProvider, useDemoAuth } from "@/lib/demoAuth";

const queryClient = new QueryClient();

function ProtectedStudentRoutes() {
  const { isAuthenticated } = useDemoAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <DashboardLayout />;
}

function RootRedirect() {
  const { isAuthenticated } = useDemoAuth();
  return <Navigate to={isAuthenticated ? "/student" : "/auth"} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DemoAuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/auth" element={<AuthPage />} />

            <Route element={<ProtectedStudentRoutes />}>
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/project" element={<StudentProject />} />
              <Route path="/student/milestones" element={<StudentMilestones />} />
              <Route path="/student/67" element={<StudentSixtySeven />} />
              <Route path="/student/feedback" element={<StudentFeedback />} />
              <Route path="/student/peers" element={<StudentPeers />} />
              <Route path="/student/shared-documents" element={<StudentSharedDocuments />} />
              <Route path="/student/mentors" element={<StudentSharedDocuments />} />
            </Route>

            <Route element={<DashboardLayout />}>
              <Route path="/mentor" element={<MentorDashboard />} />
              <Route path="/mentor/students" element={<MentorStudents />} />
              <Route path="/mentor/feedback" element={<MentorFeedback />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </DemoAuthProvider>
  </QueryClientProvider>
);

export default App;
