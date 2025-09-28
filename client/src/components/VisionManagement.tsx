import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Plus, 
  Trash2, 
  Eye,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  Car,
  AlertTriangle,
  CheckCircle,
  Clock,
  Image as ImageIcon,
  FileText,
  Camera,
  Target,
  Ban,
  UserX,
  AlertOctagon
} from "lucide-react";

// Types based on schema
interface BannedFace {
  id: string;
  label: string;
  imagePath: string;
  addedAt: Date;
}

interface BannedPlate {
  id: string;
  plateText: string;
  addedAt: Date;
}

interface VisionAlert {
  id: string;
  type: string;
  detail: {
    alertType: "face" | "plate";
    confidence?: number;
    location?: string;
    timestamp: string;
    description?: string;
  };
  ts: Date;
}

// Form validation schemas
const bannedFaceFormSchema = z.object({
  label: z.string().min(1, "Label is required").max(100, "Label too long"),
  imagePath: z.string().min(1, "Image path is required"),
});

const bannedPlateFormSchema = z.object({
  plateText: z.string().min(1, "Plate text is required").max(20, "Plate text too long").regex(/^[A-Z0-9\-\s]+$/i, "Invalid plate format"),
});

type BannedFaceFormValues = z.infer<typeof bannedFaceFormSchema>;
type BannedPlateFormValues = z.infer<typeof bannedPlateFormSchema>;

