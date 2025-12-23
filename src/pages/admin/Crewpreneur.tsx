import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Trash2, CheckCircle, XCircle, Loader2, Download } from "lucide-react";
import { format } from "date-fns";
import { ConvertibleImage } from "@/components/ConvertibleImage";
import { ConvertibleAvatar } from "@/components/ConvertibleAvatar";

interface Project {
  id: string;
  user_id: string;
  title: string;
  short_description: string;
  full_description: string;
  type: string;
  visuals: string[] | null;
  documents: string | null;
  tags: string[] | null;
  link_to_dolks_profile: boolean;
  what_looking_for: string | null;
  status: string;
  rejection_reason: string | null;
  category_id: string | null;
  category_names: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
    phone_number: string | null;
    country_code: string | null;
    profile_picture_url: string | null;
    role: string | null;
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

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["crewpreneur-projects"],
    queryFn: async () => {
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;

      const projectsWithDetails = await Promise.all(
        (projectsData || []).map(async (project) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, email, phone_number, country_code, profile_picture_url, role")
            .eq("user_id", project.user_id)
            .maybeSingle();

          return {
            ...project,
            profiles: profileData,
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
      toast({ title: "Project Approved", description: "Project has been approved successfully" });
      setIsViewDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ projectId, reason }: { projectId: string; reason: string }) => {
      const { error } = await supabase
        .from("projects")
        .update({ status: "Rejected", rejection_reason: reason || null })
        .eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crewpreneur-projects"] });
      toast({ title: "Project Rejected", description: "Project has been rejected" });
      setIsViewDialogOpen(false);
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      setRejectingProject(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crewpreneur-projects"] });
      toast({ title: "Project Deleted", description: "Project has been deleted successfully" });
      setDeleteConfirm({ open: false, project: null });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleViewDetails = (project: Project) => {
    setViewingProject(project);
    setIsViewDialogOpen(true);
  };

  const handleApprove = () => {
    if (viewingProject) {
      approveMutation.mutate(viewingProject.id);
    }
  };

  const handleRejectClick = () => {
    if (viewingProject) {
      setRejectingProject(viewingProject);
      setIsRejectDialogOpen(true);
    }
  };

  const handleRejectConfirm = () => {
    if (rejectingProject) {
      rejectMutation.mutate({ projectId: rejectingProject.id, reason: rejectionReason });
    }
  };

  const handleDeleteClick = (project: Project) => {
    setDeleteConfirm({ open: true, project });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.project) {
      deleteMutation.mutate(deleteConfirm.project.id);
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

  const isImageUrl = (url: string) => {
    // Check for image extensions anywhere in the URL (handles query params)
    return /\.(jpg|jpeg|png|gif|webp|svg|heic)/i.test(url);
  };

  const isDocumentUrl = (url: string) => {
    // Check for document extensions anywhere in the URL
    return /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv)/i.test(url);
  };

  const getDocumentName = (url: string) => {
    try {
      const pathname = new URL(url).pathname;
      const filename = pathname.split('/').pop() || 'Document';
      return decodeURIComponent(filename);
    } catch {
      return 'Document';
    }
  };

  const getCategoryNamesArray = (categoryNames: string | null): string[] => {
    if (!categoryNames) return [];
    try {
      const parsed = JSON.parse(categoryNames);
      return Array.isArray(parsed) ? parsed : [categoryNames];
    } catch {
      return categoryNames ? [categoryNames] : [];
    }
  };

  const parseCategoryNames = (categoryNames: string | null): string => {
    const names = getCategoryNamesArray(categoryNames);
    return names.join(", ");
  };

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
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
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Crewpreneur Projects</h1>
        <p className="text-muted-foreground">Manage and review crewpreneur project submissions</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by title, description, or user..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
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

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Title</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Short Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProjects.length > 0 ? (
              paginatedProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium max-w-[200px]">
                    <div className="break-words">{project.title}</div>
                  </TableCell>
                  <TableCell className="max-w-[150px]">
                    <div className="break-words text-sm">{project.profiles?.full_name || project.profiles?.email || "N/A"}</div>
                  </TableCell>
                  <TableCell className="max-w-[250px]">
                    <div className="break-words text-sm text-muted-foreground line-clamp-2">{project.short_description}</div>
                  </TableCell>
                  <TableCell>{getStatusBadge(project.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(project.created_at), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewDetails(project)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(project)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No projects found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          {renderPageNumbers().map((page, index) =>
            page === "..." ? (
              <span key={`ellipsis-${index}`} className="px-2">...</span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page as number)}
              >
                {page}
              </Button>
            )
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Project Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
            <DialogDescription>Review the complete project information</DialogDescription>
          </DialogHeader>

          {viewingProject && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold break-words">{viewingProject.title}</h3>
                  <p className="text-muted-foreground mt-1">{viewingProject.short_description}</p>
                </div>
                <div>{getStatusBadge(viewingProject.status)}</div>
              </div>

              {/* User Information Section */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-semibold mb-3">User Information</h4>
                <div className="flex items-start gap-4">
                  <ConvertibleAvatar
                    src={viewingProject.profiles?.profile_picture_url}
                    alt="Profile"
                    fallback={viewingProject.profiles?.full_name?.charAt(0) || "U"}
                    className="w-16 h-16"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                    <div>
                      <p className="text-xs text-muted-foreground">Full Name</p>
                      <p className="text-sm font-medium">{viewingProject.profiles?.full_name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{viewingProject.profiles?.email || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Contact Number</p>
                      <p className="text-sm font-medium">
                        {viewingProject.profiles?.phone_number 
                          ? `${viewingProject.profiles?.country_code || ''} ${viewingProject.profiles.phone_number}`
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Role</p>
                      <p className="text-sm font-medium">{viewingProject.profiles?.role || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Category</h4>
                  <div className="flex flex-wrap gap-1">
                    {getCategoryNamesArray(viewingProject.category_names).length > 0 ? (
                      getCategoryNamesArray(viewingProject.category_names).map((cat, idx) => (
                        <Badge key={idx} variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">{cat}</Badge>
                      ))
                    ) : (
                      <span className="text-sm">{viewingProject.type || "-"}</span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Show Personal Details</h4>
                  <p className="text-sm">{viewingProject.link_to_dolks_profile ? "Yes" : "No"}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Created At</h4>
                  <p className="text-sm">{format(new Date(viewingProject.created_at), "MMM dd, yyyy HH:mm")}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Full Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingProject.full_description}</p>
              </div>

              {viewingProject.what_looking_for && (
                <div>
                  <h4 className="font-semibold mb-2">What Looking For?</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingProject.what_looking_for}</p>
                </div>
              )}

              {viewingProject.tags && viewingProject.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingProject.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Pictures */}
              <div>
                <h4 className="font-semibold mb-2">Project Pictures</h4>
                {viewingProject.visuals && viewingProject.visuals.filter(isImageUrl).length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {viewingProject.visuals.filter(isImageUrl).map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative aspect-video rounded-lg overflow-hidden border hover:opacity-80 transition-opacity"
                      >
                        <ConvertibleImage src={url} alt={`Picture ${index + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No pictures uploaded</p>
                )}
              </div>

              {/* Project Documents */}
              <div>
                <h4 className="font-semibold mb-2">Project Documents</h4>
                {(() => {
                  // Parse documents - could be JSON array string or single URL
                  let docUrls: string[] = [];
                  if (viewingProject.documents) {
                    try {
                      const parsed = JSON.parse(viewingProject.documents);
                      docUrls = Array.isArray(parsed) ? parsed : [viewingProject.documents];
                    } catch {
                      docUrls = [viewingProject.documents];
                    }
                  }
                  
                  return docUrls.length > 0 ? (
                    <div className="space-y-2">
                      {docUrls.map((url, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-3 p-3 bg-muted rounded-lg border"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">
                                {url.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv)/i)?.[1]?.toUpperCase() || 'DOC'}
                              </span>
                            </div>
                            <span className="text-sm truncate">{getDocumentName(url)}</span>
                          </div>
                          <div className="flex gap-2">
                            {url.toLowerCase().endsWith('.pdf') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
                                  window.open(viewerUrl, '_blank');
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = getDocumentName(url);
                                link.target = '_blank';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No documents uploaded</p>
                  );
                })()}
              </div>

              {viewingProject.status === "Rejected" && viewingProject.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Rejection Reason</h4>
                  <p className="text-sm text-red-700">{viewingProject.rejection_reason}</p>
                </div>
              )}

              {viewingProject.status === "Pending" && (
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
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
                </DialogFooter>
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
            <DialogDescription>Provide a reason for rejecting this project (optional)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason for rejection</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="mt-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRejectConfirm} disabled={rejectMutation.isPending}>
                {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Crewpreneur;
