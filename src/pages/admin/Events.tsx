import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Check, X, Search, Users } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

interface Event {
  id: string;
  title: string;
  event_date: string;
  event_time: string;
  short_description: string;
  type: string;
  full_description: string;
  link_to_dolk_profile: boolean;
  where_to_host: string | null;
  location: string | null;
  meeting_url: string | null;
  tags: string[] | null;
  is_allowed: boolean | null;
  user_id: string;
  created_at: string;
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
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | 'approve' | 'reject' | null;
    eventId: string | null;
  }>({ open: false, type: null, eventId: null });
  const [interestedUsersDialog, setInterestedUsersDialog] = useState<{
    open: boolean;
    eventId: string | null;
    eventTitle: string;
  }>({ open: false, eventId: null, eventTitle: "" });
  const [interestedUsers, setInterestedUsers] = useState<InterestedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    event_date: "",
    event_time: "",
    short_description: "",
    type: "",
    full_description: "",
    link_to_dolk_profile: false,
    where_to_host: "",
    location: "",
    meeting_url: "",
    tags: "",
  });

  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (isAllowed: boolean) => {
    if (!confirmDialog.eventId) return;
    
    try {
      const { error } = await supabase
        .from("events")
        .update({ is_allowed: isAllowed })
        .eq("id", confirmDialog.eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Event ${isAllowed ? "approved" : "rejected"} successfully`,
      });
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setConfirmDialog({ open: false, type: null, eventId: null });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate meeting URL if provided
      if (formData.meeting_url && formData.meeting_url.trim()) {
        const urlSchema = z.string().url({ message: "Invalid URL format" });
        const result = urlSchema.safeParse(formData.meeting_url.trim());
        if (!result.success) {
          toast({
            title: "Validation Error",
            description: "Please enter a valid meeting URL",
            variant: "destructive",
          });
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const eventData = {
        title: formData.title.trim(),
        event_date: formData.event_date,
        event_time: formData.event_time,
        short_description: formData.short_description.trim(),
        type: formData.type.trim(),
        full_description: formData.full_description.trim(),
        link_to_dolk_profile: formData.link_to_dolk_profile,
        where_to_host: formData.where_to_host || null,
        location: formData.location.trim() || null,
        meeting_url: formData.meeting_url.trim() || null,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : null,
        user_id: user.id,
        // For updates: require re-approval, for new: auto-approve
        is_allowed: editingEvent ? null : true,
      };

      let eventId: string;

      if (editingEvent) {
        const { error } = await supabase
          .from("events")
          .update(eventData)
          .eq("id", editingEvent.id);

        if (error) throw error;
        eventId = editingEvent.id;
        toast({ 
          title: "Success", 
          description: "Event updated successfully. Pending admin approval." 
        });
      } else {
        const { data, error } = await supabase
          .from("events")
          .insert([eventData])
          .select()
          .single();

        if (error) throw error;
        eventId = data.id;
        toast({ title: "Success", description: "Event created successfully" });
      }

      // Upload documents if any
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
        variant: "destructive",
      });
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

        const { error: uploadError } = await supabase.storage
          .from("event-documents")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("event-documents")
          .getPublicUrl(fileName);

        const { error: docError } = await supabase
          .from("event_documents")
          .insert({
            event_id: eventId,
            document_url: publicUrl,
            document_type: file.type,
          });

        if (docError) throw docError;
      }

      toast({
        title: "Success",
        description: "Documents uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error uploading documents",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDialog.eventId) return;

    try {
      const { error } = await supabase.from("events").delete().eq("id", confirmDialog.eventId);

      if (error) throw error;

      toast({ title: "Success", description: "Event deleted successfully" });
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setConfirmDialog({ open: false, type: null, eventId: null });
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
      const { data, error } = await supabase
        .from("event_interests")
        .select(`
          user_id,
          profiles!inner(
            full_name,
            email
          )
        `)
        .eq("event_id", eventId);

      if (error) throw error;

      const users = data.map((item: any) => ({
        id: item.user_id,
        full_name: item.profiles.full_name,
        email: item.profiles.email,
      }));

      setInterestedUsers(users);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleViewInterestedUsers = async (event: Event) => {
    setInterestedUsersDialog({
      open: true,
      eventId: event.id,
      eventTitle: event.title,
    });
    await fetchInterestedUsers(event.id);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      event_date: event.event_date,
      event_time: event.event_time,
      short_description: event.short_description,
      type: event.type,
      full_description: event.full_description,
      link_to_dolk_profile: event.link_to_dolk_profile,
      where_to_host: event.where_to_host || "",
      location: event.location || "",
      meeting_url: event.meeting_url || "",
      tags: event.tags ? event.tags.join(", ") : "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      event_date: "",
      event_time: "",
      short_description: "",
      type: "",
      full_description: "",
      link_to_dolk_profile: false,
      where_to_host: "",
      location: "",
      meeting_url: "",
      tags: "",
    });
    setEditingEvent(null);
    setSelectedFiles(null);
  };

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getApprovalBadge = (isAllowed: boolean | null) => {
    if (isAllowed === null) return <span className="text-yellow-500">Pending</span>;
    if (isAllowed) return <span className="text-green-500">Approved</span>;
    return <span className="text-red-500">Rejected</span>;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Events Management</h1>
          <p className="text-muted-foreground">
            Manage and approve crew events
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
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
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="event_date">Date *</Label>
                  <Input
                    id="event_date"
                    type="date"
                    value={formData.event_date}
                    onChange={(e) =>
                      setFormData({ ...formData, event_date: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="event_time">Time *</Label>
                  <Input
                    id="event_time"
                    type="time"
                    value={formData.event_time}
                    onChange={(e) =>
                      setFormData({ ...formData, event_time: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="type">Type *</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  placeholder="e.g., Workshop, Meetup, Conference"
                  required
                />
              </div>

              <div>
                <Label htmlFor="short_description">Short Description *</Label>
                <Textarea
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) =>
                    setFormData({ ...formData, short_description: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="full_description">Full Description *</Label>
                <Textarea
                  id="full_description"
                  value={formData.full_description}
                  onChange={(e) =>
                    setFormData({ ...formData, full_description: e.target.value })
                  }
                  rows={5}
                  required
                />
              </div>

              <div>
                <Label htmlFor="where_to_host">Where to Host</Label>
                <Select
                  value={formData.where_to_host}
                  onValueChange={(value) =>
                    setFormData({ ...formData, where_to_host: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hosting type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="in-person">In Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.where_to_host === "in-person" && (
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Enter event location"
                    required
                  />
                </div>
              )}

              {formData.where_to_host === "online" && (
                <div>
                  <Label htmlFor="meeting_url">Meeting URL</Label>
                  <Input
                    id="meeting_url"
                    type="url"
                    value={formData.meeting_url}
                    onChange={(e) =>
                      setFormData({ ...formData, meeting_url: e.target.value })
                    }
                    placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                  />
                </div>
              )}

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="e.g., networking, tech, social"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="link_to_dolk_profile"
                  checked={formData.link_to_dolk_profile}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      link_to_dolk_profile: e.target.checked,
                    })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="link_to_dolk_profile">
                  Link to DOLK Profile
                </Label>
              </div>

              <div>
                <Label htmlFor="documents">Upload Documents/Images</Label>
                <Input
                  id="documents"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setSelectedFiles(e.target.files)}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? "Uploading..." : editingEvent ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        {loading ? (
          <div className="p-8 text-center">Loading events...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No Events Found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Interested</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id} className="border-b">
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{event.type}</TableCell>
                    <TableCell>
                      {format(new Date(event.event_date), "MMM dd, yyyy")} at{" "}
                      {event.event_time}
                    </TableCell>
                    <TableCell>{getApprovalBadge(event.is_allowed)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewInterestedUsers(event)}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {event.is_allowed === null && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmDialog({ open: true, type: 'approve', eventId: event.id })}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmDialog({ open: true, type: 'reject', eventId: event.id })}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(event)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmDialog({ open: true, type: 'delete', eventId: event.id })}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, type: null, eventId: null })}>
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

      <Dialog open={interestedUsersDialog.open} onOpenChange={(open) => !open && setInterestedUsersDialog({ open: false, eventId: null, eventTitle: "" })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Interested Users - {interestedUsersDialog.eventTitle}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {loadingUsers ? (
              <div className="p-8 text-center">Loading interested users...</div>
            ) : interestedUsers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No users have shown interest in this event yet.
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interestedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.full_name || "N/A"}</TableCell>
                        <TableCell>{user.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}