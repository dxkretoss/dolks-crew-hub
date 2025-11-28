import { useEffect, useState } from "react";
import { Outlet, useNavigate, NavLink, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Users, Building2, LogOut, Menu, X, Briefcase, ShieldCheck, LayoutDashboard, Calendar, ChevronDown, Settings, UserCog, Tag, Database } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import dolksLogo from "@/assets/dolks-logo.png";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMasterOpen, setIsMasterOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/admin/login");
        return;
      }

      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      if (error || !roles) {
        navigate("/admin/login");
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(false);
    };

    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate("/admin/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out",
        description: "Successfully signed out",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const navItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  const memberItems = [
    { path: "/admin/crew", label: "Crew", icon: Users },
    { path: "/admin/services", label: "Company", icon: Building2 },
  ];

  const masterItems = [
    { path: "/admin/categories", label: "Categories", icon: Settings },
    { path: "/admin/company-services", label: "Company Services", icon: Briefcase },
    { path: "/admin/hobbies", label: "Hobby/Interest", icon: ShieldCheck },
    { path: "/admin/tags", label: "Tags", icon: Tag },
    { path: "/admin/company-crew-roles", label: "Company/Crew Roles", icon: UserCog },
  ];

  const otherNavItems = [
    { path: "/admin/events", label: "Events", icon: Calendar },
  ];

  const isMembersActive = location.pathname === "/admin/crew" || location.pathname === "/admin/services";
  const isMasterActive = masterItems.some(item => location.pathname === item.path);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <img src={dolksLogo} alt="DOLKS" className="h-8 w-auto" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="fixed inset-y-0 left-0 w-72 bg-card border-r shadow-lg flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center">
                <img src={dolksLogo} alt="DOLKS" className="h-10 w-auto" />
              </div>
            </div>
            <nav className="p-4 space-y-2 overflow-y-auto flex-1 min-h-0">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
              
              <Collapsible open={isMembersOpen} onOpenChange={setIsMembersOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full ${
                      isMembersActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Users className="h-5 w-5" />
                    <span className="font-medium flex-1 text-left">Members</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isMembersOpen ? "rotate-180" : ""}`} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 pt-1">
                  {memberItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2 pl-12 rounded-lg transition-colors ${
                          isActive
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.label}</span>
                    </NavLink>
                  ))}
                </CollapsibleContent>
              </Collapsible>
              
              {otherNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}

              <Collapsible open={isMasterOpen} onOpenChange={setIsMasterOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full ${
                      isMasterActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Database className="h-5 w-5" />
                    <span className="font-medium flex-1 text-left">Master</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isMasterOpen ? "rotate-180" : ""}`} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 pt-1">
                  {masterItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2 pl-12 rounded-lg transition-colors ${
                          isActive
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.label}</span>
                    </NavLink>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </nav>
            <div className="p-4 border-t bg-card">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-card border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-center">
            <img src={dolksLogo} alt="DOLKS" className="h-12 w-auto" />
          </div>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto flex-1 min-h-0">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
          
          <Collapsible open={isMembersOpen} onOpenChange={setIsMembersOpen}>
            <CollapsibleTrigger asChild>
              <button
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full ${
                  isMembersActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Users className="h-5 w-5" />
                <span className="font-medium flex-1 text-left">Members</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isMembersOpen ? "rotate-180" : ""}`} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pt-1">
              {memberItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 pl-12 rounded-lg transition-colors ${
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm">{item.label}</span>
                </NavLink>
              ))}
            </CollapsibleContent>
          </Collapsible>
          
          {otherNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}

          <Collapsible open={isMasterOpen} onOpenChange={setIsMasterOpen}>
            <CollapsibleTrigger asChild>
              <button
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full ${
                  isMasterActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Database className="h-5 w-5" />
                <span className="font-medium flex-1 text-left">Master</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isMasterOpen ? "rotate-180" : ""}`} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pt-1">
              {masterItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 pl-12 rounded-lg transition-colors ${
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm">{item.label}</span>
                </NavLink>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </nav>

        <div className="p-4 border-t bg-card mt-auto">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
