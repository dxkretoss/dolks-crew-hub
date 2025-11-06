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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import type { Tables } from "@/integrations/supabase/types";

type CompanyService = Tables<"company_services">;
type CompanyRole = Tables<"company_roles">;
type Hobby = Tables<"hobbies">;
type Skill = Tables<"skills">;

type ListType = "services" | "roles" | "hobbies" | "skills";

const ListManagement = () => {
  // Services state
  const [services, setServices] = useState<CompanyService[]>([]);
  const [filteredServices, setFilteredServices] = useState<CompanyService[]>([]);
  const [serviceSearchTerm, setServiceSearchTerm] = useState("");

  // Roles state
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<CompanyRole[]>([]);
  const [roleSearchTerm, setRoleSearchTerm] = useState("");

  // Hobbies state
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [filteredHobbies, setFilteredHobbies] = useState<Hobby[]>([]);
  const [hobbySearchTerm, setHobbySearchTerm] = useState("");

  // Skills state
  const [skills, setSkills] = useState<Skill[]>([]);
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
  const [skillSearchTerm, setSkillSearchTerm] = useState("");

  // Common state
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentList, setCurrentList] = useState<ListType>("services");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "" });

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filter effects
  useEffect(() => {
    const filtered = services.filter((service) =>
      service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase())
    );
    setFilteredServices(filtered);
  }, [serviceSearchTerm, services]);

  useEffect(() => {
    const filtered = roles.filter((role) =>
      role.name.toLowerCase().includes(roleSearchTerm.toLowerCase())
    );
    setFilteredRoles(filtered);
  }, [roleSearchTerm, roles]);

  useEffect(() => {
    const filtered = hobbies.filter((hobby) =>
      hobby.name.toLowerCase().includes(hobbySearchTerm.toLowerCase())
    );
    setFilteredHobbies(filtered);
  }, [hobbySearchTerm, hobbies]);

  useEffect(() => {
    const filtered = skills.filter((skill) =>
      skill.name.toLowerCase().includes(skillSearchTerm.toLowerCase())
    );
    setFilteredSkills(filtered);
  }, [skillSearchTerm, skills]);

  const fetchAllData = async () => {
    try {
      const [servicesData, rolesData, hobbiesData, skillsData] = await Promise.all([
        supabase.from("company_services").select("*").order("created_at", { ascending: false }),
        supabase.from("company_roles").select("*").order("created_at", { ascending: false }),
        supabase.from("hobbies").select("*").order("created_at", { ascending: false }),
        supabase.from("skills").select("*").order("created_at", { ascending: false }),
      ]);

      if (servicesData.error) throw servicesData.error;
      if (rolesData.error) throw rolesData.error;
      if (hobbiesData.error) throw hobbiesData.error;
      if (skillsData.error) throw skillsData.error;

      setServices((servicesData.data as CompanyService[]) || []);
      setFilteredServices((servicesData.data as CompanyService[]) || []);
      setRoles((rolesData.data as CompanyRole[]) || []);
      setFilteredRoles((rolesData.data as CompanyRole[]) || []);
      setHobbies((hobbiesData.data as Hobby[]) || []);
      setFilteredHobbies((hobbiesData.data as Hobby[]) || []);
      setSkills((skillsData.data as Skill[]) || []);
      setFilteredSkills((skillsData.data as Skill[]) || []);
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

  const fetchData = async (listType: ListType) => {
    try {
      const tableName =
        listType === "services"
          ? "company_services"
          : listType === "roles"
          ? "company_roles"
          : listType;

      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (listType === "services") {
        setServices((data as CompanyService[]) || []);
        setFilteredServices((data as CompanyService[]) || []);
      } else if (listType === "roles") {
        setRoles((data as CompanyRole[]) || []);
        setFilteredRoles((data as CompanyRole[]) || []);
      } else if (listType === "hobbies") {
        setHobbies((data as Hobby[]) || []);
        setFilteredHobbies((data as Hobby[]) || []);
      } else if (listType === "skills") {
        setSkills((data as Skill[]) || []);
        setFilteredSkills((data as Skill[]) || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleOpenDialog = (listType: ListType, item?: any) => {
    setCurrentList(listType);
    if (item) {
      setEditingItem(item);
      setFormData({ name: item.name });
    } else {
      setEditingItem(null);
      setFormData({ name: "" });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({ name: "" });
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

    try {
      const tableName =
        currentList === "services"
          ? "company_services"
          : currentList === "roles"
          ? "company_roles"
          : currentList;

      if (editingItem) {
        const { error } = await supabase
          .from(tableName)
          .update({ name: formData.name })
          .eq("id", editingItem.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Item updated successfully",
        });
      } else {
        const { error } = await supabase.from(tableName).insert({ name: formData.name });

        if (error) throw error;
        toast({
          title: "Success",
          description: "Item added successfully",
        });
      }
      handleCloseDialog();
      fetchData(currentList);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      const tableName =
        currentList === "services"
          ? "company_services"
          : currentList === "roles"
          ? "company_roles"
          : currentList;

      const { error } = await supabase.from(tableName).delete().eq("id", deletingItem.id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
      fetchData(currentList);
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

  const renderTable = (
    data: any[],
    listType: ListType,
    title: string,
    searchTerm: string,
    setSearchTerm: (term: string) => void
  ) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>{title}</CardTitle>
          <Button onClick={() => handleOpenDialog(listType)}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${title.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No items found</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{formatDate(item.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDialog(listType, item)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setCurrentList(listType);
                            setDeletingItem(item);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
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
  );

  const getDialogTitle = () => {
    const typeMap = {
      services: "Service",
      roles: "Role",
      hobbies: "Hobby/Interest",
      skills: "Skill",
    };
    const type = typeMap[currentList];
    return editingItem ? `Edit ${type}` : `Add New ${type}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">List Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage company services, roles, hobbies, and skills
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {renderTable(
          filteredServices,
          "services",
          "Company Services",
          serviceSearchTerm,
          setServiceSearchTerm
        )}
        {renderTable(
          filteredRoles,
          "roles",
          "Company Roles",
          roleSearchTerm,
          setRoleSearchTerm
        )}
        {renderTable(
          filteredHobbies,
          "hobbies",
          "Hobby/Interest",
          hobbySearchTerm,
          setHobbySearchTerm
        )}
        {renderTable(filteredSkills, "skills", "Skills", skillSearchTerm, setSkillSearchTerm)}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the details below" : "Fill in the details to add a new item"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editingItem ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingItem?.name}". This action cannot be undone.
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

export default ListManagement;
