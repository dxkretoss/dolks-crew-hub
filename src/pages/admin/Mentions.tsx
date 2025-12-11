import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Search, AtSign } from "lucide-react";

interface Mention {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

const Mentions = () => {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [filteredMentions, setFilteredMentions] = useState<Mention[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingMention, setEditingMention] = useState<Mention | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchMentions();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = mentions.filter((mention) =>
        mention.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMentions(filtered);
    } else {
      setFilteredMentions(mentions);
    }
    setCurrentPage(1);
  }, [searchTerm, mentions]);

  const fetchMentions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("mentions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load mentions");
      console.error(error);
    } else {
      setMentions(data || []);
      setFilteredMentions(data || []);
    }
    setIsLoading(false);
  };

  const handleOpenDialog = (mention?: Mention) => {
    if (mention) {
      setEditingMention(mention);
      setFormData({ name: mention.name });
    } else {
      setEditingMention(null);
      setFormData({ name: "" });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMention(null);
    setFormData({ name: "" });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Mention name is required");
      return;
    }

    if (editingMention) {
      const { error } = await supabase
        .from("mentions")
        .update({ name: formData.name.trim() })
        .eq("id", editingMention.id);

      if (error) {
        toast.error("Failed to update mention");
        console.error(error);
      } else {
        toast.success("Mention updated successfully");
        fetchMentions();
        handleCloseDialog();
      }
    } else {
      const { error } = await supabase
        .from("mentions")
        .insert({ name: formData.name.trim() });

      if (error) {
        toast.error("Failed to create mention");
        console.error(error);
      } else {
        toast.success("Mention created successfully");
        fetchMentions();
        handleCloseDialog();
      }
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from("mentions")
      .delete()
      .eq("id", deleteId);

    if (error) {
      toast.error("Failed to delete mention");
      console.error(error);
    } else {
      toast.success("Mention deleted successfully");
      fetchMentions();
    }
    setIsDeleteDialogOpen(false);
    setDeleteId(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredMentions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredMentions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationItems = () => {
    const items = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      items.push(
        <PaginationItem key={2}>
          <PaginationLink
            onClick={() => handlePageChange(2)}
            isActive={currentPage === 2}
            className="cursor-pointer"
          >
            2
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis1">
            <span className="px-2">...</span>
          </PaginationItem>
        );
      }

      if (currentPage > 2 && currentPage < totalPages - 1) {
        items.push(
          <PaginationItem key={currentPage}>
            <PaginationLink isActive className="cursor-pointer">
              {currentPage}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis2">
            <span className="px-2">...</span>
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key={totalPages - 1}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages - 1)}
            isActive={currentPage === totalPages - 1}
            className="cursor-pointer"
          >
            {totalPages - 1}
          </PaginationLink>
        </PaginationItem>
      );
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return items;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mentions</h1>
          <p className="text-muted-foreground">
            Manage mentions for the application
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Mention
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search mentions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground"
                    >
                      <AtSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No mentions found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((mention) => (
                    <TableRow key={mention.id}>
                      <TableCell className="font-medium">
                        {mention.name}
                      </TableCell>
                      <TableCell>{formatDate(mention.created_at)}</TableCell>
                      <TableCell>{formatDate(mention.updated_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(mention)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(mention.id)}
                          >
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

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {renderPaginationItems()}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMention ? "Edit Mention" : "Add New Mention"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                placeholder="Enter mention name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingMention ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mention</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this mention? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Mentions;
