import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Search, Pencil, Trash2, Plus, Upload, X, ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
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
    imageFile: null as File | null,
    imagePreview: "" as string
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    const filtered = services.filter(service => service.name.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredServices(filtered);
    setCurrentPage(1);
  }, [searchTerm, services]);
  const fetchData = async () => {
    try {
      const [servicesRes, categoriesRes] = await Promise.all([supabase.from("company_services").select("*, category:categories(*)").order("created_at", {
        ascending: false
      }), supabase.from("categories").select("*").order("name", {
        ascending: true
      })]);
      if (servicesRes.error) throw servicesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      setServices(servicesRes.data || []);
      setFilteredServices(servicesRes.data || []);
      setCategories(categoriesRes.data || []);
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
  const handleOpenDialog = (service?: ServiceWithCategory) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        category_id: service.category_id || "",
        imageFile: null,
        imagePreview: service.image_url || ""
      });
    } else {
      setEditingService(null);
      setFormData({
        name: "",
        category_id: "",
        imageFile: null,
        imagePreview: ""
      });
    }
    setIsDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingService(null);
    setFormData({
      name: "",
      category_id: "",
      imageFile: null,
      imagePreview: ""
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          imageFile: file,
          imagePreview: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      imageFile: null,
      imagePreview: ""
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (file: File, serviceId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${serviceId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('service-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('service-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };
  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: "Error",
          description: "Service name is required",
          variant: "destructive"
        });
        return;
      }

      let imageUrl: string | null = null;

      if (editingService) {
        // Handle image changes for existing service
        if (formData.imageFile) {
          // Delete old image if exists
          if (editingService.image_url) {
            const oldFileName = editingService.image_url.split('/').pop();
            if (oldFileName) {
              await supabase.storage.from('service-images').remove([oldFileName]);
            }
          }
          // Upload new image
          imageUrl = await uploadImage(formData.imageFile, editingService.id);
        } else if (formData.imagePreview === "" && editingService.image_url) {
          // Image was removed
          const oldFileName = editingService.image_url.split('/').pop();
          if (oldFileName) {
            await supabase.storage.from('service-images').remove([oldFileName]);
          }
          imageUrl = null;
        } else {
          // Keep existing image
          imageUrl = editingService.image_url || null;
        }

        const { error } = await supabase
          .from("company_services")
          .update({
            name: formData.name.trim(),
            category_id: formData.category_id || null,
            image_url: imageUrl
          })
          .eq("id", editingService.id);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Service updated successfully"
        });
      } else {
        // Create new service first to get ID
        const { data: newService, error: insertError } = await supabase
          .from("company_services")
          .insert({
            name: formData.name.trim(),
            category_id: formData.category_id || null
          })
          .select()
          .single();
        if (insertError) throw insertError;

        // Upload image if provided
        if (formData.imageFile && newService) {
          imageUrl = await uploadImage(formData.imageFile, newService.id);
          const { error: updateError } = await supabase
            .from("company_services")
            .update({ image_url: imageUrl })
            .eq("id", newService.id);
          if (updateError) throw updateError;
        }

        toast({
          title: "Success",
          description: "Service created successfully"
        });
      }
      handleCloseDialog();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const {
        error
      } = await supabase.from("company_services").delete().eq("id", deleteId);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Service deleted successfully"
      });
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentServices = filteredServices.slice(startIndex, endIndex);
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
  return <div className="p-6 lg:p-8 space-y-6">
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
              <Input placeholder="Search services..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-muted-foreground">
              Loading services...
            </div> : filteredServices.length === 0 ? <div className="text-center py-8 text-muted-foreground">
              No services found
            </div> : <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentServices.map(service => <TableRow key={service.id}>
                      <TableCell>
                        {service.image_url ? (
                          <img 
                            src={service.image_url} 
                            alt={service.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {service.name}
                      </TableCell>
                      <TableCell>
                        {service.category?.name || "Uncategorized"}
                      </TableCell>
                      <TableCell>{formatDate(service.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleOpenDialog(service)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => {
                      setDeleteId(service.id);
                      setIsDeleteDialogOpen(true);
                    }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>}
          {!loading && filteredServices.length > itemsPerPage && <div className="mt-4">
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
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Edit Service" : "Add Service"}
            </DialogTitle>
            <DialogDescription>
              {editingService ? "Update the service details below." : "Enter the details for the new service."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({
              ...formData,
              name: e.target.value
            })} placeholder="Enter service name" className="my-[5px]" />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category_id || "none"} onValueChange={value => setFormData({
              ...formData,
              category_id: value === "none" ? "" : value
            })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.map(category => <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Image</Label>
              <div className="mt-2">
                {formData.imagePreview ? (
                  <div className="relative inline-block">
                    <img 
                      src={formData.imagePreview} 
                      alt="Service preview" 
                      className="w-32 h-32 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={removeImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="w-32 h-32 border-2 border-dashed border-muted-foreground/25 rounded flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground">Upload Image</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
    </div>;
};
export default Services;