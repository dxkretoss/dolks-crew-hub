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
import Categories from "./pages/admin/Categories";
import Services from "./pages/admin/Services";
import Hobbies from "./pages/admin/Hobbies";
import Tags from "./pages/admin/Tags";
import Mentions from "./pages/admin/Mentions";
import Events from "./pages/admin/Events";
import CompanyCrewRoles from "./pages/admin/CompanyCrewRoles";
import JobRequests from "./pages/admin/JobRequests";
import Crewpreneur from "./pages/admin/Crewpreneur";
import Posts from "./pages/admin/Posts";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {

  return (
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
              <Route path="events" element={<Events />} />
              <Route path="categories" element={<Categories />} />
              <Route path="company-services" element={<Services />} />
              <Route path="hobbies" element={<Hobbies />} />
              <Route path="tags" element={<Tags />} />
              <Route path="mentions" element={<Mentions />} />
              <Route path="company-crew-roles" element={<CompanyCrewRoles />} />
              <Route path="job-requests" element={<JobRequests />} />
              <Route path="crewpreneur" element={<Crewpreneur />} />
              <Route path="posts" element={<Posts />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
