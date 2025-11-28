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
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Tag {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

const Tags = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [tagName, setTagName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    const filtered = tags.filter((tag) =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTags(filtered);
    setCurrentPage(1);
  }, [searchTerm, tags]);

  const fetchTags = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTags(data || []);
      setFilteredTags(data || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tags",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (tag?: Tag) => {
    if (tag) {
      setSelectedTag(tag);
      setTagName(tag.name);
    } else {
      setSelectedTag(null);
      setTagName("");
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedTag(null);
    setTagName("");
  };

  const handleSave = async () => {
    if (!tagName.trim()) {
      toast({
        title: "Error",
        description: "Tag name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (selectedTag) {
        const { error } = await supabase
          .from("tags")
          .update({ name: tagName.trim() })
          .eq("id", selectedTag.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Tag updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("tags")
          .insert([{ name: tagName.trim() }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Tag added successfully",
        });
      }

      handleCloseDialog();
      fetchTags();
    } catch (error) {
      console.error("Error saving tag:", error);
      toast({
        title: "Error",
        description: "Failed to save tag",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!tagToDelete) return;

    try {
      const { error } = await supabase
        .from("tags")
        .delete()
        .eq("id", tagToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tag deleted successfully",
      });

      setIsDeleteDialogOpen(false);
      setTagToDelete(null);
      fetchTags();
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast({
        title: "Error",
        description: "Failed to delete tag",
        variant: "destructive",
      });
    }
  };

  const totalPages = Math.ceil(filteredTags.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTags = filteredTags.slice(startIndex, endIndex);

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <Button
            key={i}
            variant={currentPage === i ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </Button>
        );
      }
    } else {
      items.push(
        <Button
          key={1}
          variant={currentPage === 1 ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrentPage(1)}
        >
          1
        </Button>
      );

      if (currentPage > 3) {
        items.push(
          <span key="ellipsis-start" className="px-2">
            ...
          </span>
        );
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <Button
            key={i}
            variant={currentPage === i ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </Button>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <span key="ellipsis-end" className="px-2">
            ...
          </span>
        );
      }

      items.push(
        <Button
          key={totalPages}
          variant={currentPage === totalPages ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrentPage(totalPages)}
        >
          {totalPages}
        </Button>
      );
    }

    return items;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tags</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Tag
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentTags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  No tags found
                </TableCell>
              </TableRow>
            ) : (
              currentTags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(tag)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setTagToDelete(tag);
                          setIsDeleteDialogOpen(true);
                        }}
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
        <div className="flex justify-center gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          {renderPaginationItems()}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTag ? "Edit Tag" : "Add Tag"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Tag Name</Label>
              <Input
                id="name"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="Enter tag name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the tag "{tagToDelete?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTagToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Tags;
