import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Camera, 
  Play,
  Square,
  RefreshCw,
  AlertTriangle,
  Settings as Gear,
  Video,
  Wifi,
  WifiOff,
  Eye,
  EyeOff
} from "lucide-react";

// Types based on schema
interface CameraConfig {
  id: string;
  name: string;
  rtspUrl?: string;
  enabled: boolean;
  createdAt: Date;
}

// Form validation schema
const cameraFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  rtspUrl: z.string().url("Must be a valid RTSP URL").or(z.literal("")).optional(),
  enabled: z.boolean().default(true),
});

type CameraFormValues = z.infer<typeof cameraFormSchema>;

export function CameraSettings() {
  const { toast } = useToast();
  const [editingCamera, setEditingCamera] = useState<CameraConfig | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [previewingCamera, setPreviewingCamera] = useState<CameraConfig | null>(null);

  // Fetch all cameras
  const { data: cameras = [], isLoading: camerasLoading } = useQuery({
    queryKey: ['/api/cameras'],
    queryFn: () => fetch('/api/cameras').then(res => res.json()),
  });

  // Create camera mutation
  const createMutation = useMutation({
    mutationFn: (data: CameraFormValues) => apiRequest("POST", "/api/cameras", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cameras'] });
      setShowAddDialog(false);
      toast({ title: "Success", description: "Camera created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create camera", variant: "destructive" });
    },
  });

  // Update camera mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<CameraFormValues>) => 
      apiRequest("PATCH", `/api/cameras/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cameras'] });
      setEditingCamera(null);
      toast({ title: "Success", description: "Camera updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update camera", variant: "destructive" });
    },
  });

  // Delete camera mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/cameras/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cameras'] });
      toast({ title: "Success", description: "Camera deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete camera", variant: "destructive" });
    },
  });

  // Toggle enabled mutation
  const toggleEnabledMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string, enabled: boolean }) => 
      apiRequest("PATCH", `/api/cameras/${id}`, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cameras'] });
    },
  });

  // Form setup
  const form = useForm<CameraFormValues>({
    resolver: zodResolver(cameraFormSchema),
    defaultValues: {
      name: "",
      rtspUrl: "",
      enabled: true,
    },
  });

  // Form handlers
  const handleCreate = (data: CameraFormValues) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (data: CameraFormValues) => {
    if (!editingCamera) return;
    updateMutation.mutate({ id: editingCamera.id, ...data });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this camera?")) {
      deleteMutation.mutate(id);
    }
  };

  const toggleEnabled = (id: string, enabled: boolean) => {
    toggleEnabledMutation.mutate({ id, enabled });
  };

  const startEdit = (camera: CameraConfig) => {
    setEditingCamera(camera);
    form.reset({
      name: camera.name,
      rtspUrl: camera.rtspUrl || "",
      enabled: camera.enabled,
    });
  };

  const getCameraIcon = (camera: CameraConfig) => {
    if (!camera.enabled) {
      return <Camera className="h-4 w-4 text-muted-foreground" />;
    }
    return <Video className="h-4 w-4 text-blue-500" />;
  };

  const getStatusBadge = (camera: CameraConfig) => {
    if (!camera.enabled) {
      return <Badge variant="secondary" className="text-xs">Disabled</Badge>;
    }
    if (!camera.rtspUrl) {
      return <Badge variant="outline" className="text-xs">No Stream</Badge>;
    }
    return <Badge variant="default" className="text-xs">Active</Badge>;
  };

  const getConnectionIcon = (camera: CameraConfig) => {
    if (!camera.enabled) {
      return <WifiOff className="h-4 w-4 text-muted-foreground" />;
    }
    if (!camera.rtspUrl) {
      return <WifiOff className="h-4 w-4 text-orange-500" />;
    }
    return <Wifi className="h-4 w-4 text-green-500" />;
  };

  // Simulated preview component
  const SimulatedPreview = ({ camera }: { camera: CameraConfig }) => {
    const [isPlaying, setIsPlaying] = useState(true);
    const [frameCount, setFrameCount] = useState(0);

    // Simulate frame updates with proper useEffect and cleanup
    useEffect(() => {
      if (!isPlaying) return;
      
      const interval = setInterval(() => {
        setFrameCount(prev => prev + 1);
      }, 100); // 10 FPS simulation
      
      return () => clearInterval(interval);
    }, [isPlaying]);

    return (
      <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden relative">
        {camera.enabled && camera.rtspUrl ? (
          <>
            {/* Simulated camera feed */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900">
              {/* Simulated video noise pattern */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)`,
                  transform: `translateX(${frameCount % 20}px)`
                }}
              />
              
              {/* Simulated timestamp */}
              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded font-mono">
                {new Date().toLocaleTimeString()}
              </div>
              
              {/* Simulated camera info */}
              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {camera.name}
              </div>
              
              {/* Simulated content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white/70">
                  <Video className="h-16 w-16 mx-auto mb-2" />
                  <p className="text-sm">Simulated Camera Feed</p>
                  <p className="text-xs text-white/50 mt-1">Frame: {frameCount}</p>
                </div>
              </div>
              
              {/* Play/pause indicator */}
              {!isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Play className="h-12 w-12 text-white" />
                </div>
              )}
            </div>
            
            {/* Controls */}
            <div className="absolute bottom-2 left-2 flex space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-black/60 text-white border-white/20 hover:bg-black/80"
                data-testid={`button-preview-${isPlaying ? 'pause' : 'play'}`}
              >
                {isPlaying ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </Button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Camera className="h-16 w-16 mx-auto mb-2" />
              <p className="text-sm">
                {!camera.enabled ? "Camera Disabled" : "No RTSP Stream Configured"}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (camerasLoading) {
    return <div className="flex items-center justify-center h-64">Loading cameras...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Camera Settings</h2>
          <p className="text-muted-foreground">
            Configure security cameras with RTSP streams and monitor live feeds.
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-camera">
                <Plus className="h-4 w-4 mr-2" />
                Add Camera
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Camera</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Camera Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Main Store Camera" {...field} data-testid="input-camera-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rtspUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RTSP URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="rtsp://192.168.1.100:554/stream" {...field} data-testid="input-camera-rtsp" />
                        </FormControl>
                        <div className="text-sm text-muted-foreground">
                          Enter the RTSP stream URL for this camera
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enabled</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Activate this camera for monitoring
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-camera-enabled"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" data-testid="button-create-camera">
                      Create Camera
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cameras grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cameras.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Camera className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Cameras Configured</h3>
            <p className="text-sm">Add your first security camera to get started with monitoring.</p>
          </div>
        ) : (
          cameras.map((camera: CameraConfig) => (
            <Card key={camera.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getCameraIcon(camera)}
                    <CardTitle className="text-lg">{camera.name}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getConnectionIcon(camera)}
                    {getStatusBadge(camera)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Simulated Preview */}
                <SimulatedPreview camera={camera} />
                
                {/* Camera Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RTSP URL:</span>
                    <span className="font-mono text-xs">
                      {camera.rtspUrl ? camera.rtspUrl.substring(0, 30) + "..." : "Not configured"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={camera.enabled ? "text-green-600" : "text-red-600"}>
                      {camera.enabled ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(camera.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleEnabled(camera.id, !camera.enabled)}
                      data-testid={`button-toggle-enabled-${camera.id}`}
                    >
                      {camera.enabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    
                    <Dialog open={previewingCamera?.id === camera.id} onOpenChange={(open) => !open && setPreviewingCamera(null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewingCamera(camera)}
                          data-testid={`button-preview-${camera.id}`}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Camera Preview - {camera.name}</DialogTitle>
                        </DialogHeader>
                        <div className="aspect-video">
                          <SimulatedPreview camera={camera} />
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog open={editingCamera?.id === camera.id} onOpenChange={(open) => !open && setEditingCamera(null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(camera)}
                          data-testid={`button-edit-${camera.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Camera</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Camera Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-edit-name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="rtspUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>RTSP URL (Optional)</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-edit-rtsp" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="enabled"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Enabled</FormLabel>
                                    <div className="text-sm text-muted-foreground">
                                      Activate this camera for monitoring
                                    </div>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      data-testid="switch-edit-enabled"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <div className="flex justify-end space-x-2">
                              <Button type="button" variant="outline" onClick={() => setEditingCamera(null)}>
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
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(camera.id)}
                    data-testid={`button-delete-${camera.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}