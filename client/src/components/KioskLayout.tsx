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
import { Clock, Users, Package, Camera, Activity, Settings, RotateCcw } from "lucide-react";

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

  // Process real data from API after queries are defined
  const activeEmployees: Employee[] = checkIns.map((checkIn: any) => {
    const employee = employees.find((emp: any) => emp.id === checkIn.employeeId);
    return {
      id: employee?.id || checkIn.employeeId,
      name: employee?.name || 'Unknown Employee',
      role: employee?.role || 'employee',
      checkedInAt: new Date(checkIn.tsIn)
    };
  }).filter((emp: Employee) => emp.name !== 'Unknown Employee');

  // Get current task - either from task assignments or default
  const currentTask = taskAssignments.find((assignment: any) => 
    assignment.status === 'pending' && 
    new Date(assignment.dueAt).getTime() > Date.now() - 60 * 60 * 1000 // Due within last hour
  ) || {
    id: "default-1",
    title: "Check store operations",
    category: "general",
    dueAt: new Date(Date.now() + 30 * 60 * 1000),
    frequency: 30
  };

  // Process recent alerts from events
  const recentAlerts = events
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
        type: alertType as const,
        title: event.type === 'employee:checkin' ? 'Employee Check-in' :
               event.type === 'inventory:low' ? 'Low Inventory' : 'Task Alert',
        message: JSON.stringify(event.detail).replace(/[{}\"]/g, ''),
        timestamp: new Date(event.ts),
        priority: (event.type === 'task:overdue' ? 'high' : 'medium') as const,
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
  const criticalInventory = inventory
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
    const nextRotation = new Date(currentTask.dueAt.getTime() + currentTask.frequency * 60 * 1000);
    const minutesUntil = Math.round((nextRotation.getTime() - Date.now()) / 60000);
    return `Next task in ${minutesUntil}m`;
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
                <Button
                  size="lg"
                  variant="outline"
                  onClick={simulateEmployeeCall}
                  data-testid="button-demo-call"
                  className="text-lg px-6 py-3"
                >
                  Demo Call Employee
                </Button>
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

        {/* Current Task Display */}
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-xl">
              <Activity className="h-6 w-6" />
              <span>Current Rotating Task</span>
              <Badge variant="outline">{getNextTaskTime()}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold">{currentTask.title}</h3>
                <p className="text-muted-foreground mt-1">
                  Category: {currentTask.category.replace('_', ' ')} • Due: {currentTask.dueAt.toLocaleTimeString()}
                </p>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Every {currentTask.frequency}m
              </Badge>
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

          {/* Right Column - Inventory & Stats */}
          <div className="space-y-6">
            {/* Critical Inventory */}
            {criticalInventory.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Critical Inventory</span>
                  <Badge variant="destructive">{criticalInventory.length} items</Badge>
                </h2>
                <div className="space-y-3">
                  {criticalInventory.map(item => (
                    <InventoryCard
                      key={item.id}
                      {...item}
                      onUpdateCount={(id, count, reason) => console.log(`Updated ${id}: ${count} (${reason})`)}
                      onQuickCount={(id) => console.log(`Quick count ${id}`)}
                    />
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
    </div>
  );
}