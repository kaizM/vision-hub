import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserCircle, Phone, Clock, CheckCircle2, Settings, Crown, Shield } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  role: string;
  status: "available" | "busy" | "on_task";
  lastActive: Date;
}

interface Task {
  id: string;
  title: string;
  category: string;
  priority: "low" | "medium" | "high";
}

interface AdminCallInterfaceProps {
  onCallEmployee: (employeeId: string, employeeName: string, taskId?: string, taskTitle?: string) => void;
  onCloseAdmin: () => void;
}

export function AdminCallInterface({ onCallEmployee, onCloseAdmin }: AdminCallInterfaceProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [isCalling, setIsCalling] = useState(false);

  // Mock data - todo: replace with real API data
  const employees: Employee[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      role: "shift_lead",
      status: "available",
      lastActive: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
    },
    {
      id: "2", 
      name: "Mike Chen",
      role: "employee",
      status: "available",
      lastActive: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
    },
    {
      id: "3",
      name: "Alex Rivera",
      role: "employee", 
      status: "on_task",
      lastActive: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
    },
    {
      id: "4",
      name: "Jordan Kim",
      role: "employee",
      status: "available",
      lastActive: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    }
  ];

  const availableTasks: Task[] = [
    {
      id: "1",
      title: "Check cigarette inventory",
      category: "inventory",
      priority: "high"
    },
    {
      id: "2",
      title: "Clean restrooms",
      category: "cleaning",
      priority: "medium"
    },
    {
      id: "3",
      title: "Restock coffee station",
      category: "customer_service",
      priority: "low"
    },
    {
      id: "4",
      title: "Check cooler temperatures",
      category: "maintenance",
      priority: "medium"
    },
    {
      id: "5",
      title: "Update price signs",
      category: "daily",
      priority: "low"
    }
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-3 w-3" />;
      case "shift_lead":
        return <Shield className="h-3 w-3" />;
      default:
        return <UserCircle className="h-3 w-3" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "shift_lead": 
        return "default";
      default:
        return "secondary";
    }
  };

  const getStatusBadge = (status: Employee["status"]) => {
    switch (status) {
      case "available":
        return <Badge variant="secondary" className="text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-300">Available</Badge>;
      case "busy":
        return <Badge variant="default">Busy</Badge>;
      case "on_task":
        return <Badge variant="outline">On Task</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive" className="text-xs">High</Badge>;
      case "medium":
        return <Badge variant="default" className="text-xs">Medium</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Low</Badge>;
    }
  };

  const formatLastActive = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const handleCallEmployee = async () => {
    if (!selectedEmployee) return;
    
    const employee = employees.find(e => e.id === selectedEmployee);
    const task = availableTasks.find(t => t.id === selectedTask);
    
    if (!employee) return;
    
    setIsCalling(true);
    console.log(`Calling ${employee.name} for task: ${task?.title || "general task"}`);
    
    // Simulate API call delay
    setTimeout(() => {
      onCallEmployee(
        employee.id,
        employee.name,
        task?.id,
        task?.title || "Report to manager"
      );
      setIsCalling(false);
      setSelectedEmployee("");
      setSelectedTask("");
    }, 500);
  };

  const handleQuickCall = (employee: Employee) => {
    setSelectedEmployee(employee.id);
    // Immediately call without task assignment
    console.log(`Quick calling ${employee.name}`);
    onCallEmployee(employee.id, employee.name, undefined, "Report to manager");
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-background shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Phone className="h-6 w-6" />
            <span>Call Employee</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={onCloseAdmin}
              data-testid="button-close-admin"
            >
              Close
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Call Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assign Task to Employee</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Employee</label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger data-testid="select-employee">
                      <SelectValue placeholder="Choose an employee..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.filter(e => e.status === "available").map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          <div className="flex items-center space-x-2">
                            <span>{employee.name}</span>
                            <Badge variant={getRoleBadgeVariant(employee.role) as any} className="text-xs">
                              {employee.role.replace('_', ' ')}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Select Task (Optional)</label>
                  <Select value={selectedTask} onValueChange={setSelectedTask}>
                    <SelectTrigger data-testid="select-task">
                      <SelectValue placeholder="Choose a task..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          <div className="flex items-center space-x-2">
                            <span>{task.title}</span>
                            {getPriorityBadge(task.priority)}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleCallEmployee}
                disabled={!selectedEmployee || isCalling}
                className="w-full"
                size="lg"
                data-testid="button-call-employee"
              >
                <Phone className="h-4 w-4 mr-2" />
                {isCalling ? "Calling..." : "Call Employee"}
              </Button>
            </CardContent>
          </Card>

          {/* Employee Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <UserCircle className="h-5 w-5" />
                <span>Employee Status</span>
                <Badge variant="outline">{employees.length} total</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {getInitials(employee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{employee.name}</span>
                          <Badge variant={getRoleBadgeVariant(employee.role) as any} className="text-xs">
                            <div className="flex items-center space-x-1">
                              {getRoleIcon(employee.role)}
                              <span>{employee.role.replace('_', ' ')}</span>
                            </div>
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusBadge(employee.status)}
                          <span className="text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatLastActive(employee.lastActive)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {employee.status === "available" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickCall(employee)}
                          data-testid={`button-quick-call-${employee.id}`}
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Quick Call
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Available Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Available Tasks</span>
                <Badge variant="outline">{availableTasks.length} tasks</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{task.title}</span>
                        {getPriorityBadge(task.priority)}
                      </div>
                      <span className="text-sm text-muted-foreground capitalize">
                        {task.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}