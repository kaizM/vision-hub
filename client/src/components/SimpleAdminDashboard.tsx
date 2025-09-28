import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskManagement } from "./TaskManagement";
import { EmployeeManagement } from "./EmployeeManagement";
import { TemperatureMonitoring } from "./TemperatureMonitoring";
import { CartonInventory } from "./CartonInventory";
import { ShortcutsManagement } from "./ShortcutsManagement";
import { CameraSettings } from "./CameraSettings";
import { VisionManagement } from "./VisionManagement";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Package, 
  Camera, 
  Users, 
  Settings, 
  Thermometer,
  Activity,
  LogOut,
  Settings as Gear,
  Zap,
  Shield
} from "lucide-react";

interface SimpleAdminDashboardProps {
  currentUser: {
    id: string;
    name: string;
    role: string;
    checkedInAt: Date;
  };
  onLogout: () => void;
}

export function SimpleAdminDashboard({ currentUser, onLogout }: SimpleAdminDashboardProps) {
  const [activeView, setActiveView] = useState("dashboard");

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tasks", label: "Task Management", icon: CheckSquare },
    { id: "employees", label: "Employees", icon: Users },
    { id: "employee-calling", label: "Employee Calling", icon: Users },
    { id: "messaging", label: "Messaging", icon: Activity },
    { id: "temperature", label: "Temperature", icon: Thermometer },
    { id: "cartons", label: "Cigarette Inventory", icon: Package },
    { id: "shortcuts", label: "Shortcuts", icon: Zap },
    { id: "cameras", label: "Cameras", icon: Camera },
    { id: "vision", label: "Vision", icon: Shield },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const renderContent = () => {
    switch (activeView) {
      case "tasks":
        return <TaskManagement />;
      case "employees":
        return <EmployeeManagement />;
      case "employee-calling":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Employee Calling</h2>
            <p className="text-muted-foreground">Employee calling system coming soon. Use the admin kiosk for now.</p>
          </div>
        );
      case "messaging":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Messaging System</h2>
            <p className="text-muted-foreground">Messaging system coming soon. Use voice announcements for now.</p>
          </div>
        );
      case "temperature":
        return <TemperatureMonitoring />;
      case "cartons":
        return <CartonInventory />;
      case "shortcuts":
        return <ShortcutsManagement />;
      case "cameras":
        return <CameraSettings />;
      case "vision":
        return <VisionManagement />;
      case "dashboard":
      default:
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">+2 from yesterday</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4</div>
                  <p className="text-xs text-muted-foreground">Currently checked in</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inventory Alerts</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">Items below threshold</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Camera Status</CardTitle>
                  <Camera className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3/3</div>
                  <p className="text-xs text-muted-foreground">All cameras online</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button
                  onClick={() => setActiveView("tasks")}
                  className="h-20 flex-col gap-2"
                  variant="outline"
                  data-testid="button-quick-tasks"
                >
                  <CheckSquare className="h-6 w-6" />
                  Manage Tasks
                </Button>
                
                <Button
                  onClick={() => setActiveView("employees")}
                  className="h-20 flex-col gap-2"
                  variant="outline"
                  data-testid="button-quick-employees"
                >
                  <Users className="h-6 w-6" />
                  Manage Employees
                </Button>
                
                <Button
                  onClick={() => setActiveView("inventory")}
                  className="h-20 flex-col gap-2"
                  variant="outline"
                  data-testid="button-quick-inventory"
                >
                  <Package className="h-6 w-6" />
                  Check Inventory
                </Button>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Simple sidebar navigation */}
      <div className="w-64 border-r bg-card">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b px-6 py-4">
            <Gear className="h-6 w-6" />
            <span className="font-semibold">Admin Panel</span>
          </div>
          
          <nav className="flex-1 space-y-1 p-4">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant={activeView === item.id ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => setActiveView(item.id)}
                data-testid={`nav-${item.id}`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </nav>

          {/* User info and logout */}
          <div className="border-t p-4">
            <div className="mb-3 text-sm">
              <div className="font-medium">{currentUser.name}</div>
              <div className="text-muted-foreground">{currentUser.role}</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="w-full gap-2"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              Back to Kiosk
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="border-b px-6 py-4">
          <h1 className="text-lg font-semibold">
            {navigationItems.find(item => item.id === activeView)?.label || "Dashboard"}
          </h1>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}