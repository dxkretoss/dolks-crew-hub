import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Search, Pencil, Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Service = Tables<"company_services">;
type Category = Tables<"categories">;

interface ServiceWithCategory extends Service {
  category?: Category | null;
}

const Services = () => {
  const [services, setServices] = useState<ServiceWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceWithCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = services.filter((service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredServices(filtered);
  }, [searchTerm, services]);

  const fetchData = async () => {
    try {
      const [servicesRes, categoriesRes] = await Promise.all([
        supabase
          .from("company_services")
          .select("*, category:categories(*)")
          .order("created_at", { ascending: false }),
        supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true }),
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setServices(servicesRes.data || []);
      setFilteredServices(servicesRes.data || []);
      setCategories(categoriesRes.data || []);
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

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        category_id: service.category_id || "",
      });
    } else {
      setEditingService(null);
      setFormData({ name: "", category_id: "" });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingService(null);
    setFormData({ name: "", category_id: "" });
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: "Error",
          description: "Service name is required",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        name: formData.name.trim(),
        category_id: formData.category_id || null,
      };

      if (editingService) {
        const { error } = await supabase
          .from("company_services")
          .update(payload)
          .eq("id", editingService.id);

        if (error) throw error;
        toast({ title: "Success", description: "Service updated successfully" });
      } else {
        const { error } = await supabase
          .from("company_services")
          .insert(payload);

        if (error) throw error;
        toast({ title: "Success", description: "Service created successfully" });
      }

      handleCloseDialog();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("company_services")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast({ title: "Success", description: "Service deleted successfully" });
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-muted-foreground mt-1">
            Manage company services
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading services...
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No services found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">
                        {service.name}
                      </TableCell>
                      <TableCell>
                        {service.category?.name || "Uncategorized"}
                      </TableCell>
                      <TableCell>{formatDate(service.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(service)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setDeleteId(service.id);
                              setIsDeleteDialogOpen(true);
                            }}
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
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Edit Service" : "Add Service"}
            </DialogTitle>
            <DialogDescription>
              {editingService
                ? "Update the service details below."
                : "Enter the details for the new service."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter service name"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, category_id: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingService ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              service.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>
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

export default Services;