export function VisionManagement() {
  const { toast } = useToast();
  const [showAddFaceDialog, setShowAddFaceDialog] = useState(false);
  const [showAddPlateDialog, setShowAddPlateDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<VisionAlert | null>(null);

  // Fetch banned faces
  const { data: bannedFaces = [], isLoading: facesLoading, error: facesError } = useQuery({
    queryKey: ['/api/vision/faces'],
    queryFn: async () => {
      const response = await fetch('/api/vision/faces');
      if (!response.ok) {
        throw new Error('Failed to fetch banned faces');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch banned plates
  const { data: bannedPlates = [], isLoading: platesLoading, error: platesError } = useQuery({
    queryKey: ['/api/vision/plates'],
    queryFn: async () => {
      const response = await fetch('/api/vision/plates');
      if (!response.ok) {
        throw new Error('Failed to fetch banned plates');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch vision alerts
  const { data: visionAlerts = [], isLoading: alertsLoading, error: alertsError } = useQuery({
    queryKey: ['/api/vision/alerts'],
    queryFn: async () => {
      const response = await fetch('/api/vision/alerts');
      if (!response.ok) {
        throw new Error('Failed to fetch vision alerts');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Create banned face mutation
  const createFaceMutation = useMutation({
    mutationFn: (data: BannedFaceFormValues) => apiRequest("POST", "/api/vision/faces", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vision/faces'] });
      setShowAddFaceDialog(false);
      toast({ title: "Success", description: "Banned face added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add banned face", variant: "destructive" });
    },
  });

  // Create banned plate mutation
  const createPlateMutation = useMutation({
    mutationFn: (data: BannedPlateFormValues) => apiRequest("POST", "/api/vision/plates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vision/plates'] });
      setShowAddPlateDialog(false);
      toast({ title: "Success", description: "Banned plate added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add banned plate", variant: "destructive" });
    },
  });

  // Delete banned face mutation
  const deleteFaceMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/vision/faces/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vision/faces'] });
      toast({ title: "Success", description: "Banned face removed successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to remove banned face", variant: "destructive" });
    },
  });

  // Delete banned plate mutation
  const deletePlateMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/vision/plates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vision/plates'] });
      toast({ title: "Success", description: "Banned plate removed successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to remove banned plate", variant: "destructive" });
    },
  });

  // Form setup
  const faceForm = useForm<BannedFaceFormValues>({
    resolver: zodResolver(bannedFaceFormSchema),
    defaultValues: {
      label: "",
      imagePath: "",
    },
  });

  const plateForm = useForm<BannedPlateFormValues>({
    resolver: zodResolver(bannedPlateFormSchema),
    defaultValues: {
      plateText: "",
    },
  });

  // Form handlers
  const handleCreateFace = (data: BannedFaceFormValues) => {
    createFaceMutation.mutate(data);
  };

  const handleCreatePlate = (data: BannedPlateFormValues) => {
    createPlateMutation.mutate(data);
  };

  const handleDeleteFace = (id: string) => {
    if (confirm("Are you sure you want to remove this banned face?")) {
      deleteFaceMutation.mutate(id);
    }
  };

  const handleDeletePlate = (id: string) => {
    if (confirm("Are you sure you want to remove this banned plate?")) {
      deletePlateMutation.mutate(id);
    }
  };

  const getAlertSeverityBadge = (alert: VisionAlert) => {
    const confidence = alert.detail.confidence || 0;
    if (confidence >= 0.9) {
      return <Badge variant="destructive" className="text-xs">High Confidence</Badge>;
    } else if (confidence >= 0.7) {
      return <Badge variant="outline" className="text-xs text-orange-600">Medium Confidence</Badge>;
    } else {
      return <Badge variant="secondary" className="text-xs">Low Confidence</Badge>;
    }
  };

  const getAlertIcon = (alertType: "face" | "plate") => {
    return alertType === "face" ? <UserX className="h-4 w-4" /> : <Ban className="h-4 w-4" />;
  };

  const formatPlateText = (plateText: string) => {
    return plateText.toUpperCase().replace(/[^A-Z0-9]/g, '');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vision Management</h2>
          <p className="text-muted-foreground">
            Manage banned faces, license plates, and review vision system alerts.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            <Eye className="h-3 w-3 mr-1" />
            Vision System Active
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banned Faces</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bannedFaces.length}</div>
            <p className="text-xs text-muted-foreground">Active face restrictions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banned Plates</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bannedPlates.length}</div>
            <p className="text-xs text-muted-foreground">Vehicle restrictions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visionAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Vision alerts today</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="faces" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="faces" data-testid="tab-faces">
            <Users className="h-4 w-4 mr-2" />
            Banned Faces
          </TabsTrigger>
          <TabsTrigger value="plates" data-testid="tab-plates">
            <Car className="h-4 w-4 mr-2" />
            Banned Plates
          </TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">
            <Shield className="h-4 w-4 mr-2" />
            Vision Alerts
          </TabsTrigger>
        </TabsList>

        {/* Banned Faces Tab */}
        <TabsContent value="faces" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Banned Faces Management</h3>
            <Dialog open={showAddFaceDialog} onOpenChange={setShowAddFaceDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-face">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Banned Face
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Banned Face</DialogTitle>
                </DialogHeader>
                <Form {...faceForm}>
                  <form onSubmit={faceForm.handleSubmit(handleCreateFace)} className="space-y-4">
                    <FormField
                      control={faceForm.control}
                      name="label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Label/Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Person description or ID" {...field} data-testid="input-face-label" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={faceForm.control}
                      name="imagePath"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image/Video Upload</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input 
                                type="file" 
                                accept="image/*,video/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      // Convert file to base64 for JSON upload (simpler than multipart)
                                      const reader = new FileReader();
                                      reader.onload = async () => {
                                        try {
                                          const response = await fetch('/api/vision/upload', {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({
                                              file: {
                                                name: file.name,
                                                size: file.size,
                                                type: file.type,
                                                data: reader.result // base64 data
                                              },
                                              type: 'face',
                                              label: faceForm.getValues('label') || 'Unknown'
                                            })
                                          });
                                          
                                          if (response.ok) {
                                            const result = await response.json();
                                            field.onChange(result.path);
                                          } else {
                                            console.error('Upload failed');
                                            field.onChange(`/uploads/faces/${file.name}`); // Fallback
                                          }
                                        } catch (error) {
                                          console.error('Upload error:', error);
                                          field.onChange(`/uploads/faces/${file.name}`); // Fallback
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    } catch (error) {
                                      console.error('File read error:', error);
                                      field.onChange(`/uploads/faces/${file.name}`); // Fallback
                                    }
                                  }
                                }}
                                data-testid="input-face-upload"
                              />
                              <Input 
                                placeholder="/images/banned/person1.jpg or /videos/suspect.mp4" 
                                {...field} 
                                data-testid="input-face-path"
                              />
                            </div>
                          </FormControl>
                          <div className="text-sm text-muted-foreground">
                            Upload image/video file or enter path. Supports face recognition and body structure analysis via OpenCV.
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowAddFaceDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" data-testid="button-create-face">
                        Add Face
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {facesLoading ? (
            <div className="flex items-center justify-center h-32">Loading banned faces...</div>
          ) : bannedFaces.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Banned Faces</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Add face profiles to automatically detect and alert on banned individuals.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bannedFaces.map((face: BannedFace) => (
                <Card key={face.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{face.label}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        <Target className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Simulated face image placeholder */}
                    <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-xs">Face Image</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Image:</span>
                        <span className="font-mono text-xs">{face.imagePath.substring(0, 20)}...</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Added:</span>
                        <span>{new Date(face.addedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFace(face.id)}
                        data-testid={`button-delete-face-${face.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Banned Plates Tab */}
        <TabsContent value="plates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Banned License Plates</h3>
            <Dialog open={showAddPlateDialog} onOpenChange={setShowAddPlateDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-plate">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Banned Plate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Banned License Plate</DialogTitle>
                </DialogHeader>
                <Form {...plateForm}>
                  <form onSubmit={plateForm.handleSubmit(handleCreatePlate)} className="space-y-4">
                    <FormField
                      control={plateForm.control}
                      name="plateText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Plate Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="ABC123" 
                              {...field} 
                              className="font-mono uppercase"
                              onChange={(e) => field.onChange(formatPlateText(e.target.value))}
                              data-testid="input-plate-text"
                            />
                          </FormControl>
                          <div className="text-sm text-muted-foreground">
                            Enter the license plate number (letters and numbers only)
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowAddPlateDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" data-testid="button-create-plate">
                        Add Plate
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {platesLoading ? (
            <div className="flex items-center justify-center h-32">Loading banned plates...</div>
          ) : bannedPlates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Car className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Banned Plates</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Add license plate numbers to monitor and alert on restricted vehicles.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {bannedPlates.map((plate: BannedPlate) => (
                <Card key={plate.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        <Ban className="h-3 w-3 mr-1" />
                        Banned
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* License plate visual */}
                    <div className="bg-blue-600 text-white p-3 rounded-lg text-center">
                      <div className="text-xs text-blue-200 mb-1">LICENSE PLATE</div>
                      <div className="text-lg font-bold font-mono tracking-wider">
                        {plate.plateText}
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Added:</span>
                        <span>{new Date(plate.addedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePlate(plate.id)}
                        data-testid={`button-delete-plate-${plate.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Vision Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Vision System Alerts</h3>
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Real-time Monitoring
            </Badge>
          </div>

          {alertsLoading ? (
            <div className="flex items-center justify-center h-32">Loading vision alerts...</div>
          ) : visionAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShieldCheck className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Vision Alerts</h3>
                <p className="text-sm text-muted-foreground text-center">
                  The vision system is monitoring actively. Alerts will appear here when banned faces or plates are detected.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {visionAlerts.map((alert: VisionAlert) => (
                <Card key={alert.id} className="hover-elevate">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                          {getAlertIcon(alert.detail.alertType)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">
                              {alert.detail.alertType === "face" ? "Banned Face Detected" : "Banned Plate Detected"}
                            </h4>
                            {getAlertSeverityBadge(alert)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {alert.detail.description || `${alert.detail.alertType} detection alert`}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>
                              <Clock className="h-3 w-3 inline mr-1" />
                              {new Date(alert.ts).toLocaleString()}
                            </span>
                            {alert.detail.location && (
                              <span>
                                <Camera className="h-3 w-3 inline mr-1" />
                                {alert.detail.location}
                              </span>
                            )}
                            {alert.detail.confidence && (
                              <span>
                                <Target className="h-3 w-3 inline mr-1" />
                                {(alert.detail.confidence * 100).toFixed(1)}% confidence
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedAlert(alert)}
                          data-testid={`button-view-alert-${alert.id}`}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`button-confirm-alert-${alert.id}`}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Confirm
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Alert Detail Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vision Alert Details</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Alert Type</Label>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedAlert.detail.alertType} Detection
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Timestamp</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedAlert.ts).toLocaleString()}
                  </p>
                </div>
                {selectedAlert.detail.confidence && (
                  <div>
                    <Label className="text-sm font-medium">Confidence</Label>
                    <p className="text-sm text-muted-foreground">
                      {(selectedAlert.detail.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
                {selectedAlert.detail.location && (
                  <div>
                    <Label className="text-sm font-medium">Location</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedAlert.detail.location}
                    </p>
                  </div>
                )}
              </div>
              
              {selectedAlert.detail.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedAlert.detail.description}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                  Close
                </Button>
                <Button data-testid="button-confirm-selected-alert">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Alert
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}