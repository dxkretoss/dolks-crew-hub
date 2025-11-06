import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import CrewList from "./pages/admin/CrewList";
import ServiceList from "./pages/admin/ServiceList";
import CrewDetail from "./pages/admin/CrewDetail";
import ServiceDetail from "./pages/admin/ServiceDetail";
import CompanyServicesRoles from "./pages/admin/CompanyServicesRoles";
import InterestsSkills from "./pages/admin/InterestsSkills";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="crew" element={<CrewList />} />
            <Route path="crew/:id" element={<CrewDetail />} />
            <Route path="services" element={<ServiceList />} />
            <Route path="services/:id" element={<ServiceDetail />} />
            <Route path="company-services-roles" element={<CompanyServicesRoles />} />
            <Route path="interests-skills" element={<InterestsSkills />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
