import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Trash2, Check, X, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Project {
  id: string;
  user_id: string;
  title: string;
  short_description: string;
  full_description: string;
  type: string;
  visuals: string[] | null;
  tags: string[] | null;
  link_to_dolks_profile: boolean;
  what_looking_for: string | null;
  status: string;
  rejection_reason: string | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  } | null;
  categories?: {
    name: string;
  } | null;
}

const ITEMS_PER_PAGE = 10;

const Crewpreneur = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectingProject, setRejectingProject] = useState<Project | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; project: Project | null }>({ open: false, project: null });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["crewpreneur-projects"],
    queryFn: async () => {
      // First fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;

      // Then fetch profiles for each project
      const projectsWithDetails = await Promise.all(
        (projectsData || []).map(async (project) => {
          // Fetch profile by matching profiles.id to project.user_id
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", project.user_id)
            .maybeSingle();

          // Fetch category if exists
          let categoryData = null;
          if (project.category_id) {
            const { data: catData } = await supabase
              .from("categories")
              .select("name")
              .eq("id", project.category_id)
              .maybeSingle();
            categoryData = catData;
          }

          return {
            ...project,
            profiles: profileData,
            categories: categoryData,
          };
        })
      );

      return projectsWithDetails as Project[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from("projects")
        .update({ status: "Approved", rejection_reason: null })
        .eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crewpreneur-projects"] });
      toast({ title: "Success", description: "Project approved successfully" });
      setActionLoading(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setActionLoading(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ projectId, reason }: { projectId: string; reason: string }) => {
      const { error } = await supabase
        .from("projects")
        .update({ status: "Rejected", rejection_reason: reason })
        .eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crewpreneur-projects"] });
      toast({ title: "Success", description: "Project rejected" });
      setIsRejectDialogOpen(false);
      setRejectingProject(null);
      setRejectionReason("");
      setActionLoading(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setActionLoading(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crewpreneur-projects"] });
      toast({ title: "Success", description: "Project deleted successfully" });
      setDeleteConfirm({ open: false, project: null });
      setActionLoading(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setActionLoading(null);
    },
  });

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.short_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProjects = filteredProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleApprove = (project: Project) => {
    setActionLoading(project.id);
    approveMutation.mutate(project.id);
  };

  const handleReject = (project: Project) => {
    setRejectingProject(project);
    setRejectionReason("");
    setIsRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (rejectingProject) {
      setActionLoading(rejectingProject.id);
      rejectMutation.mutate({ projectId: rejectingProject.id, reason: rejectionReason });
    }
  };

  const handleDelete = (project: Project) => {
    setDeleteConfirm({ open: true, project });
  };

  const confirmDelete = () => {
    if (deleteConfirm.project) {
      setActionLoading(deleteConfirm.project.id);
      deleteMutation.mutate(deleteConfirm.project.id);
    }
  };

  const handleView = (project: Project) => {
    setViewingProject(project);
    setIsViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case "Rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, 2);
      if (currentPage > 4) pages.push("...");
      const start = Math.max(3, currentPage - 1);
      const end = Math.min(totalPages - 2, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 3) pages.push("...");
      if (!pages.includes(totalPages - 1)) pages.push(totalPages - 1);
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return (
      <div className="flex items-center justify-center gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
          Previous
        </Button>
        {pages.map((page, idx) =>
          typeof page === "string" ? (
            <span key={`ellipsis-${idx}`} className="px-2">...</span>
          ) : (
            <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)}>
              {page}
            </Button>
          )
        )}
        <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
          Next
        </Button>
      </div>
    );
  };

  const isImageUrl = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Crewpreneur Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by title, description, or user..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No projects found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{project.title}</TableCell>
                      <TableCell>{project.profiles?.full_name || project.profiles?.email || "Unknown"}</TableCell>
                      <TableCell>{project.categories?.name || project.type || "-"}</TableCell>
                      <TableCell>{getStatusBadge(project.status)}</TableCell>
                      <TableCell>{format(new Date(project.created_at), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleView(project)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {project.status === "Pending" && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleApprove(project)} disabled={actionLoading === project.id}>
                                {actionLoading === project.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-600" />}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleReject(project)} disabled={actionLoading === project.id}>
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(project)} disabled={actionLoading === project.id}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {renderPagination()}
        </CardContent>
      </Card>

      {/* View Project Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
          </DialogHeader>
          {viewingProject && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Project Title</Label>
                  <p className="font-medium break-words">{viewingProject.title}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(viewingProject.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Submitted By</Label>
                  <p className="font-medium">{viewingProject.profiles?.full_name || "N/A"}</p>
                  <p className="text-sm text-muted-foreground">{viewingProject.profiles?.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium">{viewingProject.categories?.name || viewingProject.type || "-"}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Short Description</Label>
                <p className="mt-1 break-words">{viewingProject.short_description}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Full Description</Label>
                <p className="mt-1 whitespace-pre-wrap break-words">{viewingProject.full_description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Show Personal Details</Label>
                  <p className="font-medium">{viewingProject.link_to_dolks_profile ? "Yes" : "No"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created At</Label>
                  <p className="font-medium">{format(new Date(viewingProject.created_at), "MMM dd, yyyy HH:mm")}</p>
                </div>
              </div>

              {viewingProject.what_looking_for && (
                <div>
                  <Label className="text-muted-foreground">What Looking For?</Label>
                  <p className="mt-1 break-words">{viewingProject.what_looking_for}</p>
                </div>
              )}

              {viewingProject.tags && viewingProject.tags.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {viewingProject.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {viewingProject.visuals && viewingProject.visuals.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Project Pictures/Documents</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    {viewingProject.visuals.map((url, idx) =>
                      isImageUrl(url) ? (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={url} alt={`Visual ${idx + 1}`} className="w-full h-32 object-cover rounded-lg border hover:opacity-80 transition-opacity" />
                        </a>
                      ) : (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-32 bg-muted rounded-lg border hover:bg-muted/80 transition-colors">
                          <span className="text-sm text-muted-foreground">Document {idx + 1}</span>
                        </a>
                      )
                    )}
                  </div>
                </div>
              )}

              {viewingProject.status === "Rejected" && viewingProject.rejection_reason && (
                <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <Label className="text-destructive">Rejection Reason</Label>
                  <p className="mt-1 text-destructive">{viewingProject.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason for rejection (optional)</Label>
              <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Enter rejection reason..." className="mt-2" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmReject} disabled={actionLoading === rejectingProject?.id}>
                {actionLoading === rejectingProject?.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm.project?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {actionLoading === deleteConfirm.project?.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Crewpreneur;
