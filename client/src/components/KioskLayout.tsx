import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskCard } from "./TaskCard";
import { CameraFeed } from "./CameraFeed";
import { InventoryCard } from "./InventoryCard";
import { AlertBanner } from "./AlertBanner";
import { KioskOverlay } from "./KioskOverlay";
import { QuickShortcuts } from "./QuickShortcuts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Clock, Users, Package, Camera, Activity, Settings, RotateCcw, Zap, Thermometer, Box } from "lucide-react";

// Import camera images
import storeCameraImage from '@assets/generated_images/Store_security_camera_placeholder_afab940c.png';
import entranceCameraImage from '@assets/generated_images/Store_entrance_camera_placeholder_c157836f.png';
import parkingCameraImage from '@assets/generated_images/Store_parking_camera_placeholder_8962d0cd.png';

interface Employee {
  id: string;
  name: string;
  role: string;
  checkedInAt: Date;
}

interface EmployeeCall {
  id: string;
  employeeId: string;
  employeeName: string;
  taskTitle: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface KioskLayoutProps {
  onOpenPersonalTasks: (requirePin?: boolean) => void;
  onAdminAccess: () => void;
  isAdminMode?: boolean;
}

export function KioskLayout({ onOpenPersonalTasks, onAdminAccess, isAdminMode = false }: KioskLayoutProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeCall, setActiveCall] = useState<EmployeeCall | null>(null);
  const [callQueue, setCallQueue] = useState<EmployeeCall[]>([]);
  const [showCigaretteInventory, setShowCigaretteInventory] = useState(false);
  const [showEmployeeCalling, setShowEmployeeCalling] = useState(false);
  const [showCartonManagement, setShowCartonManagement] = useState<'add' | 'remove' | 'set' | 'reset' | null>(null);
  const [cartonAmount, setCartonAmount] = useState('');
  const [cartonEmployee, setCartonEmployee] = useState('');
  const [cartonNote, setCartonNote] = useState('');

  // Voice announcement function
  const speakAnnouncement = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      window.speechSynthesis.speak(utterance);
      
