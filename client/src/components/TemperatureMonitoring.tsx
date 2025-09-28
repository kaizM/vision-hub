import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Thermometer, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  TrendingUp,
  TrendingDown
} from "lucide-react";

// Types from backend schema
interface TemperatureEquipment {
  id: string;
  name: string;
  minTemp: number;
  maxTemp: number;
  intervalHours: number;
  active: boolean;
  createdAt: Date;
}

interface TemperatureReading {
  id: string;
  equipmentId: string;
  value: number;
  status: "ok" | "high" | "low";
  takenBy: string;
  takenAt: Date;
}

interface Employee {
  id: string;
  name: string;
  role: string;
}

// Form schemas
const equipmentSchema = z.object({
  name: z.string().min(1, "Equipment name is required"),
  minTemp: z.number().min(-50, "Temperature too low").max(200, "Temperature too high"),
  maxTemp: z.number().min(-50, "Temperature too low").max(200, "Temperature too high"),
  intervalHours: z.number().min(1, "Interval must be at least 1 hour").max(168, "Interval too long"),
  active: z.boolean().default(true)
}).refine(data => data.maxTemp > data.minTemp, {
  message: "Maximum temperature must be higher than minimum temperature",
  path: ["maxTemp"]
});

const readingSchema = z.object({
  equipmentId: z.string().min(1, "Equipment selection required"),
  value: z.number().min(-50, "Temperature too low").max(200, "Temperature too high"),
  takenBy: z.string().min(1, "Employee selection required")
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;
type ReadingFormData = z.infer<typeof readingSchema>;

export function TemperatureMonitoring() {
  const { toast } = useToast();
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false);
  const [showReadingDialog, setShowReadingDialog] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<TemperatureEquipment | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");

  // Fetch temperature equipment
  const { data: equipment = [] } = useQuery<TemperatureEquipment[]>({
    queryKey: ['/api/temperature-equipment'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch employees for reading assignment
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['/api/employees']
  });

  // Fetch recent readings
  const { data: recentReadings = [] } = useQuery<TemperatureReading[]>({
    queryKey: ['/api/temperature-readings'],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Equipment form
  const equipmentForm = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: "",
      minTemp: 32,
      maxTemp: 40,
      intervalHours: 24,
      active: true
    }
  });

  // Reading form
  const readingForm = useForm<ReadingFormData>({
    resolver: zodResolver(readingSchema),
    defaultValues: {
      equipmentId: "",
      value: 35,
      takenBy: ""
    }
  });

  // Equipment mutations
  const createEquipmentMutation = useMutation({
    mutationFn: async (data: EquipmentFormData) => {
      const response = await fetch('/api/temperature-equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create equipment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/temperature-equipment'] });
      setShowEquipmentDialog(false);
      equipmentForm.reset();
      toast({ title: "Equipment created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create equipment", variant: "destructive" });
    }
  });

  const updateEquipmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EquipmentFormData> }) => {
      const response = await fetch(`/api/temperature-equipment/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update equipment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/temperature-equipment'] });
      setShowEquipmentDialog(false);
      setEditingEquipment(null);
      equipmentForm.reset();
      toast({ title: "Equipment updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update equipment", variant: "destructive" });
    }
  });

  const deleteEquipmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/temperature-equipment/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete equipment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/temperature-equipment'] });
      toast({ title: "Equipment deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete equipment", variant: "destructive" });
    }
  });

  // Reading mutation
  const addReadingMutation = useMutation({
    mutationFn: async (data: ReadingFormData) => {
      const response = await fetch('/api/temperature-readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to add reading');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/temperature-readings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] }); // Refresh alerts
      setShowReadingDialog(false);
      readingForm.reset();
      toast({ title: "Temperature reading recorded successfully" });
    },
    onError: () => {
      toast({ title: "Failed to record temperature reading", variant: "destructive" });
    }
  });

  // Helper functions
  const isEquipmentDue = (equip: TemperatureEquipment): boolean => {
    const lastReading = recentReadings
      .filter(r => r.equipmentId === equip.id)
      .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime())[0];
    
    if (!lastReading) return true; // No readings yet
    
    const now = new Date();
    const lastReadingTime = new Date(lastReading.takenAt);
    const hoursSinceReading = (now.getTime() - lastReadingTime.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceReading >= equip.intervalHours;
  };

  const getEquipmentStatus = (equip: TemperatureEquipment) => {
    const lastReading = recentReadings
      .filter(r => r.equipmentId === equip.id)
      .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime())[0];
    
    if (!lastReading) {
      return { status: "no-reading", label: "No Reading", variant: "secondary" as const };
    }
    
    const isDue = isEquipmentDue(equip);
    
    switch (lastReading.status) {
      case "high":
        return { status: "high", label: "Too High", variant: "destructive" as const };
      case "low":
        return { status: "low", label: "Too Low", variant: "destructive" as const };
      case "ok":
        if (isDue) {
          return { status: "due", label: "Reading Due", variant: "default" as const };
        }
        return { status: "ok", label: "Normal", variant: "secondary" as const };
      default:
        return { status: "unknown", label: "Unknown", variant: "outline" as const };
    }
  };

  const getTimeSinceReading = (equip: TemperatureEquipment): string => {
    const lastReading = recentReadings
      .filter(r => r.equipmentId === equip.id)
      .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime())[0];
    
    if (!lastReading) return "Never";
    
    const now = new Date();
    const lastReadingTime = new Date(lastReading.takenAt);
    const hoursSince = Math.floor((now.getTime() - lastReadingTime.getTime()) / (1000 * 60 * 60));
    
    if (hoursSince < 1) return "< 1 hour ago";
    if (hoursSince === 1) return "1 hour ago";
    return `${hoursSince} hours ago`;
  };

  const handleEditEquipment = (equip: TemperatureEquipment) => {
    setEditingEquipment(equip);
    equipmentForm.reset({
      name: equip.name,
      minTemp: equip.minTemp,
      maxTemp: equip.maxTemp,
      intervalHours: equip.intervalHours,
      active: equip.active
    });
    setShowEquipmentDialog(true);
  };

  const handleDeleteEquipment = (id: string) => {
    if (confirm("Are you sure you want to delete this equipment?")) {
      deleteEquipmentMutation.mutate(id);
    }
  };

  const onEquipmentSubmit = (data: EquipmentFormData) => {
    if (editingEquipment) {
      updateEquipmentMutation.mutate({ id: editingEquipment.id, data });
    } else {
      createEquipmentMutation.mutate(data);
    }
  };

  const onReadingSubmit = (data: ReadingFormData) => {
    addReadingMutation.mutate(data);
  };

  const activeEquipment = equipment.filter(e => e.active);
  const dueEquipment = activeEquipment.filter(isEquipmentDue);
  const outOfRangeReadings = recentReadings
    .filter(r => r.status !== "ok")
    .slice(0, 5); // Show 5 most recent alerts

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Temperature Monitoring</h2>
          <p className="text-muted-foreground">
            Monitor equipment temperatures and manage readings
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Dialog open={showReadingDialog} onOpenChange={setShowReadingDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-reading">
                <Thermometer className="h-4 w-4 mr-2" />
                Record Reading
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Temperature Reading</DialogTitle>
              </DialogHeader>
              <Form {...readingForm}>
                <form onSubmit={readingForm.handleSubmit(onReadingSubmit)} className="space-y-4">
                  <FormField
                    control={readingForm.control}
                    name="equipmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipment</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-equipment">
                              <SelectValue placeholder="Select equipment" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {activeEquipment.map((equip) => (
                              <SelectItem key={equip.id} value={equip.id}>
                                {equip.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={readingForm.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temperature (°F)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter temperature"
                            data-testid="input-temperature"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={readingForm.control}
                    name="takenBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taken By</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-employee">
                              <SelectValue placeholder="Select employee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowReadingDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={addReadingMutation.isPending}
                      data-testid="button-submit-reading"
                    >
                      {addReadingMutation.isPending ? "Recording..." : "Record Reading"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={showEquipmentDialog} onOpenChange={setShowEquipmentDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-add-equipment">
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingEquipment ? "Edit Equipment" : "Add Temperature Equipment"}
                </DialogTitle>
              </DialogHeader>
              <Form {...equipmentForm}>
                <form onSubmit={equipmentForm.handleSubmit(onEquipmentSubmit)} className="space-y-4">
                  <FormField
                    control={equipmentForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipment Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Beer Walk-in, Kitchen Freezer" data-testid="input-equipment-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={equipmentForm.control}
                      name="minTemp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Temp (°F)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="32"
                              data-testid="input-min-temp"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={equipmentForm.control}
                      name="maxTemp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Temp (°F)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="40"
                              data-testid="input-max-temp"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={equipmentForm.control}
                    name="intervalHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reading Interval (hours)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="24"
                            data-testid="input-interval"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowEquipmentDialog(false);
                        setEditingEquipment(null);
                        equipmentForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createEquipmentMutation.isPending || updateEquipmentMutation.isPending}
                      data-testid="button-submit-equipment"
                    >
                      {(createEquipmentMutation.isPending || updateEquipmentMutation.isPending) 
                        ? "Saving..." 
                        : editingEquipment 
                          ? "Update Equipment" 
                          : "Add Equipment"
                      }
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alert Section - Out of Range Readings */}
      {outOfRangeReadings.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Temperature Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {outOfRangeReadings.map((reading) => {
              const equip = equipment.find(e => e.id === reading.equipmentId);
              const employee = employees.find(e => e.id === reading.takenBy);
              return (
                <div key={reading.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Thermometer className="h-4 w-4" />
                      <span className="font-medium">{equip?.name || "Unknown Equipment"}</span>
                    </div>
                    <Badge variant="destructive">
                      {reading.value}°F ({reading.status})
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {employee?.name} • {new Date(reading.takenAt).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Due Prompts Section */}
      {dueEquipment.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-amber-700 dark:text-amber-300">
              <Clock className="h-5 w-5" />
              <span>Readings Due ({dueEquipment.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dueEquipment.map((equip) => (
              <div key={equip.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                <div className="flex items-center space-x-3">
                  <Thermometer className="h-4 w-4" />
                  <div>
                    <span className="font-medium">{equip.name}</span>
                    <p className="text-sm text-muted-foreground">
                      Last reading: {getTimeSinceReading(equip)}
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm"
                  onClick={() => {
                    readingForm.setValue("equipmentId", equip.id);
                    setShowReadingDialog(true);
                  }}
                  data-testid={`button-record-${equip.id}`}
                >
                  Record Reading
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeEquipment.map((equip) => {
          const status = getEquipmentStatus(equip);
          const lastReading = recentReadings
            .filter(r => r.equipmentId === equip.id)
            .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime())[0];
          
          return (
            <Card key={equip.id} className="hover-elevate">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <Thermometer className="h-4 w-4" />
                  <CardTitle className="text-sm font-medium">{equip.name}</CardTitle>
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => handleEditEquipment(equip)}
                    data-testid={`button-edit-${equip.id}`}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => handleDeleteEquipment(equip.id)}
                    data-testid={`button-delete-${equip.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {lastReading && (
                      <div className="flex items-center space-x-1 text-lg font-semibold">
                        {lastReading.status === "high" && <TrendingUp className="h-4 w-4 text-destructive" />}
                        {lastReading.status === "low" && <TrendingDown className="h-4 w-4 text-destructive" />}
                        {lastReading.status === "ok" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        <span>{lastReading.value}°F</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Range: {equip.minTemp}°F - {equip.maxTemp}°F</div>
                    <div>Interval: Every {equip.intervalHours} hours</div>
                    <div>Last reading: {getTimeSinceReading(equip)}</div>
                  </div>
                  
                  {isEquipmentDue(equip) && (
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        readingForm.setValue("equipmentId", equip.id);
                        setShowReadingDialog(true);
                      }}
                      data-testid={`button-quick-record-${equip.id}`}
                    >
                      Record Reading
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {activeEquipment.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Thermometer className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Temperature Equipment</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add temperature monitoring equipment to start tracking readings.
            </p>
            <Button onClick={() => setShowEquipmentDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}