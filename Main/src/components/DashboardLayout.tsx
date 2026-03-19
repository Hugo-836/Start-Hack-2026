import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { MentorSelector } from "@/components/MentorSelector";

export default function DashboardLayout() {
  const location = useLocation();
  const isMentorRoute = location.pathname.startsWith("/mentor");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between gap-4 border-b bg-background sticky top-0 z-30 px-4">
            <SidebarTrigger />
            {isMentorRoute ? <MentorSelector /> : null}
          </header>
          <main className="flex-1 scroll-area">
            <div className="scroll-area-content">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
