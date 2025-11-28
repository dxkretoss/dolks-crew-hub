import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, Calendar, MapPin, User, Building2, Users as UsersIcon, Briefcase, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ConvertibleImage } from "@/components/ConvertibleImage";
import type { Tables } from "@/integrations/supabase/types";
type Profile = Tables<"profiles">;
type CompanyProfile = Tables<"company_profiles">;
const ServiceDetail = () => {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    fetchProfile();
  }, [id]);
  const fetchProfile = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("profiles").select("*").eq("id", id!).eq("user_type", "service").single();
      if (error) throw error;
      setProfile(data);

      // Fetch company profile
      const {
        data: companyData
      } = await supabase.from("company_profiles").select("*").eq("user_id", data.user_id).single();
      setCompanyProfile(companyData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      navigate("/admin/services");
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    setDeleting(true);
    try {
      // First delete the profile
      const {
        error: profileError
      } = await supabase.from("profiles").delete().eq("id", id!);
      if (profileError) throw profileError;

      // Then delete from auth.users via edge function
      const {
        error: authError
      } = await supabase.functions.invoke('delete-user', {
        body: {
          userId: profile?.user_id
        }
      });
      if (authError) throw authError;
      toast({
        title: "Success",
        description: "Service provider deleted successfully",
        variant: "success"
      });
      navigate("/admin/services");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };
  if (loading) {
    return <div className="p-6 lg:p-8">
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      </div>;
  }
  if (!profile) {
    return null;
  }
  const initials = profile.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || profile.username.substring(0, 2).toUpperCase();
  return <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={() => navigate("/admin/services")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back 
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete  
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the service provider
                {profile.full_name ? ` "${profile.full_name}"` : ""} and remove their data from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {deleting ? "Deleting..." : "Yes, Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profile.profile_picture_url || ""} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">
                  {profile.full_name || "No Name"}
                </h2>
                <p className="text-muted-foreground">@{profile.username}</p>
                <Badge className="mt-2" variant="secondary">
                  Service Provider
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-medium">
                    {profile.country_code} {profile.phone_number}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium capitalize">{profile.gender || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Birth Date</p>
                  <p className="font-medium">{formatDate(profile.birth_date)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Nationality</p>
                  <p className="font-medium">{profile.nationality || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium">{profile.role || "N/A"}</p>
                </div>
              </div>
            </div>

            {profile.hobby && <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Hobby</p>
                <p className="font-medium">{profile.hobby}</p>
              </div>}
          </CardContent>
        </Card>

        {companyProfile && <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {companyProfile.company_profile_picture && <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-3 font-semibold">Company Profile Picture</p>
                  <ConvertibleImage src={companyProfile.company_profile_picture} alt="Company Profile" className="w-24 h-24 object-cover rounded-lg border" />
                </div>}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground font-semibold">Company Name</p>
                    <p className="font-medium my-[5px]">{companyProfile.company_name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground font-semibold">Location</p>
                    <p className="font-medium my-[5px]">{companyProfile.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground font-semibold">Type of Services</p>
                    <p className="font-medium my-[5px]">{companyProfile.type_of_services}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <UsersIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground font-semibold">Team Size</p>
                    <p className="font-medium my-[5px]">{companyProfile.team_size || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground font-semibold">Business Category</p>
                    <p className="font-medium my-[5px]">{companyProfile.business_category || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground font-semibold">Tags</p>
                    <p className="font-medium my-[5px]">{companyProfile.tags || "N/A"}</p>
                  </div>
                </div>
              </div>

              {companyProfile.description && <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2 font-semibold">Description</p>
                  <p className="font-medium">{companyProfile.description}</p>
                </div>}

              {companyProfile.company_portfolio && <div className="pt-4 border-t py-[15px]">
                  <p className="text-sm text-muted-foreground mb-3 font-semibold">Portfolio Images</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(() => {
                try {
                  const portfolioImages = JSON.parse(companyProfile.company_portfolio);
                  return Array.isArray(portfolioImages) ? portfolioImages.map((imageUrl: string, index: number) => <ConvertibleImage key={index} src={imageUrl} alt={`Portfolio ${index + 1}`} onClick={() => window.open(imageUrl, '_blank')} className="w-full h-32 object-cover rounded-lg border hover:opacity-80 transition-opacity cursor-pointer" />) : <ConvertibleImage src={companyProfile.company_portfolio} alt="Portfolio" className="w-full h-32 object-cover rounded-lg border hover:opacity-80 transition-opacity cursor-pointer" onClick={() => window.open(companyProfile.company_portfolio!, '_blank')} />;
                } catch {
                  return <ConvertibleImage src={companyProfile.company_portfolio} alt="Portfolio" className="w-full h-32 object-cover rounded-lg border hover:opacity-80 transition-opacity cursor-pointer" onClick={() => window.open(companyProfile.company_portfolio!, '_blank')} />;
                }
              })()}
                  </div>
                </div>}
            </CardContent>
          </Card>}

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-mono text-sm mt-1">{profile.user_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-medium mt-1">{formatDate(profile.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium mt-1">{formatDate(profile.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default ServiceDetail;