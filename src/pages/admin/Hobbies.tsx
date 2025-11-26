import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
interface Hobby {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}
const Hobbies = () => {
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [filteredHobbies, setFilteredHobbies] = useState<Hobby[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingHobby, setEditingHobby] = useState<Hobby | null>(null);
  const [deletingHobby, setDeletingHobby] = useState<Hobby | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: ""
  });
  useEffect(() => {
    fetchHobbies();
  }, []);
  useEffect(() => {
    const filtered = hobbies.filter(hobby => hobby.name.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredHobbies(filtered);
  }, [searchTerm, hobbies]);
  const fetchHobbies = async () => {
    try {
      setIsLoading(true);
      const {
        data,
        error
      } = await supabase.from("hobbies").select("*").order("name");
      if (error) throw error;
      setHobbies(data || []);
      setFilteredHobbies(data || []);
    } catch (error) {
      console.error("Error fetching hobbies:", error);
      toast({
        title: "Error",
        description: "Failed to fetch hobbies",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleOpenDialog = (hobby?: Hobby) => {
    if (hobby) {
      setEditingHobby(hobby);
      setFormData({
        name: hobby.name
      });
    } else {
      setEditingHobby(null);
      setFormData({
        name: ""
      });
    }
    setIsDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingHobby(null);
    setFormData({
      name: ""
    });
  };
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in the hobby name",
        variant: "destructive"
      });
      return;
    }
    try {
      if (editingHobby) {
        const {
          error
        } = await supabase.from("hobbies").update({
          name: formData.name,
          updated_at: new Date().toISOString()
        }).eq("id", editingHobby.id);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Hobby updated successfully"
        });
      } else {
        const {
          error
        } = await supabase.from("hobbies").insert([{
          name: formData.name
        }]);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Hobby added successfully"
        });
      }
      handleCloseDialog();
      fetchHobbies();
    } catch (error) {
      console.error("Error saving hobby:", error);
      toast({
        title: "Error",
        description: "Failed to save hobby",
        variant: "destructive"
      });
    }
  };
  const handleDelete = async () => {
    if (!deletingHobby) return;
    try {
      const {
        error
      } = await supabase.from("hobbies").delete().eq("id", deletingHobby.id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Hobby deleted successfully"
      });
      setIsDeleteDialogOpen(false);
      setDeletingHobby(null);
      fetchHobbies();
    } catch (error) {
      console.error("Error deleting hobby:", error);
      toast({
        title: "Error",
        description: "Failed to delete hobby",
        variant: "destructive"
      });
    }
  };
  if (isLoading) {
    return <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>;
  }
  return <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Hobby/Interest Management</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Hobbies/Interests</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 w-full sm:w-64" placeholder="Search hobbies/interest..." />
              </div>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Hobby/Interest
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHobbies.length === 0 ? <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No hobbies found
                  </TableCell>
                </TableRow> : filteredHobbies.map(hobby => <TableRow key={hobby.id}>
                    <TableCell className="font-medium">{hobby.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(hobby)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => {
                    setDeletingHobby(hobby);
                    setIsDeleteDialogOpen(true);
                  }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingHobby ? "Edit Hobby" : "Add New Hobby"}
            </DialogTitle>
            <DialogDescription>
              {editingHobby ? "Update the hobby information below" : "Enter the hobby information below"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({
              ...formData,
              name: e.target.value
            })} placeholder="Enter hobby name" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingHobby ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the hobby "{deletingHobby?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingHobby(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default Hobbies;