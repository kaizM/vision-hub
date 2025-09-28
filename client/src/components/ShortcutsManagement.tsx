import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DragDropContext, Draggable, Droppable, DropResult, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical, 
  ExternalLink, 
  Globe, 
  RefreshCcw,
  Zap,
  Eye,
  EyeOff,
  AlertTriangle,
  Shield
} from "lucide-react";

// Types based on schema
interface Shortcut {
  id: string;
  name: string;
  url: string;
  icon?: string;
  category?: string;
  visible: boolean;
  sortOrder: number;
  createdAt: Date;
}

// Form validation schema
const shortcutFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  url: z.string().url("Must be a valid URL"),
  icon: z.string().max(2, "Icon should be 1-2 characters").optional(),
  category: z.string().optional(),
  visible: z.boolean().default(true),
});

type ShortcutFormValues = z.infer<typeof shortcutFormSchema>;

// Domain whitelist settings schema
const domainWhitelistSchema = z.object({
  enabled: z.boolean().default(false),
  domains: z.string().optional(), // Comma-separated domains
});

type DomainWhitelistValues = z.infer<typeof domainWhitelistSchema>;

export function ShortcutsManagement() {
  const { toast } = useToast();
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showWhitelistDialog, setShowWhitelistDialog] = useState(false);

  // Fetch all shortcuts
  const { data: shortcuts = [], isLoading: shortcutsLoading } = useQuery({
    queryKey: ['/api/shortcuts'],
    queryFn: () => fetch('/api/shortcuts').then(res => res.json()),
  });

  // Fetch domain whitelist settings
  const { data: whitelistSettings, isLoading: whitelistLoading } = useQuery({
    queryKey: ['/api/settings/domain-whitelist'],
    queryFn: () => fetch('/api/settings/domain-whitelist').then(res => res.json()),
  });

  // Create shortcut mutation
  const createMutation = useMutation({
    mutationFn: (data: ShortcutFormValues) => apiRequest("POST", "/api/shortcuts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shortcuts'] });
      setShowAddDialog(false);
      toast({ title: "Success", description: "Shortcut created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create shortcut", variant: "destructive" });
    },
  });

  // Update shortcut mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<ShortcutFormValues>) => 
      apiRequest("PATCH", `/api/shortcuts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shortcuts'] });
      setEditingShortcut(null);
      toast({ title: "Success", description: "Shortcut updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update shortcut", variant: "destructive" });
    },
  });

  // Delete shortcut mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/shortcuts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shortcuts'] });
      toast({ title: "Success", description: "Shortcut deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete shortcut", variant: "destructive" });
    },
  });

  // Reorder shortcuts mutation
  const reorderMutation = useMutation({
    mutationFn: (reorderedShortcuts: Array<{id: string, sortOrder: number}>) => 
      apiRequest("POST", "/api/shortcuts/reorder", { shortcuts: reorderedShortcuts }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shortcuts'] });
      toast({ title: "Success", description: "Shortcuts reordered successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to reorder shortcuts", variant: "destructive" });
    },
  });

  // Domain whitelist mutation
  const whitelistMutation = useMutation({
    mutationFn: (data: DomainWhitelistValues) => 
      apiRequest("POST", "/api/settings/domain-whitelist", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/domain-whitelist'] });
      setShowWhitelistDialog(false);
      toast({ title: "Success", description: "Domain whitelist updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update domain whitelist", variant: "destructive" });
    },
  });

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ id, visible }: { id: string, visible: boolean }) => 
      apiRequest("PATCH", `/api/shortcuts/${id}`, { visible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shortcuts'] });
    },
  });

  // Form setup
  const form = useForm<ShortcutFormValues>({
    resolver: zodResolver(shortcutFormSchema),
    defaultValues: {
      name: "",
      url: "",
      icon: "",
      category: "",
      visible: true,
    },
  });

  const whitelistForm = useForm<DomainWhitelistValues>({
    resolver: zodResolver(domainWhitelistSchema),
    defaultValues: {
      enabled: whitelistSettings?.enabled || false,
      domains: whitelistSettings?.domains || "",
    },
  });

  // Domain validation helper
  const isUrlAllowed = (url: string): boolean => {
    if (!whitelistSettings?.enabled) return true;
    
    const domains = whitelistSettings.domains?.split(',').map((d: string) => d.trim()).filter(Boolean) || [];
    if (domains.length === 0) return true;
    
    try {
      const domain = new URL(url).hostname;
      return domains.some((allowedDomain: string) => 
        domain === allowedDomain || domain.endsWith(`.${allowedDomain}`)
      );
    } catch {
      return false;
    }
  };

  // Form handlers
  const handleCreate = (data: ShortcutFormValues) => {
    if (!isUrlAllowed(data.url)) {
      toast({ 
        title: "Domain Not Allowed", 
        description: "This domain is not in the whitelist", 
        variant: "destructive" 
      });
      return;
    }
    createMutation.mutate(data);
  };

  const handleUpdate = (data: ShortcutFormValues) => {
    if (!editingShortcut) return;
    if (!isUrlAllowed(data.url)) {
      toast({ 
        title: "Domain Not Allowed", 
        description: "This domain is not in the whitelist", 
        variant: "destructive" 
      });
      return;
    }
    updateMutation.mutate({ id: editingShortcut.id, ...data });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this shortcut?")) {
      deleteMutation.mutate(id);
    }
  };

  const toggleVisibility = (id: string, visible: boolean) => {
    toggleVisibilityMutation.mutate({ id, visible });
  };

  // Drag and drop handler
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(shortcuts as Shortcut[]);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sort orders
    const reorderedShortcuts = items.map((shortcut, index) => ({
      id: shortcut.id,
      sortOrder: index
    }));

    reorderMutation.mutate(reorderedShortcuts);
  };

  const startEdit = (shortcut: Shortcut) => {
    setEditingShortcut(shortcut);
    form.reset({
      name: shortcut.name,
      url: shortcut.url,
      icon: shortcut.icon || "",
      category: shortcut.category || "",
      visible: shortcut.visible,
    });
  };

  const getShortcutIcon = (shortcut: Shortcut) => {
    if (shortcut.icon) {
      return <span className="text-lg">{shortcut.icon}</span>;
    }
    return <ExternalLink className="h-4 w-4 text-muted-foreground" />;
  };

  const getCategoryBadge = (category?: string) => {
    if (!category) return null;
    
    const variants = {
      'inventory': 'outline',
      'admin': 'destructive', 
      'tools': 'secondary',
      'vendor': 'default'
    } as const;
    
    return (
      <Badge variant={variants[category as keyof typeof variants] || 'default'} className="text-xs">
        {category}
      </Badge>
    );
  };

  if (shortcutsLoading) {
    return <div className="flex items-center justify-center h-64">Loading shortcuts...</div>;
  }

  const sortedShortcuts = [...(shortcuts as Shortcut[])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quick Shortcuts Management</h2>
          <p className="text-muted-foreground">
            Manage and organize quick access shortcuts for external vendor websites and tools.
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showWhitelistDialog} onOpenChange={setShowWhitelistDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-domain-whitelist">
                <Shield className="h-4 w-4 mr-2" />
                Domain Whitelist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Domain Whitelist Settings</DialogTitle>
              </DialogHeader>
              <Form {...whitelistForm}>
                <form onSubmit={whitelistForm.handleSubmit((data) => whitelistMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={whitelistForm.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Domain Whitelist</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Restrict shortcuts to approved domains only
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-whitelist-enabled"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={whitelistForm.control}
                    name="domains"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allowed Domains</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="example.com, vendor1.com, vendor2.com"
                            {...field}
                            data-testid="textarea-whitelist-domains"
                          />
                        </FormControl>
                        <div className="text-sm text-muted-foreground">
                          Enter comma-separated domain names (e.g., example.com, vendor.net)
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowWhitelistDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" data-testid="button-save-whitelist">
                      Save Settings
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-shortcut">
                <Plus className="h-4 w-4 mr-2" />
                Add Shortcut
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Shortcut</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Vendor Portal" {...field} data-testid="input-shortcut-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://vendor.com/portal" {...field} data-testid="input-shortcut-url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="🔗" maxLength={2} {...field} data-testid="input-shortcut-icon" />
                        </FormControl>
                        <div className="text-sm text-muted-foreground">
                          Enter an emoji or 1-2 characters
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-shortcut-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="vendor">Vendor</SelectItem>
                            <SelectItem value="inventory">Inventory</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="tools">Tools</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="visible"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Visible</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Show this shortcut on the kiosk
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-shortcut-visible"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" data-testid="button-create-shortcut">
                      Create Shortcut
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Domain whitelist status */}
      {whitelistSettings?.enabled && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                Domain whitelist is enabled
              </span>
              <span className="text-sm text-orange-600">
                - Only approved domains can be added
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shortcuts list with drag and drop */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Shortcuts ({sortedShortcuts.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedShortcuts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No shortcuts configured. Add your first shortcut to get started.
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="shortcuts">
                {(provided: DroppableProvided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {sortedShortcuts.map((shortcut, index) => (
                      <Draggable key={shortcut.id} draggableId={shortcut.id} index={index}>
                        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center space-x-3 p-4 rounded-lg border bg-card ${
                              snapshot.isDragging ? 'shadow-md' : ''
                            }`}
                          >
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                            </div>
                            
                            <div className="flex-shrink-0">
                              {getShortcutIcon(shortcut)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium truncate">{shortcut.name}</h3>
                                {getCategoryBadge(shortcut.category)}
                                {!shortcut.visible && (
                                  <Badge variant="outline" className="text-xs">
                                    Hidden
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {shortcut.url}
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleVisibility(shortcut.id, !shortcut.visible)}
                                data-testid={`button-toggle-visibility-${shortcut.id}`}
                              >
                                {shortcut.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </Button>
                              
                              <Dialog open={editingShortcut?.id === shortcut.id} onOpenChange={(open) => !open && setEditingShortcut(null)}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEdit(shortcut)}
                                    data-testid={`button-edit-${shortcut.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Shortcut</DialogTitle>
                                  </DialogHeader>
                                  <Form {...form}>
                                    <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
                                      <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                              <Input {...field} data-testid="input-edit-name" />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={form.control}
                                        name="url"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>URL</FormLabel>
                                            <FormControl>
                                              <Input {...field} data-testid="input-edit-url" />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={form.control}
                                        name="icon"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Icon (Optional)</FormLabel>
                                            <FormControl>
                                              <Input maxLength={2} {...field} data-testid="input-edit-icon" />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Category (Optional)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                              <FormControl>
                                                <SelectTrigger data-testid="select-edit-category">
                                                  <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                              </FormControl>
                                              <SelectContent>
                                                <SelectItem value="vendor">Vendor</SelectItem>
                                                <SelectItem value="inventory">Inventory</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="tools">Tools</SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <div className="flex justify-end space-x-2">
                                        <Button type="button" variant="outline" onClick={() => setEditingShortcut(null)}>
                                          Cancel
                                        </Button>
                                        <Button type="submit" data-testid="button-save-edit">
                                          Save Changes
                                        </Button>
                                      </div>
                                    </form>
                                  </Form>
                                </DialogContent>
                              </Dialog>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(shortcut.id)}
                                data-testid={`button-delete-${shortcut.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
}