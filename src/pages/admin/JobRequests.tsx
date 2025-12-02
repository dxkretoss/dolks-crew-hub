import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Eye, CheckCircle, XCircle, Search, Calendar, MapPin, DollarSign } from "lucide-react";
import { format } from "date-fns";
type JobRequest = {
  id: string;
  user_id: string;
  job_title: string;
  job_short_description: string;
  job_category_names: string[];
  job_urgency: string;
  job_full_description: string;
  job_start_date: string;
  job_location: string;
  job_latitude: string;
  job_longitude: string;
  job_complete_date: string;
  job_special_requirements: string;
  job_budget: string | null;
  job_documents_images: string[] | null;
  job_tags_names: string[] | null;
  job_consent: boolean;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  user?: {
    full_name: string | null;
    email: string;
    country_code: string;
    phone_number: string;
    role: string | null;
    profile_picture_url: string | null;
  };
};
const JobRequests = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<JobRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();
  const {
    data: jobRequests,
    isLoading
  } = useQuery({
    queryKey: ["jobRequests"],
    queryFn: async () => {
      const {
        data: jobs,
        error
      } = await supabase.from("job_requests").select("*").order("created_at", {
        ascending: false
      });
      if (error) throw error;

      // Fetch user profile data for each job request
      const jobsWithDetails = await Promise.all((jobs || []).map(async job => {
        const {
          data: profile
        } = await supabase.from("profiles").select("full_name, email, country_code, phone_number, role, profile_picture_url").eq("user_id", job.user_id).single();
        return {
          ...job,
          user: profile || undefined
        };
      }));
      return jobsWithDetails as JobRequest[];
    }
  });
  const approveMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const {
        error
      } = await supabase.from("job_requests").update({
        status: "Approved",
        rejection_reason: null
      }).eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["jobRequests"]
      });
      toast({
        title: "Job Approved",
        description: "Job request has been approved successfully"
      });
      setIsDetailsOpen(false);
    },
    onError: error => {
      toast({
        title: "Error",
        description: "Failed to approve job request",
        variant: "destructive"
      });
      console.error(error);
    }
  });
  const rejectMutation = useMutation({
    mutationFn: async ({
      jobId,
      reason
    }: {
      jobId: string;
      reason: string;
    }) => {
      const {
        error
      } = await supabase.from("job_requests").update({
        status: "Rejected",
        rejection_reason: reason
      }).eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["jobRequests"]
      });
      toast({
        title: "Job Rejected",
        description: "Job request has been rejected"
      });
      setIsDetailsOpen(false);
      setIsRejectDialogOpen(false);
      setRejectionReason("");
    },
    onError: error => {
      toast({
        title: "Error",
        description: "Failed to reject job request",
        variant: "destructive"
      });
      console.error(error);
    }
  });
  const filteredJobs = jobRequests?.filter(job => {
    const matchesSearch = job.job_title.toLowerCase().includes(searchTerm.toLowerCase()) || job.job_short_description.toLowerCase().includes(searchTerm.toLowerCase()) || job.job_location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });
  const totalPages = Math.ceil((filteredJobs?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedJobs = filteredJobs?.slice(startIndex, startIndex + itemsPerPage);
  const handleViewDetails = (job: JobRequest) => {
    setSelectedJob(job);
    setIsDetailsOpen(true);
  };
  const handleApprove = () => {
    if (selectedJob) {
      approveMutation.mutate(selectedJob.id);
    }
  };
  const handleRejectClick = () => {
    setIsRejectDialogOpen(true);
  };
  const handleRejectConfirm = () => {
    if (selectedJob && rejectionReason.trim()) {
      rejectMutation.mutate({
        jobId: selectedJob.id,
        reason: rejectionReason
      });
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
      case "Approved":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Approved</Badge>;
      case "Rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  const getUrgencyBadge = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">Medium</Badge>;
      case "low":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{urgency}</Badge>;
    }
  };
  const renderPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1, 2);
      if (currentPage > 4) pages.push("...");
      for (let i = Math.max(3, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 3) pages.push("...");
      pages.push(totalPages - 1, totalPages);
    }
    return pages;
  };
  if (isLoading) {
    return <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>;
  }
  return <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Job Requests</h1>
        <p className="text-muted-foreground">Manage and review job requests</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search by title, description, or location..." value={searchTerm} onChange={e => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={value => {
        setStatusFilter(value);
        setCurrentPage(1);
      }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Title</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedJobs && paginatedJobs.length > 0 ? paginatedJobs.map(job => <TableRow key={job.id}>
                  <TableCell className="font-medium max-w-[200px]">
                    <div className="break-words">{job.job_title}</div>
                  </TableCell>
                  <TableCell className="max-w-[150px]">
                    <div className="break-words text-sm text-muted-foreground">{job.job_location}</div>
                  </TableCell>
                  <TableCell>{getUrgencyBadge(job.job_urgency)}</TableCell>
                  <TableCell>{job.job_budget || "Not specified"}</TableCell>
                  <TableCell>{getStatusBadge(job.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(job.created_at), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(job)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>) : <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No job requests found
                </TableCell>
              </TableRow>}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
            Previous
          </Button>
          {renderPageNumbers().map((page, index) => page === "..." ? <span key={`ellipsis-${index}`} className="px-2">
                ...
              </span> : <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page as number)}>
                {page}
              </Button>)}
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
            Next
          </Button>
        </div>}

      {/* Job Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Request Details</DialogTitle>
            <DialogDescription>
              Review the complete job request information
            </DialogDescription>
          </DialogHeader>

          {selectedJob && <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold break-words">{selectedJob.job_title}</h3>
                  <p className="text-muted-foreground mt-1">{selectedJob.job_short_description}</p>
                </div>
                <div className="flex gap-2">
                  {getUrgencyBadge(selectedJob.job_urgency)}
                  {getStatusBadge(selectedJob.status)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Start Date:</span>
                    <span>{format(new Date(selectedJob.job_start_date), "MMM dd, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Complete Date:</span>
                    <span>{format(new Date(selectedJob.job_complete_date), "MMM dd, yyyy")}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Location:</span>
                    <span className="break-words">{selectedJob.job_location}</span>
                  </div>
                  {selectedJob.job_budget && <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Budget:</span>
                      <span>{selectedJob.job_budget}</span>
                    </div>}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Full Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.job_full_description}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Special Requirements</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.job_special_requirements}</p>
              </div>

              {selectedJob.job_category_names && selectedJob.job_category_names.length > 0 && <div>
                  <h4 className="font-semibold mb-2">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.job_category_names.map((category, index) => <Badge key={index} variant="secondary">{category}</Badge>)}
                  </div>
                </div>}

              {selectedJob.job_tags_names && selectedJob.job_tags_names.length > 0 && <div>
                  <h4 className="font-semibold mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.job_tags_names.map((tag, index) => <Badge key={index} variant="outline">{tag}</Badge>)}
                  </div>
                </div>}

              {selectedJob.job_documents_images && selectedJob.job_documents_images.length > 0 && <div>
                  <h4 className="font-semibold mb-2">Documents/Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedJob.job_documents_images.map((url, index) => <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="relative aspect-video rounded-lg overflow-hidden border hover:opacity-80 transition-opacity">
                        <img src={url} alt={`Document ${index + 1}`} className="w-full h-full object-cover" />
                      </a>)}
                  </div>
                </div>}

              {selectedJob.user && <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="mb-3 font-bold">User Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {selectedJob.user.profile_picture_url ? (
                        <img 
                          src={selectedJob.user.profile_picture_url} 
                          alt={selectedJob.user.full_name || "User"} 
                          className="w-14 h-14 rounded-full object-cover" 
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-lg font-medium text-muted-foreground">
                            {selectedJob.user.full_name?.charAt(0) || "U"}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{selectedJob.user.full_name || "N/A"}</p>
                        {selectedJob.user.role && (
                          <p className="text-xs text-muted-foreground">{selectedJob.user.role}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex gap-2">
                        <span className="font-medium">Email:</span>
                        <span className="text-muted-foreground">{selectedJob.user.email}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium">Phone:</span>
                        <span className="text-muted-foreground">
                          {selectedJob.user.country_code} {selectedJob.user.phone_number}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>}

              {selectedJob.status === "Rejected" && selectedJob.rejection_reason && <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Rejection Reason</h4>
                  <p className="text-sm text-red-700">{selectedJob.rejection_reason}</p>
                </div>}

              {selectedJob.status === "Pending" && <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                    Close
                  </Button>
                  <Button variant="destructive" onClick={handleRejectClick} disabled={rejectMutation.isPending}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button onClick={handleApprove} disabled={approveMutation.isPending}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </DialogFooter>}
            </div>}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Job Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this job request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea id="rejection-reason" placeholder="Enter the reason for rejection..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="mt-2" rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
            setIsRejectDialogOpen(false);
            setRejectionReason("");
          }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={!rejectionReason.trim() || rejectMutation.isPending}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
export default JobRequests;