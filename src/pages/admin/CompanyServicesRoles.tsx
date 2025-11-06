import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Service = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type Role = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

const CompanyServicesRoles = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentType, setCurrentType] = useState<"services" | "roles">("services");
  const [editingItem, setEditingItem] = useState<Service | Role | null>(null);
  const [deleteItem, setDeleteItem] = useState<Service | Role | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    setFilteredServices(
      services.filter((service) =>
        service.name.toLowerCase().includes(serviceSearch.toLowerCase())
      )
    );
  }, [serviceSearch, services]);

  useEffect(() => {
    setFilteredRoles(
      roles.filter((role) =>
        role.name.toLowerCase().includes(roleSearch.toLowerCase())
      )
    );
  }, [roleSearch, roles]);

  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([fetchServices(), fetchRoles()]);
    setIsLoading(false);
  };

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("company_services")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch company services",
        variant: "destructive",
      });
      return;
    }

    setServices(data || []);
  };

  const fetchRoles = async () => {
    const { data, error } = await supabase
      .from("company_roles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch company roles",
        variant: "destructive",
      });
      return;
    }

    setRoles(data || []);
  };

  const handleOpenDialog = (type: "services" | "roles", item?: Service | Role) => {
    setCurrentType(type);
    setEditingItem(item || null);
    setFormData({
      name: item?.name || "",
      description: (item as Service)?.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({ name: "", description: "" });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    const table = currentType === "services" ? "company_services" : "company_roles";
    const payload =
      currentType === "services"
        ? { name: formData.name, description: formData.description }
        : { name: formData.name };

    if (editingItem) {
      const { error } = await supabase
        .from(table)
        .update(payload)
        .eq("id", editingItem.id);

      if (error) {
        toast({
          title: "Error",
          description: `Failed to update ${currentType === "services" ? "service" : "role"}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `${currentType === "services" ? "Service" : "Role"} updated successfully`,
      });
    } else {
      const { error } = await supabase.from(table).insert([payload]);

      if (error) {
        toast({
          title: "Error",
          description: `Failed to add ${currentType === "services" ? "service" : "role"}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `${currentType === "services" ? "Service" : "Role"} added successfully`,
      });
    }

    if (currentType === "services") {
      await fetchServices();
    } else {
      await fetchRoles();
    }
    handleCloseDialog();
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    const table = currentType === "services" ? "company_services" : "company_roles";

    const { error } = await supabase.from(table).delete().eq("id", deleteItem.id);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to delete ${currentType === "services" ? "service" : "role"}`,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `${currentType === "services" ? "Service" : "Role"} deleted successfully`,
    });

    if (currentType === "services") {
      await fetchServices();
    } else {
      await fetchRoles();
    }
    setIsDeleteDialogOpen(false);
    setDeleteItem(null);
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
      <h1 className="text-3xl font-bold">Company Services & Roles</h1>

      {/* Company Services Section */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Company Services</h2>
          <Button onClick={() => handleOpenDialog("services")} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <ScrollArea className="h-[400px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No Company Services Added
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices.map((service) => (
                  <TableRow key={service.id} className="border-b">
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{service.description || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog("services", service)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCurrentType("services");
                            setDeleteItem(service);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Company Roles Section */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Company Roles</h2>
          <Button onClick={() => handleOpenDialog("roles")} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Role
          </Button>
        </div>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <ScrollArea className="h-[400px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                    No Company Roles Added
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => (
                  <TableRow key={role.id} className="border-b">
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog("roles", role)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCurrentType("roles");
                            setDeleteItem(role);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit" : "Add"}{" "}
              {currentType === "services" ? "Service" : "Role"}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? "Update" : "Create"} a{" "}
              {currentType === "services" ? "company service" : "company role"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            {currentType === "services" && (
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter description"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{" "}
              {currentType === "services" ? "service" : "role"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CompanyServicesRoles;
