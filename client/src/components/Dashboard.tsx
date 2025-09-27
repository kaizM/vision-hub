import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./TaskCard";
import { CameraFeed } from "./CameraFeed";
import { InventoryCard } from "./InventoryCard";
import { EmployeeStatus } from "./EmployeeStatus";
import { AlertBanner } from "./AlertBanner";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { LayoutDashboard, CheckSquare, Package, Camera, Users, Settings, Activity, Sun, Moon } from "lucide-react";

// Import camera images
import storeCameraImage from '@assets/generated_images/Store_security_camera_placeholder_afab940c.png';
import entranceCameraImage from '@assets/generated_images/Store_entrance_camera_placeholder_c157836f.png';
import parkingCameraImage from '@assets/generated_images/Store_parking_camera_placeholder_8962d0cd.png';

interface DashboardProps {
  currentUser: {
    id: string;
    name: string;
    role: string;
    checkedInAt: Date;
  };
  onLogout: () => void;
}

export function Dashboard({ currentUser, onLogout }: DashboardProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock data - todo: remove mock functionality
  const mockTasks = [
    {
      id: "1",
      title: "Check cigarette inventory",
      category: "inventory",
      dueAt: new Date(Date.now() + 30 * 60 * 1000),
      assignedTo: "Sarah Johnson",
      status: "pending" as const,
      isOverdue: false
    },
    {
      id: "2",
      title: "Clean restrooms",
      category: "cleaning", 
      dueAt: new Date(Date.now() - 15 * 60 * 1000),
      status: "pending" as const,
      isOverdue: true
    },
    {
      id: "3",
      title: "Restock coffee station",
      category: "customer_service",
      dueAt: new Date(Date.now() - 60 * 60 * 1000),
      assignedTo: "Mike Chen",
      status: "done" as const
    }
  ];

  const mockInventory = [
    {
      id: "1",
      sku: "CIG-001",
      name: "Marlboro Red",
      count: 15,
      minThreshold: 10,
      lastCountTs: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: "2",
      sku: "CIG-003",
      name: "Newport Menthol",
      count: 3,
      minThreshold: 5,
      lastCountTs: new Date()
    }
  ];

  const mockCameras = [
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

  const mockAlerts = [
    {
      id: "1",
      type: "warning" as const,
      title: "Low Inventory",
      message: "Newport Menthol cigarettes are below minimum threshold (3 remaining).",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      priority: "medium" as const,
      dismissible: true
    },
    {
      id: "2",
      type: "warning" as const,
      title: "Task Overdue", 
      message: "Restroom cleaning task is 15 minutes overdue.",
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      priority: "high" as const,
      dismissible: true
    }
  ];

  const activeEmployees = [
    currentUser,
    {
      id: "2",
      name: "Mike Chen",
      role: "employee",
      checkedInAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
    },
    {
      id: "3", 
      name: "Store Manager",
      role: "admin",
      checkedInAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
    }
  ];

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      isActive: true
    },
    {
      title: "Tasks",
      icon: CheckSquare
    },
    {
      title: "Inventory", 
      icon: Package
    },
    {
      title: "Cameras",
      icon: Camera
    },
    {
      title: "Employees",
      icon: Users
    },
    {
      title: "Reports",
      icon: Activity
    },
    ...(currentUser.role === "admin" ? [{
      title: "Settings",
      icon: Settings
    }] : [])
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleTaskComplete = (id: string, notes?: string) => {
    console.log(`Task ${id} completed`, notes);
  };

  const handleTaskReassign = (id: string) => {
    console.log(`Task ${id} reassigned`);
  };

  const handleInventoryUpdate = (id: string, newCount: number, reason: string) => {
    console.log(`Inventory ${id} updated: count=${newCount}, reason=${reason}`);
  };

  const handleAlertDismiss = (id: string) => {
    console.log(`Alert ${id} dismissed`);
  };

  return (
    <div className="flex h-screen w-full">
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>StoreHub</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <button className="flex items-center space-x-2 w-full">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b bg-background">
          <div>
            <h1 className="text-2xl font-bold">Operations Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {currentTime.toLocaleDateString()} - {currentTime.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setDarkMode(!darkMode)}
              data-testid="button-theme-toggle"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              onClick={onLogout}
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Alerts */}
            <AlertBanner alerts={mockAlerts} onDismiss={handleAlertDismiss} />

            {/* Top Row - Employee Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <EmployeeStatus
                  currentUser={currentUser}
                  activeEmployees={activeEmployees}
                  onCheckOut={() => console.log("Check out")}
                  onViewAll={() => console.log("View all employees")}
                />
              </div>
              
              {/* Quick Stats */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {mockTasks.filter(t => t.status === "pending").length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {mockTasks.filter(t => t.isOverdue).length} overdue
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {mockInventory.filter(i => i.count <= i.minThreshold).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Need attention
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Cameras</CardTitle>
                    <Camera className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {mockCameras.filter(c => c.isActive).length}/{mockCameras.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Online feeds
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Tasks Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Active Tasks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {mockTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    {...task}
                    onComplete={handleTaskComplete}
                    onReassign={handleTaskReassign}
                  />
                ))}
              </div>
            </div>

            {/* Camera Feeds */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Camera Feeds</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {mockCameras.map(camera => (
                  <CameraFeed
                    key={camera.id}
                    {...camera}
                    onSettings={() => console.log(`Settings for ${camera.id}`)}
                    onFullscreen={() => console.log(`Fullscreen ${camera.id}`)}
                  />
                ))}
              </div>
            </div>

            {/* Inventory */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Inventory Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockInventory.map(item => (
                  <InventoryCard
                    key={item.id}
                    {...item}
                    onUpdateCount={handleInventoryUpdate}
                    onQuickCount={() => console.log(`Quick count ${item.id}`)}
                  />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}