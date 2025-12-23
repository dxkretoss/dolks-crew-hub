import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Briefcase, ClipboardList, Calendar, Lightbulb, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
const Dashboard = () => {
  const [crewCount, setCrewCount] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);
  const [jobRequestCount, setJobRequestCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchCounts();
  }, []);
  const fetchCounts = async () => {
    try {
      setLoading(true);

      // Fetch crew count
      const {
        count: crewTotal,
        error: crewError
      } = await supabase.from("profiles").select("*", {
        count: "exact",
        head: true
      }).eq("user_type", "crew");
      if (crewError) throw crewError;

      // Fetch service providers count
      const {
        count: serviceTotal,
        error: serviceError
      } = await supabase.from("profiles").select("*", {
        count: "exact",
        head: true
      }).eq("user_type", "service");
      if (serviceError) throw serviceError;

      // Fetch job requests count
      const {
        count: jobTotal,
        error: jobError
      } = await supabase.from("job_requests").select("*", {
        count: "exact",
        head: true
      });
      if (jobError) throw jobError;

      // Fetch events count
      const {
        count: eventTotal,
        error: eventError
      } = await supabase.from("events").select("*", {
        count: "exact",
        head: true
      });
      if (eventError) throw eventError;

      // Fetch crewpreneur (projects) count
      const {
        count: projectTotal,
        error: projectError
      } = await supabase.from("projects").select("*", {
        count: "exact",
        head: true
      });
      if (projectError) throw projectError;

      // Fetch posts count
      const {
        count: postTotal,
        error: postError
      } = await supabase.from("posts").select("*", {
        count: "exact",
        head: true
      });
      if (postError) throw postError;

      setCrewCount(crewTotal || 0);
      setServiceCount(serviceTotal || 0);
      setJobRequestCount(jobTotal || 0);
      setEventCount(eventTotal || 0);
      setProjectCount(projectTotal || 0);
      setPostCount(postTotal || 0);
    } catch (error) {
      console.error("Error fetching counts:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch dashboard data"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of your system</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crew Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : crewCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered Crew Members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Company Members</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : serviceCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered Company Members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Job Requests</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : jobRequestCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Received Job Requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : eventCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crewpreneur</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : projectCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : postCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Posts</p>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Dashboard;