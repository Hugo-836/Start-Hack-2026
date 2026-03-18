import { Link, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { GraduationCap, LayoutDashboard, MessageSquare, Milestone, Users, BookOpen, UserCheck } from "lucide-react";

const studentItems = [
  { title: "Dashboard", url: "/student", icon: LayoutDashboard },
  { title: "My Project", url: "/student/project", icon: BookOpen },
  { title: "Progress", url: "/student/milestones", icon: Milestone },
  { title: "Feedback", url: "/student/feedback", icon: MessageSquare },
  { title: "Peers", url: "/student/peers", icon: Users },
];

const mentorItems = [
  { title: "Dashboard", url: "/mentor", icon: LayoutDashboard },
  { title: "Students", url: "/mentor/students", icon: GraduationCap },
  { title: "Feedback", url: "/mentor/feedback", icon: MessageSquare },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isMentor = location.pathname.startsWith("/mentor");
  const items = isMentor ? mentorItems : studentItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4">
          <Link to="/"><img src="/studyond.svg" alt="Studyond" className={collapsed ? "h-6 w-6" : "h-8"} /></Link>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>{isMentor ? "Mentor" : "Student"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-muted/50" activeClassName="bg-muted text-foreground font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Debug role switcher */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to={isMentor ? "/student" : "/mentor"} className="hover:bg-muted/50 text-muted-foreground">
                    <UserCheck className="mr-2 h-4 w-4" />
                    {!collapsed && <span className="ds-caption">{isMentor ? "Switch to Student" : "Switch to Mentor"}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