      // Play bell sound effect (simulate with beep)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Bell-like frequency
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } else {
      console.warn('Speech synthesis not supported');
      toast({
        title: "Voice Announcement",
        description: text,
      });
    }
  };

  // Carton adjustment mutation
  const adjustCartonsMutation = useMutation({
    mutationFn: async (params: { action: string; amount?: number; employee: string; note?: string }) => {
      const { action, amount, employee, note } = params;
      
      let delta = 0;
      if (action === 'add') delta = amount || 0;
      else if (action === 'remove') delta = -(amount || 0);
      else if (action === 'set') delta = (amount || 0) - cartonTotal.total;
      else if (action === 'reset') delta = -cartonTotal.total;
      
      return apiRequest("POST", "/api/cartons/adjust", {
        delta,
        employee,
        action,
        amount: Math.abs(amount || 0), // Ensure amount is always provided
        note: note || `${action} operation by ${employee}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cartons/total"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cartons/ledger"] });
      setShowCartonManagement(null);
      setCartonAmount('');
      setCartonEmployee('');
      setCartonNote('');
      toast({
        title: "Success",
        description: "Carton inventory updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update carton inventory",
        variant: "destructive",
      });
    },
  });


  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch real data from API
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: taskAssignments = [] } = useQuery({
    queryKey: ['/api/task-assignments'],
    refetchInterval: 15000 // Refresh every 15 seconds
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['/api/inventory'],
    refetchInterval: 60000 // Refresh every minute
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['/api/check-ins/active'],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  const { data: events = [] } = useQuery({
    queryKey: ['/api/events'],
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Fetch carton inventory total and recent entries
  const { data: cartonTotal = { total: 0 } } = useQuery<{ total: number }>({
    queryKey: ['/api/cartons/total'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: cartonLedger = [] } = useQuery({
    queryKey: ['/api/cartons/ledger'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch temperature equipment and readings
  const { data: temperatureEquipment = [] } = useQuery({
    queryKey: ['/api/temperature-equipment'],
    refetchInterval: 60000 // Refresh every minute
  });

  const { data: temperatureReadings = [] } = useQuery({
    queryKey: ['/api/temperature-readings'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Process real data from API after queries are defined
  const activeEmployees: Employee[] = (checkIns as any[]).map((checkIn: any) => {
    const employee = (employees as any[]).find((emp: any) => emp.id === checkIn.employeeId);
    return {
      id: employee?.id || checkIn.employeeId,
      name: employee?.name || 'Unknown Employee',
      role: employee?.role || 'employee',
      checkedInAt: new Date(checkIn.tsIn)
    };
  }).filter((emp: Employee) => emp.name !== 'Unknown Employee');

  // Get current task - either from task assignments or default with proper date parsing
  const currentTask = (taskAssignments as any[]).find((assignment: any) => 
    assignment.status === 'pending' && 
    new Date(assignment.dueAt).getTime() > Date.now() - 60 * 60 * 1000 // Due within last hour
  ) || {
    id: "default-1",
    title: "Check store operations",
    category: "general",
    dueAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    frequency: 30
  };

  // Ensure dueAt is properly converted to Date object for safe date operations
  const safeCurrentTask = {
    ...currentTask,
    dueAt: new Date(currentTask.dueAt),
    frequency: currentTask.frequency || 30
  };

  // Process temperature data
  const temperatureAlerts = (temperatureEquipment as any[]).map((equipment: any) => {
    const latestReading = (temperatureReadings as any[])
      .filter((reading: any) => reading.equipmentId === equipment.id)
      .sort((a: any, b: any) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime())[0];
    
    return {
      ...equipment,
      currentTemp: latestReading?.value || null,
      status: latestReading?.status || 'unknown',
      lastReading: latestReading?.takenAt ? new Date(latestReading.takenAt) : null
    };
  });

  // Get recent carton entries for display
  const recentCartonEntries = (cartonLedger as any[])
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3);

  // Process recent alerts from events
  const recentAlerts = (events as any[])
    .filter((event: any) => 
      ['inventory:low', 'employee:checkin', 'task:overdue'].includes(event.type) &&
      Date.now() - new Date(event.ts).getTime() < 2 * 60 * 60 * 1000 // Last 2 hours
    )
    .slice(0, 5)
    .map((event: any) => {
      const alertType = event.type === 'task:overdue' ? 'warning' : 
                       event.type === 'inventory:low' ? 'warning' : 'info';
      
      return {
        id: event.id,
        type: alertType as "error" | "warning" | "info" | "success",
        title: event.type === 'employee:checkin' ? 'Employee Check-in' :
               event.type === 'inventory:low' ? 'Low Inventory' : 'Task Alert',
        message: JSON.stringify(event.detail).replace(/[{}\"]/g, ''),
        timestamp: new Date(event.ts),
        priority: (event.type === 'task:overdue' ? 'high' : 'medium') as "low" | "medium" | "high",
        dismissible: true
      };
    });

  // Static camera configuration (cameras don't change frequently)
  const cameras = [
    {
      id: "cam-1",
      name: "Main Store",
      location: "Aisle 1-3",
      isActive: true,
      simulatedImageUrl: storeCameraImage
    },
    {
      id: "cam-2",
      name: "Entrance",
      location: "Front Door", 
      isActive: true,
      simulatedImageUrl: entranceCameraImage
    },
    {
      id: "cam-3",
      name: "Parking Lot",
      location: "Exterior",
      isActive: false,
      simulatedImageUrl: parkingCameraImage
    }
  ];

  // Critical inventory items (below threshold) with date conversion
  const criticalInventory = (inventory as any[])
    .filter((item: any) => item.count <= item.minThreshold)
    .map((item: any) => ({
      ...item,
      lastCountTs: item.lastCountTs ? new Date(item.lastCountTs) : new Date()
    }));

  // Demo function to simulate employee call
  const simulateEmployeeCall = async () => {
    const employees = ["Sarah Johnson", "Mike Chen", "Alex Rivera"];
    const tasks = ["Clean restrooms", "Check inventory", "Restock coffee station"];
    
    const randomEmployee = employees[Math.floor(Math.random() * employees.length)];
    const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
    
    const newCall: EmployeeCall = {
      id: Date.now().toString(),
      employeeId: Math.random().toString(),
      employeeName: randomEmployee,
      taskTitle: randomTask,
      timestamp: new Date(),
      acknowledged: false
    };

    setActiveCall(newCall);
    console.log(`Calling employee: ${randomEmployee} for task: ${randomTask}`);
    
    // Log the employee call to the backend
    try {
      await fetch('/api/employee-calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: Math.random().toString(),
          employeeName: randomEmployee,
          taskId: undefined,
          taskTitle: randomTask
        }),
      });
    } catch (error) {
      console.error('Failed to log employee call:', error);
    }
  };

  const handleCallAcknowledge = () => {
    if (activeCall) {
      console.log(`Call acknowledged for ${activeCall.employeeName}`);
      setActiveCall(null);
    }
  };

  const handleCallDismiss = () => {
    if (activeCall) {
      console.log(`Call dismissed for ${activeCall.employeeName}`);
      setActiveCall(null);
    }
  };

  const handleOpenPersonalTasks = () => {
    console.log("Opening personal tasks interface");
    onOpenPersonalTasks(true);
  };

  const handleAdminAccess = () => {
    console.log("Accessing admin controls");
    onAdminAccess();
  };

  const getNextTaskTime = () => {
    const nextRotation = new Date(safeCurrentTask.dueAt.getTime() + safeCurrentTask.frequency * 60 * 1000);
    const minutesUntil = Math.round((nextRotation.getTime() - Date.now()) / 60000);
    return minutesUntil > 0 ? `${minutesUntil}m` : "Now";
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Employee Call Overlay */}
      {activeCall && (
        <KioskOverlay
          employeeName={activeCall.employeeName}
          taskTitle={activeCall.taskTitle}
          timestamp={activeCall.timestamp}
          onAcknowledge={handleCallAcknowledge}
          onDismiss={handleCallDismiss}
          onOpenTask={() => {
            handleCallAcknowledge();
            handleOpenPersonalTasks();
          }}
        />
      )}

      {/* Main Kiosk Interface */}
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">StoreHub Operations</h1>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2 text-lg text-muted-foreground">
                <Clock className="h-5 w-5" />
                <span>{currentTime.toLocaleDateString()} - {currentTime.toLocaleTimeString()}</span>
              </div>
              <Badge variant="outline" className="text-sm">
                <Users className="h-3 w-3 mr-1" />
                {activeEmployees.length} staff on duty
              </Badge>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              size="lg"
              onClick={handleOpenPersonalTasks}
              data-testid="button-reopen-tasks"
              className="text-lg px-6 py-3"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Reopen My Tasks
            </Button>
            
            {isAdminMode && (
              <>
                {/* Demo Call Employee button removed - employee calls now handled automatically from admin interface */}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleAdminAccess}
                  data-testid="button-admin-access"
                  className="text-lg px-6 py-3"
                >
                  <Settings className="h-5 w-5 mr-2" />
                  Admin
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Enhanced Current Task Display with Actions */}
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <RotateCcw className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="text-xl">Current Rotating Task</span>
                  <p className="text-sm text-muted-foreground font-normal">
                    Rotates every {safeCurrentTask.frequency} minutes
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-background">
                Due in {getNextTaskTime()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-background border">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{safeCurrentTask.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Category: {safeCurrentTask.category?.replace('_', ' ') || 'General'} • Due: {safeCurrentTask.dueAt.toLocaleTimeString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => console.log(`Marking task ${safeCurrentTask.id} as complete`)}
                  data-testid="button-complete-task"
                >
                  Complete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log(`Skipping task ${safeCurrentTask.id}`)}
                  data-testid="button-skip-task"
                >
                  Skip
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Next rotation: {new Date(safeCurrentTask.dueAt.getTime() + safeCurrentTask.frequency * 60 * 1000).toLocaleTimeString()}</span>
              <span>Frequency: {safeCurrentTask.frequency}m</span>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Section */}
        {recentAlerts.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-3 flex items-center space-x-2">
              <span>Recent Alerts</span>
              <Badge variant="outline">{recentAlerts.length}</Badge>
            </h2>
            <AlertBanner
              alerts={recentAlerts}
              onDismiss={(id) => console.log(`Alert ${id} dismissed`)}
              maxVisible={2}
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Cameras */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Camera Feeds</span>
              <Badge variant="outline">{cameras.filter(c => c.isActive).length}/{cameras.length} online</Badge>
            </h2>
            <div className="space-y-4">
              {cameras.slice(0, 2).map(camera => (
                <CameraFeed
                  key={camera.id}
                  {...camera}
                  onSettings={() => console.log(`Settings for ${camera.id}`)}
                  onFullscreen={() => console.log(`Fullscreen ${camera.id}`)}
                />
              ))}
            </div>
          </div>

          {/* Right Column - Quick Shortcuts & Inventory */}
          <div className="space-y-6">
            
            {/* Quick Shortcuts Panel */}
            <QuickShortcuts 
              maxVisible={6}
              layout="grid"
              showHeader={true}
            />
            
            {/* Cigarette Inventory - Full Management */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                <Box className="h-5 w-5" />
                <span>Cigarette Inventory</span>
                <Badge variant="outline">{cartonTotal.total} cartons</Badge>
              </h2>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Total: {cartonTotal.total} Cartons</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="default"
                      size="sm"
                      onClick={() => setShowCigaretteInventory(true)}
                      data-testid="button-manage-cigarettes"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Manage Inventory
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEmployeeCalling(true)}
                      data-testid="button-call-employees"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Call Employees
                    </Button>
                  </div>
                  
                  {recentCartonEntries.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Recent Updates:</h4>
                      {recentCartonEntries.map((entry: any) => (
                        <div key={entry.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                          <span className="font-medium">{entry.action}</span>
                          <span className={entry.delta > 0 ? "text-green-600" : "text-red-600"}>
                            {entry.delta > 0 ? '+' : ''}{entry.delta}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Temperature Monitoring */}
            {temperatureAlerts.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                  <Thermometer className="h-5 w-5" />
                  <span>Temperature Status</span>
                  <Badge variant={temperatureAlerts.some((t: any) => t.status !== 'ok') ? "destructive" : "outline"}>
                    {temperatureAlerts.filter((t: any) => t.status === 'ok').length}/{temperatureAlerts.length} OK
                  </Badge>
                </h2>
                <div className="space-y-3">
                  {temperatureAlerts.map((temp: any) => (
                    <Card key={temp.id} className={temp.status !== 'ok' ? "border-destructive/50" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{temp.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Range: {temp.minTemp}°F - {temp.maxTemp}°F
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${
                              temp.status === 'ok' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {temp.currentTemp ? `${temp.currentTemp}°F` : '--'}
                            </div>
                            <Badge variant={temp.status === 'ok' ? "outline" : "destructive"} className="text-xs">
                              {temp.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        {temp.lastReading && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Last reading: {temp.lastReading.toLocaleTimeString()}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Staff Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Staff On Duty</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeEmployees.map(employee => (
                    <div key={employee.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                      <div>
                        <span className="font-medium">{employee.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {employee.role.replace('_', ' ')}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {Math.floor((Date.now() - employee.checkedInAt.getTime()) / (1000 * 60 * 60))}h ago
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Cigarette Inventory Management Dialog */}
      <Dialog open={showCigaretteInventory} onOpenChange={setShowCigaretteInventory}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cigarette Inventory Management</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{cartonTotal.total}</div>
              <div className="text-sm text-muted-foreground">Current Cartons</div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="default" 
                onClick={() => {
                  setShowCigaretteInventory(false);
                  setShowCartonManagement('add');
                }}
                data-testid="button-add-cartons"
              >
                + Add Cartons
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCigaretteInventory(false);
                  setShowCartonManagement('remove');
                }}
                data-testid="button-remove-cartons"
              >
                - Remove Cartons
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCigaretteInventory(false);
                  setShowCartonManagement('set');
                }}
                data-testid="button-set-cartons"
              >
                Set Total
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  setShowCigaretteInventory(false);
                  setShowCartonManagement('reset');
                }}
                data-testid="button-reset-cartons"
              >
                Reset Count
              </Button>
            </div>

            <div className="text-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCigaretteInventory(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Employee Calling Dialog */}
      <Dialog open={showEmployeeCalling} onOpenChange={setShowEmployeeCalling}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Call Employees</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Employees</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {activeEmployees.length > 0 ? (
                  activeEmployees.map(employee => (
                    <div key={employee.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="font-medium">{employee.name}</span>
                        <Badge variant="outline" className="text-xs">{employee.role}</Badge>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const announcement = `${employee.name}, please come to the front counter. ${employee.name}, please come to the front counter.`;
                          speakAnnouncement(announcement);
                          toast({
                            title: "Employee Called",
                            description: `Voice announcement sent to ${employee.name}`,
                          });
                        }}
                        data-testid={`button-call-${employee.id}`}
                      >
                        Call
                      </Button>
                    </div>
                  ))
                ) : (
                  // Fallback to all employees when no one is checked in
                  (employees as any[]).map((employee: any) => (
                    <div key={employee.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        <span className="font-medium">{employee.name}</span>
                        <Badge variant="outline" className="text-xs">{employee.role}</Badge>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const announcement = `${employee.name}, please come to the front counter. ${employee.name}, please come to the front counter.`;
                          speakAnnouncement(announcement);
                          toast({
                            title: "Employee Called",
                            description: `Voice announcement sent to ${employee.name}`,
                          });
                        }}
                        data-testid={`button-call-${employee.id}`}
                      >
                        Call
                      </Button>
                    </div>
                  ))
                )}
                
                {activeEmployees.length === 0 && (employees as any[]).length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No employees available
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea 
                placeholder="Enter work assignment or message..." 
                rows={3}
                value={cartonNote}
                onChange={(e) => setCartonNote(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                className="flex-1"
                onClick={() => {
                  const message = cartonNote || "Please report to the front counter for a work assignment";
                  const selectedEmployees = activeEmployees.filter(emp => emp.name); // All visible employees
                  
                  if (selectedEmployees.length > 0) {
                    const announcement = `Attention all staff: ${message}. Please respond promptly.`;
                    speakAnnouncement(announcement);
                  }
                  
                  toast({
                    title: "Announcement Sent",
                    description: `Voice announcement sent to ${selectedEmployees.length} employees`,
                  });
                  setShowEmployeeCalling(false);
                  setCartonNote('');
                }}
                data-testid="button-send-announcement"
              >
                Send Voice Announcement
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowEmployeeCalling(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Carton Management Dialog */}
      <Dialog open={!!showCartonManagement} onOpenChange={() => setShowCartonManagement(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {showCartonManagement === 'add' && 'Add Cartons'}
              {showCartonManagement === 'remove' && 'Remove Cartons'}
              {showCartonManagement === 'set' && 'Set Total Cartons'}
              {showCartonManagement === 'reset' && 'Reset Carton Count'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold">Current: {cartonTotal.total}</div>
              <div className="text-sm text-muted-foreground">cartons in inventory</div>
            </div>

            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={cartonEmployee} onValueChange={setCartonEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {activeEmployees.length > 0 ? (
                    activeEmployees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.name}>
                        {employee.name} ({employee.role})
                      </SelectItem>
                    ))
                  ) : (
                    // Fallback to all employees when no one is checked in
                    (employees as any[]).map((employee: any) => (
                      <SelectItem key={employee.id} value={employee.name}>
                        {employee.name} ({employee.role})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {showCartonManagement !== 'reset' && (
              <div className="space-y-2">
                <Label>
                  {showCartonManagement === 'add' && 'Cartons to Add'}
                  {showCartonManagement === 'remove' && 'Cartons to Remove'}
                  {showCartonManagement === 'set' && 'Set Total To'}
                </Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter amount"
                  value={cartonAmount}
                  onChange={(e) => setCartonAmount(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Note (Optional)</Label>
              <Textarea
                placeholder="Add a note about this operation"
                rows={2}
                value={cartonNote}
                onChange={(e) => setCartonNote(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowCartonManagement(null)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                disabled={!cartonEmployee || (showCartonManagement !== 'reset' && !cartonAmount)}
                onClick={() => {
                  const amount = showCartonManagement === 'reset' ? 0 : parseInt(cartonAmount) || 0;
                  console.log(`[Carton] Submitting ${showCartonManagement} operation:`, { 
                    action: showCartonManagement, 
                    amount, 
                    employee: cartonEmployee, 
                    note: cartonNote,
                    rawAmount: cartonAmount 
                  });
                  adjustCartonsMutation.mutate({
                    action: showCartonManagement!,
                    amount,
                    employee: cartonEmployee,
                    note: cartonNote
                  });
                }}
              >
                {adjustCartonsMutation.isPending ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}