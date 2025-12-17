import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Check, X, Search, Users, Eye, Upload, Image as ImageIcon, Loader2, Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
interface Event {
  id: string;
  title: string;
  event_date: string;
  event_time: string;
  short_description: string;
  full_description: string;
  link_to_dolk_profile: boolean;
  where_to_host: string | null;
  location: string | null;
  meeting_url: string | null;
  tags: string[] | null;
  is_allowed: boolean | null;
  user_id: string;
  created_at: string;
  cover_picture: string | null;
  duration: string | null;
  category_id: string[] | null;
}
interface EventDocument {
  id: string;
  event_id: string;
  document_url: string;
  document_type: string;
}
interface InterestedUser {
  id: string;
  full_name: string | null;
  email: string;
  interest_type: string;
}
interface Category {
  id: string;
  name: string;
}
interface Tag {
  id: string;
  name: string;
}
export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | 'approve' | 'reject' | null;
    eventId: string | null;
  }>({
    open: false,
    type: null,
    eventId: null
  });
  const [interestedUsersDialog, setInterestedUsersDialog] = useState<{
    open: boolean;
    eventId: string | null;
    eventTitle: string;
  }>({
    open: false,
    eventId: null,
    eventTitle: ""
  });
  const [interestedUsers, setInterestedUsers] = useState<InterestedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [eventDetailsDialog, setEventDetailsDialog] = useState<{
    open: boolean;
    event: Event | null;
  }>({
    open: false,
    event: null
  });
  const [eventDocuments, setEventDocuments] = useState<EventDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    event_date: "",
    event_time: "",
    duration: "",
    short_description: "",
    category_id: "",
    full_description: "",
    link_to_dolk_profile: false,
    where_to_host: "",
    location: "",
    meeting_url: "",
    tags: [] as string[]
  });
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [coverPictureFile, setCoverPictureFile] = useState<File | null>(null);
  const [coverPicturePreview, setCoverPicturePreview] = useState<string | null>(null);
  useEffect(() => {
    fetchEvents();
    fetchCategories();
    fetchTags();
  }, []);
  const fetchEvents = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("events").select("*").order("created_at", {
        ascending: false
      });
      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchCategories = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("categories").select("id, name").order("name");
      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Error fetching categories:", error.message);
    }
  };
  const fetchTags = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("tags").select("id, name").order("name");
      if (error) throw error;
      setTags(data || []);
    } catch (error: any) {
      console.error("Error fetching tags:", error.message);
    }
  };
  const handleApproval = async (isAllowed: boolean) => {
    if (!confirmDialog.eventId) return;
    try {
      const {
        error
      } = await supabase.from("events").update({
        is_allowed: isAllowed
      }).eq("id", confirmDialog.eventId);
      if (error) throw error;
      toast({
        title: "Success",
        description: `Event ${isAllowed ? "approved" : "rejected"} successfully`
      });
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setConfirmDialog({
        open: false,
        type: null,
        eventId: null
      });
    }
  };
  const uploadCoverPicture = async (eventId: string): Promise<string | null> => {
    if (!coverPictureFile) return null;
    const fileExt = coverPictureFile.name.split(".").pop();
    const fileName = `covers/${eventId}/${Date.now()}.${fileExt}`;
    const {
      error: uploadError
    } = await supabase.storage.from("event-documents").upload(fileName, coverPictureFile);
    if (uploadError) throw uploadError;
    const {
      data: {
        publicUrl
      }
    } = supabase.storage.from("event-documents").getPublicUrl(fileName);
    return publicUrl;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (formData.meeting_url && formData.meeting_url.trim()) {
        const urlSchema = z.string().url({
          message: "Invalid URL format"
        });
        const result = urlSchema.safeParse(formData.meeting_url.trim());
        if (!result.success) {
          toast({
            title: "Validation Error",
            description: "Please enter a valid meeting URL",
            variant: "destructive"
          });
          return;
        }
      }
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get tag names from selected tag IDs
      const selectedTagNames = formData.tags.map(tagId => tags.find(t => t.id === tagId)?.name).filter(Boolean) as string[];
      let coverPictureUrl = editingEvent?.cover_picture || null;
      const eventData = {
        title: formData.title.trim(),
        event_date: formData.event_date,
        event_time: formData.event_time,
        duration: formData.duration.trim() || null,
        short_description: formData.short_description.trim(),
        category_id: formData.category_id ? [formData.category_id] : null,
        type: "event",
        // Default type value
        full_description: formData.full_description.trim(),
        link_to_dolk_profile: formData.link_to_dolk_profile,
        where_to_host: formData.where_to_host || null,
        location: formData.location.trim() || null,
        meeting_url: formData.meeting_url.trim() || null,
        tags: selectedTagNames.length > 0 ? selectedTagNames : null,
        user_id: user.id,
        is_allowed: editingEvent ? null : true,
        cover_picture: coverPictureUrl
      };
      let eventId: string;
      if (editingEvent) {
        // Upload cover picture if new one selected
        if (coverPictureFile) {
          coverPictureUrl = await uploadCoverPicture(editingEvent.id);
          eventData.cover_picture = coverPictureUrl;
        }
        const {
          error
        } = await supabase.from("events").update(eventData).eq("id", editingEvent.id);
        if (error) throw error;
        eventId = editingEvent.id;
        toast({
          title: "Success",
          description: "Event updated successfully. Pending admin approval."
        });
      } else {
        const {
          data,
          error
        } = await supabase.from("events").insert([eventData]).select().single();
        if (error) throw error;
        eventId = data.id;

        // Upload cover picture for new event
        if (coverPictureFile) {
          coverPictureUrl = await uploadCoverPicture(eventId);
          await supabase.from("events").update({
            cover_picture: coverPictureUrl
          }).eq("id", eventId);
        }
        toast({
          title: "Success",
          description: "Event created successfully"
        });
      }
      if (selectedFiles && selectedFiles.length > 0) {
        await uploadDocuments(eventId);
      }
      setIsDialogOpen(false);
      resetForm();
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  const uploadDocuments = async (eventId: string) => {
    if (!selectedFiles) return;
    setUploading(true);
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${eventId}/${Date.now()}_${i}.${fileExt}`;
        const {
          error: uploadError
        } = await supabase.storage.from("event-documents").upload(fileName, file);
        if (uploadError) throw uploadError;
        const {
          data: {
            publicUrl
          }
        } = supabase.storage.from("event-documents").getPublicUrl(fileName);
        const {
          error: docError
        } = await supabase.from("event_documents").insert({
          event_id: eventId,
          document_url: publicUrl,
          document_type: file.type
        });
        if (docError) throw docError;
      }
      toast({
        title: "Success",
        description: "Documents uploaded successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error uploading documents",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  const handleDelete = async () => {
    if (!confirmDialog.eventId) return;
    try {
      const {
        error
      } = await supabase.from("events").delete().eq("id", confirmDialog.eventId);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Event deleted successfully"
      });
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setConfirmDialog({
        open: false,
        type: null,
        eventId: null
      });
    }
  };
  const handleConfirmAction = () => {
    if (confirmDialog.type === 'delete') {
      handleDelete();
    } else if (confirmDialog.type === 'approve') {
      handleApproval(true);
    } else if (confirmDialog.type === 'reject') {
      handleApproval(false);
    }
  };
  const fetchInterestedUsers = async (eventId: string) => {
    setLoadingUsers(true);
    try {
      const {
        data: interests,
        error: interestsError
      } = await supabase.from("event_interests").select("user_id, interest_type").eq("event_id", eventId);
      if (interestsError) throw interestsError;
      if (!interests || interests.length === 0) {
        setInterestedUsers([]);
        return;
      }
      const userIds = interests.map(i => i.user_id);
      const {
        data: profiles,
        error: profilesError
      } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds);
      if (profilesError) throw profilesError;
      const users = interests.map((interest: any) => {
        const profile = profiles.find((p: any) => p.user_id === interest.user_id);
        return {
          id: interest.user_id,
          full_name: profile?.full_name || null,
          email: profile?.email || "N/A",
          interest_type: interest.interest_type
        };
      });
      setInterestedUsers(users);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingUsers(false);
    }
  };
  const handleViewInterestedUsers = async (event: Event) => {
    setInterestedUsersDialog({
      open: true,
      eventId: event.id,
      eventTitle: event.title
    });
    await fetchInterestedUsers(event.id);
  };
  const fetchEventDocuments = async (eventId: string) => {
    setLoadingDocuments(true);
    try {
      const {
        data,
        error
      } = await supabase.from("event_documents").select("*").eq("event_id", eventId);
      if (error) throw error;
      setEventDocuments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingDocuments(false);
    }
  };
  const handleViewEventDetails = async (event: Event) => {
    setEventDetailsDialog({
      open: true,
      event: event
    });
    await fetchEventDocuments(event.id);
  };
  const handleEdit = (event: Event) => {
    setEditingEvent(event);

    // Find tag IDs from tag names
    const tagIds = event.tags ? event.tags.map(tagName => tags.find(t => t.name === tagName)?.id).filter(Boolean) as string[] : [];
    setFormData({
      title: event.title,
      event_date: event.event_date,
      event_time: event.event_time,
      duration: event.duration || "",
      short_description: event.short_description,
      category_id: event.category_id?.[0] || "",
      full_description: event.full_description,
      link_to_dolk_profile: event.link_to_dolk_profile,
      where_to_host: event.where_to_host || "",
      location: event.location || "",
      meeting_url: event.meeting_url || "",
      tags: tagIds
    });
    setCoverPicturePreview(event.cover_picture || null);
    setIsDialogOpen(true);
  };
  const resetForm = () => {
    setFormData({
      title: "",
      event_date: "",
      event_time: "",
      duration: "",
      short_description: "",
      category_id: "",
      full_description: "",
      link_to_dolk_profile: false,
      where_to_host: "",
      location: "",
      meeting_url: "",
      tags: []
    });
    setEditingEvent(null);
    setSelectedFiles(null);
    setCoverPictureFile(null);
    setCoverPicturePreview(null);
  };
  const handleCoverPictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverPictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId) ? prev.tags.filter(id => id !== tagId) : [...prev.tags, tagId]
    }));
  };
  const getCategoryName = (categoryId: string[] | null) => {
    if (!categoryId || categoryId.length === 0) return "N/A";
    return categories.find(c => c.id === categoryId[0])?.name || "N/A";
  };
  const filteredEvents = events.filter(event => event.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEvents = filteredEvents.slice(startIndex, endIndex);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  const renderPaginationItems = () => {
    const items = [];
    if (totalPages <= 4) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(<PaginationItem key={i}>
            <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>);
      }
    } else {
      items.push(<PaginationItem key={1}>
          <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>);
      if (currentPage <= 2) {
        items.push(<PaginationItem key={2}>
            <PaginationLink onClick={() => handlePageChange(2)} isActive={currentPage === 2}>
              2
            </PaginationLink>
          </PaginationItem>);
      }
      if (currentPage > 2 && currentPage < totalPages - 1) {
        items.push(<PaginationItem key="ellipsis-1">
            <PaginationEllipsis />
          </PaginationItem>);
        items.push(<PaginationItem key={currentPage}>
            <PaginationLink onClick={() => handlePageChange(currentPage)} isActive={true}>
              {currentPage}
            </PaginationLink>
          </PaginationItem>);
      }
      if (currentPage < totalPages - 1) {
        items.push(<PaginationItem key="ellipsis-2">
            <PaginationEllipsis />
          </PaginationItem>);
      }
      if (currentPage >= totalPages - 1) {
        items.push(<PaginationItem key={totalPages - 1}>
            <PaginationLink onClick={() => handlePageChange(totalPages - 1)} isActive={currentPage === totalPages - 1}>
              {totalPages - 1}
            </PaginationLink>
          </PaginationItem>);
      }
      items.push(<PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>);
    }
    return items;
  };
  const getApprovalBadge = (isAllowed: boolean | null) => {
    if (isAllowed === null) return <span className="text-yellow-500">Pending</span>;
    if (isAllowed) return <span className="text-green-500">Approved</span>;
    return <span className="text-red-500">Rejected</span>;
  };
  return <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Events Management</h1>
          <p className="text-muted-foreground">Manage and approve crew events</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={open => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Cover Picture */}
              <div>
                <Label>Cover Picture</Label>
                <div className="mt-2">
                  {coverPicturePreview ? <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                      <img src={coverPicturePreview} alt="Cover preview" className="w-full h-full object-cover" />
                      <label className="absolute top-2 right-2 cursor-pointer">
                        <Button type="button" variant="secondary" size="sm" asChild>
                          <span>
                            <Edit className="h-4 w-4 mr-1" /> Change
                          </span>
                        </Button>
                        <input type="file" className="hidden" accept="image/*" onChange={handleCoverPictureChange} />
                      </label>
                    </div> : <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="w-10 h-10 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          Click to upload cover picture
                        </p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleCoverPictureChange} />
                    </label>}
                </div>
              </div>

              {/* Event Title */}
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input id="title" value={formData.title} onChange={e => setFormData({
                ...formData,
                title: e.target.value
              })} required className="my-[4px]" />
              </div>

              {/* Date, Time, Duration */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="event_date">Event Date *</Label>
                  <Input id="event_date" type="date" value={formData.event_date} onChange={e => setFormData({
                  ...formData,
                  event_date: e.target.value
                })} required className="my-[5px]" />
                </div>
                <div>
                  <Label htmlFor="event_time">Event Time *</Label>
                  <Input id="event_time" type="time" value={formData.event_time} onChange={e => setFormData({
                  ...formData,
                  event_time: e.target.value
                })} required className="my-[5px]" />
                </div>
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input id="duration" value={formData.duration} onChange={e => setFormData({
                  ...formData,
                  duration: e.target.value
                })} placeholder="e.g., 2 hours" className="my-[5px]" />
                </div>
              </div>

              {/* Short Description */}
              <div>
                <Label htmlFor="short_description">Short Description *</Label>
                <Textarea id="short_description" value={formData.short_description} onChange={e => setFormData({
                ...formData,
                short_description: e.target.value
              })} required className="my-[5px]" />
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category_id">Category</Label>
                <Select value={formData.category_id} onValueChange={value => setFormData({
                ...formData,
                category_id: value
              })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Full Description */}
              <div>
                <Label htmlFor="full_description">Full Description *</Label>
                <Textarea id="full_description" value={formData.full_description} onChange={e => setFormData({
                ...formData,
                full_description: e.target.value
              })} rows={5} required className="my-[5px]" />
              </div>

              {/* Where to Host */}
              <div>
                <Label htmlFor="where_to_host">Where to Host</Label>
                <Select value={formData.where_to_host} onValueChange={value => setFormData({
                ...formData,
                where_to_host: value
              })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select hosting type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="in-person">In Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location (for in-person) */}
              {formData.where_to_host === "in-person" && <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input id="location" value={formData.location} onChange={e => setFormData({
                ...formData,
                location: e.target.value
              })} placeholder="Enter event location" required />
                </div>}

              {/* Meeting URL (for online) */}
              {formData.where_to_host === "online" && <div>
                  <Label htmlFor="meeting_url">Meeting URL</Label>
                  <Input id="meeting_url" type="url" value={formData.meeting_url} onChange={e => setFormData({
                ...formData,
                meeting_url: e.target.value
              })} placeholder="https://zoom.us/j/... or https://meet.google.com/..." />
                </div>}

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="mt-2 flex flex-wrap gap-2 p-3 border rounded-lg max-h-32 overflow-y-auto">
                  {tags.length === 0 ? <p className="text-sm text-muted-foreground">No tags available</p> : tags.map(tag => <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox id={`tag-${tag.id}`} checked={formData.tags.includes(tag.id)} onCheckedChange={() => handleTagToggle(tag.id)} />
                        <label htmlFor={`tag-${tag.id}`} className="text-sm cursor-pointer">
                          {tag.name}
                        </label>
                      </div>)}
                </div>
              </div>

              {/* Show Personal Details */}
              <div className="flex items-center space-x-2">
                <Checkbox id="link_to_dolk_profile" checked={formData.link_to_dolk_profile} onCheckedChange={checked => setFormData({
                ...formData,
                link_to_dolk_profile: checked as boolean
              })} />
                <Label htmlFor="link_to_dolk_profile">Show Personal Details</Label>
              </div>

              {/* Documents Upload */}
              <div>
                <Label htmlFor="documents">Documents/Images (Multiple)</Label>
                <Input id="documents" type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={e => setSelectedFiles(e.target.files)} className="mt-1" />
                {selectedFiles && selectedFiles.length > 0 && <p className="text-sm text-muted-foreground mt-1">{selectedFiles.length} file(s) selected</p>}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || uploading}>
                  {submitting ? <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingEvent ? "Updating..." : "Creating..."}
                    </> : editingEvent ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search events..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="border rounded-lg bg-white">
        {loading ? <div className="p-8 text-center">Loading events...</div> : filteredEvents.length === 0 ? <div className="p-8 text-center text-muted-foreground">No Events Found</div> : <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Interested</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentEvents.map(event => <TableRow key={event.id} className="border-b">
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{getCategoryName(event.category_id)}</TableCell>
                    <TableCell>
                      {format(new Date(event.event_date), "MMM dd, yyyy")} at {event.event_time}
                    </TableCell>
                    <TableCell>{getApprovalBadge(event.is_allowed)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => handleViewInterestedUsers(event)}>
                        <Users className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewEventDetails(event)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {event.is_allowed === null && <>
                            <Button size="sm" variant="outline" onClick={() => setConfirmDialog({
                      open: true,
                      type: 'approve',
                      eventId: event.id
                    })} className="text-green-600 hover:text-green-700">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setConfirmDialog({
                      open: true,
                      type: 'reject',
                      eventId: event.id
                    })} className="text-red-600 hover:text-red-700">
                              <X className="h-4 w-4" />
                            </Button>
                          </>}
                        <Button size="sm" variant="outline" onClick={() => handleEdit(event)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmDialog({
                    open: true,
                    type: 'delete',
                    eventId: event.id
                  })} className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div>}
      </div>

      {!loading && filteredEvents.length > itemsPerPage && <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>}

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={open => !open && setConfirmDialog({
      open: false,
      type: null,
      eventId: null
    })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === 'delete' && 'Delete Event'}
              {confirmDialog.type === 'approve' && 'Approve Event'}
              {confirmDialog.type === 'reject' && 'Reject Event'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === 'delete' && 'Are you sure you want to delete this event? This action cannot be undone.'}
              {confirmDialog.type === 'approve' && 'Are you sure you want to approve this event? It will be visible to all users.'}
              {confirmDialog.type === 'reject' && 'Are you sure you want to reject this event? The creator will be notified.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              {confirmDialog.type === 'delete' && 'Delete'}
              {confirmDialog.type === 'approve' && 'Approve'}
              {confirmDialog.type === 'reject' && 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Interested Users Dialog */}
      <Dialog open={interestedUsersDialog.open} onOpenChange={open => !open && setInterestedUsersDialog({
      open: false,
      eventId: null,
      eventTitle: ""
    })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Interested Users - {interestedUsersDialog.eventTitle}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {loadingUsers ? <div className="p-8 text-center">Loading interested users...</div> : interestedUsers.length === 0 ? <div className="p-8 text-center text-muted-foreground">
                No users have shown interest in this event yet.
              </div> : <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Interest</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interestedUsers.map(user => <TableRow key={user.id}>
                        <TableCell>{user.full_name || "N/A"}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.interest_type === 'yes' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : user.interest_type === 'no' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                            {user.interest_type.charAt(0).toUpperCase() + user.interest_type.slice(1)}
                          </span>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </div>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={eventDetailsDialog.open} onOpenChange={open => !open && setEventDetailsDialog({
      open: false,
      event: null
    })}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {eventDetailsDialog.event && <div className="space-y-6">
              {/* Cover Picture */}
              {eventDetailsDialog.event.cover_picture && <div>
                  <Label className="text-muted-foreground">Cover Picture</Label>
                  <div className="mt-2 w-full h-48 rounded-lg overflow-hidden border">
                    <img src={eventDetailsDialog.event.cover_picture} alt="Event cover" className="w-full h-full object-cover" />
                  </div>
                </div>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Event Title</Label>
                  <p className="font-medium">{eventDetailsDialog.event.title}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium">{getCategoryName(eventDetailsDialog.event.category_id)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Event Date</Label>
                  <p className="font-medium">
                    {format(new Date(eventDetailsDialog.event.event_date), "MMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Event Time</Label>
                  <p className="font-medium">{eventDetailsDialog.event.event_time}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Duration</Label>
                  <p className="font-medium">{eventDetailsDialog.event.duration || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getApprovalBadge(eventDetailsDialog.event.is_allowed)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Where to Host</Label>
                  <p className="font-medium capitalize">{eventDetailsDialog.event.where_to_host || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Show Personal Details</Label>
                  <p className="font-medium">{eventDetailsDialog.event.link_to_dolk_profile ? "Yes" : "No"}</p>
                </div>
              </div>

              {eventDetailsDialog.event.location && <div>
                  <Label className="text-muted-foreground">Location</Label>
                  <p className="font-medium">{eventDetailsDialog.event.location}</p>
                </div>}

              {eventDetailsDialog.event.meeting_url && <div>
                  <Label className="text-muted-foreground">Meeting URL</Label>
                  <a href={eventDetailsDialog.event.meeting_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium mx-[10px] my-0 px-0 py-0">
                    {eventDetailsDialog.event.meeting_url}
                  </a>
                </div>}

              <div>
                <Label className="text-muted-foreground">Short Description</Label>
                <p className="font-medium">{eventDetailsDialog.event.short_description}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Full Description</Label>
                <p className="whitespace-pre-wrap">{eventDetailsDialog.event.full_description}</p>
              </div>

              {eventDetailsDialog.event.tags && eventDetailsDialog.event.tags.length > 0 && <div>
                  <Label className="text-muted-foreground">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {eventDetailsDialog.event.tags.map((tag, index) => <span key={index} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                        {tag}
                      </span>)}
                  </div>
                </div>}

              <div>
                <Label className="text-muted-foreground">Documents</Label>
                {loadingDocuments ? <div className="p-4 text-center text-muted-foreground">Loading documents...</div> : eventDocuments.length === 0 ? <p className="text-muted-foreground mt-2">No documents uploaded</p> : <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    {eventDocuments.map(doc => {
                      const isPdf = doc.document_type === "application/pdf" || doc.document_url.toLowerCase().endsWith('.pdf');
                      const isImage = doc.document_type.startsWith("image/");
                      
                      return (
                        <div key={doc.id} className="relative rounded-lg overflow-hidden border">
                          {isImage ? (
                            <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="block aspect-video hover:opacity-80 transition-opacity">
                              <img src={doc.document_url} alt="Event document" className="w-full h-full object-cover" />
                            </a>
                          ) : (
                            <div className="aspect-video flex flex-col items-center justify-center bg-muted p-2">
                              <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                              <span className="text-xs text-muted-foreground mb-2">
                                {doc.document_type.split("/")[1]?.toUpperCase() || "DOC"}
                              </span>
                              <div className="flex gap-2">
                                {isPdf && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(doc.document_url)}&embedded=true`;
                                      window.open(viewerUrl, '_blank');
                                    }}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = doc.document_url;
                                    link.download = doc.document_url.split('/').pop() || 'document';
                                    link.target = '_blank';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>}
              </div>
            </div>}
        </DialogContent>
      </Dialog>
    </div>;
}