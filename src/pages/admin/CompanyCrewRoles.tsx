import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
type CompanyCrewType = {
  id: string;
  name: string;
  type: "company" | "crew";
  description: string | null;
  created_at: string;
};
type CompanyCrewRole = {
  id: string;
  type_id: string;
  name: string;
  description: string | null;
  created_at: string;
};
const CompanyCrewRoles = () => {
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<CompanyCrewType | null>(null);
  const [editingRole, setEditingRole] = useState<CompanyCrewRole | null>(null);
  const [deleteTypeId, setDeleteTypeId] = useState<string | null>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [typeForm, setTypeForm] = useState({
    name: "",
    type: "company" as "company" | "crew"
  });
  const [roleForm, setRoleForm] = useState({
    type_id: "",
    name: ""
  });
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();

  // Fetch types
  const {
    data: types,
    isLoading: typesLoading
  } = useQuery({
    queryKey: ["company-crew-types"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("company_crew_types").select("*").order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data as CompanyCrewType[];
    }
  });

  // Fetch roles
  const {
    data: roles,
    isLoading: rolesLoading
  } = useQuery({
    queryKey: ["company-crew-roles"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("company_crew_roles").select("*").order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data as CompanyCrewRole[];
    }
  });

  // Create/Update Type
  const typeMutation = useMutation({
    mutationFn: async (data: typeof typeForm) => {
      if (editingType) {
        const {
          error
        } = await supabase.from("company_crew_types").update(data).eq("id", editingType.id);
        if (error) throw error;
      } else {
        const {
          error
        } = await supabase.from("company_crew_types").insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["company-crew-types"]
      });
      setTypeDialogOpen(false);
      setEditingType(null);
      resetTypeForm();
      toast({
        title: editingType ? "Type updated" : "Type created",
        description: `Type has been ${editingType ? "updated" : "created"} successfully.`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Create/Update Role
  const roleMutation = useMutation({
    mutationFn: async (data: typeof roleForm) => {
      if (editingRole) {
        const {
          error
        } = await supabase.from("company_crew_roles").update(data).eq("id", editingRole.id);
        if (error) throw error;
      } else {
        const {
          error
        } = await supabase.from("company_crew_roles").insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["company-crew-roles"]
      });
      setRoleDialogOpen(false);
      setEditingRole(null);
      resetRoleForm();
      toast({
        title: editingRole ? "Role updated" : "Role created",
        description: `Role has been ${editingRole ? "updated" : "created"} successfully.`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete Type
  const deleteTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      const {
        error
      } = await supabase.from("company_crew_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["company-crew-types"]
      });
      queryClient.invalidateQueries({
        queryKey: ["company-crew-roles"]
      });
      setDeleteTypeId(null);
      toast({
        title: "Type deleted",
        description: "Type and associated roles have been deleted successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete Role
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      const {
        error
      } = await supabase.from("company_crew_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["company-crew-roles"]
      });
      setDeleteRoleId(null);
      toast({
        title: "Role deleted",
        description: "Role has been deleted successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  const resetTypeForm = () => {
    setTypeForm({
      name: "",
      type: "company"
    });
  };
  const resetRoleForm = () => {
    setRoleForm({
      type_id: "",
      name: ""
    });
  };
  const handleTypeEdit = (type: CompanyCrewType) => {
    setEditingType(type);
    setTypeForm({
      name: type.name,
      type: type.type
    });
    setTypeDialogOpen(true);
  };
  const handleRoleEdit = (role: CompanyCrewRole) => {
    setEditingRole(role);
    setRoleForm({
      type_id: role.type_id,
      name: role.name
    });
    setRoleDialogOpen(true);
  };
  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    typeMutation.mutate(typeForm);
  };
  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.type_id) {
      toast({
        title: "Error",
        description: "Please select a type for the role.",
        variant: "destructive"
      });
      return;
    }
    roleMutation.mutate(roleForm);
  };
  const getTypeName = (typeId: string) => {
    return types?.find(t => t.id === typeId)?.name || "Unknown";
  };
  const filteredRoles = roles?.filter(role => {
    if (selectedTypeFilter === "all") return true;
    return role.type_id === selectedTypeFilter;
  });
  return <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Company/Crew Roles</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 md:pl-6 px-0">
        {/* Types Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Types</CardTitle>
            <Button onClick={() => {
            setEditingType(null);
            resetTypeForm();
            setTypeDialogOpen(true);
          }} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Type
            </Button>
          </CardHeader>
          <CardContent>
            {typesLoading ? <p>Loading types...</p> : <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {types?.map(type => <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>
                        <Badge variant={type.type === "company" ? "default" : "secondary"}>
                          {type.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleTypeEdit(type)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => setDeleteTypeId(type.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>}
          </CardContent>
        </Card>

        {/* Roles Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Roles</CardTitle>
            <Button onClick={() => {
            setEditingRole(null);
            resetRoleForm();
            setRoleDialogOpen(true);
          }} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types?.map(type => <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {rolesLoading ? <p>Loading roles...</p> : <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles?.map(role => <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>{getTypeName(role.type_id)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleRoleEdit(role)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => setDeleteRoleId(role.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>}
          </CardContent>
        </Card>
      </div>

      {/* Type Dialog */}
      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingType ? "Edit Type" : "Add Type"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTypeSubmit} className="space-y-4">
            <div>
              <Label htmlFor="type-name">Name</Label>
              <Input id="type-name" value={typeForm.name} onChange={e => setTypeForm({
              ...typeForm,
              name: e.target.value
            })} required />
            </div>
            <div>
              <Label htmlFor="type-type">Type</Label>
              <Select value={typeForm.type} onValueChange={(value: "company" | "crew") => setTypeForm({
              ...typeForm,
              type: value
            })}>
                <SelectTrigger id="type-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="crew">Crew</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTypeDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={typeMutation.isPending}>
                {editingType ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Add Role"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRoleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="role-type">Type</Label>
              <Select value={roleForm.type_id} onValueChange={value => setRoleForm({
              ...roleForm,
              type_id: value
            })}>
                <SelectTrigger id="role-type">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {types?.map(type => <SelectItem key={type.id} value={type.id}>
                      {type.name} ({type.type})
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="role-name">Name</Label>
              <Input id="role-name" value={roleForm.name} onChange={e => setRoleForm({
              ...roleForm,
              name: e.target.value
            })} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={roleMutation.isPending}>
                {editingRole ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Type Alert */}
      <AlertDialog open={!!deleteTypeId} onOpenChange={() => setDeleteTypeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this type and all associated roles. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTypeId && deleteTypeMutation.mutate(deleteTypeId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Role Alert */}
      <AlertDialog open={!!deleteRoleId} onOpenChange={() => setDeleteRoleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this role. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteRoleId && deleteRoleMutation.mutate(deleteRoleId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default CompanyCrewRoles;