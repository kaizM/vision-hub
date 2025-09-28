import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, Plus, Edit, Trash2, RotateCcw, Clock, AlertTriangle, CheckCircle2, Users, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
// Types based on actual schema
interface Task {
  id: string;
  title: string;
  frequency: number;
  category: string | null;
  active: boolean;
}

interface TaskAssignment {
  id: string;
  taskId: string;
  assignedAt: Date | null;
  dueAt: Date;
  assignedTo: string | null;
  status: string;
  completedAt: Date | null;
  notes: string | null;
}

interface SpecialTask {
  id: string;
  title: string;
  assignedTo: string | null;
  status: string;
  createdAt: Date | null;
  dueAt: Date | null;
}

export function TaskManagement() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [selectedSpecialTask, setSelectedSpecialTask] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateSpecialOpen, setIsCreateSpecialOpen] = useState(false);
  const [isEditSpecialOpen, setIsEditSpecialOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("rotating");
  const { toast } = useToast();

  // Fetch rotating tasks
  const { data: rotatingTasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['/api/tasks'],
    refetchInterval: 30000
  });

  // Fetch task assignments
  const { data: taskAssignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['/api/task-assignments'],
    refetchInterval: 15000
  });

  // Fetch special tasks
  const { data: specialTasks = [], isLoading: loadingSpecial } = useQuery({
    queryKey: ['/api/tasks/special'],
    refetchInterval: 30000
  });

  // Fetch employees for assignment
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees']
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (taskData: any) => apiRequest('POST', '/api/tasks', taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setIsCreateDialogOpen(false);
      toast({ title: "Success", description: "Task created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create task", variant: "destructive" });
    }
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, ...taskData }: any) => apiRequest('PUT', `/api/tasks/${id}`, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setIsEditDialogOpen(false);
      setSelectedTask(null);
      toast({ title: "Success", description: "Task updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => apiRequest('DELETE', `/api/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: "Success", description: "Task deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
    }
  });

  // Complete assignment mutation
  const completeAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) => apiRequest('PUT', `/api/task-assignments/${assignmentId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/task-assignments'] });
      toast({ title: "Success", description: "Assignment completed successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to complete assignment", variant: "destructive" });
    }
  });

  // Create special task mutation
  const createSpecialTaskMutation = useMutation({
    mutationFn: (taskData: any) => apiRequest('POST', '/api/tasks/special', taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/special'] });
      setIsCreateSpecialOpen(false);
      toast({ title: "Success", description: "Special task created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create special task", variant: "destructive" });
    }
  });

  // Reassign task mutation
  const reassignTaskMutation = useMutation({
    mutationFn: ({ assignmentId, employeeId }: { assignmentId: string, employeeId: string }) => 
      apiRequest('PUT', `/api/task-assignments/${assignmentId}/reassign`, { employeeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/task-assignments'] });
      setIsAssignmentDialogOpen(false);
      setSelectedAssignment(null);
      toast({ title: "Success", description: "Assignment reassigned successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reassign assignment", variant: "destructive" });
    }
  });

  // Complete special task mutation
  const completeSpecialTaskMutation = useMutation({
    mutationFn: (taskId: string) => apiRequest('PUT', `/api/tasks/special/${taskId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/special'] });
      toast({ title: "Success", description: "Special task completed successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to complete special task", variant: "destructive" });
    }
  });

  // Delete special task mutation
  const deleteSpecialTaskMutation = useMutation({
    mutationFn: (taskId: string) => apiRequest('DELETE', `/api/tasks/special/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/special'] });
      toast({ title: "Success", description: "Special task deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete special task", variant: "destructive" });
    }
  });

  // Update special task mutation
  const updateSpecialTaskMutation = useMutation({
    mutationFn: ({ id, ...taskData }: any) => apiRequest('PUT', `/api/tasks/special/${id}`, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/special'] });
      setIsEditSpecialOpen(false);
      setSelectedSpecialTask(null);
      toast({ title: "Success", description: "Special task updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update special task", variant: "destructive" });
    }
  });

  const SpecialTaskForm = ({ task, onSubmit, isSubmitting }: {
    task?: any,
    onSubmit: (data: any) => void,
    isSubmitting: boolean 
  }) => {
    const [formData, setFormData] = useState({
      title: "",
      assignedTo: "",
      dueAt: "",
    });

    // Sync form data when task prop changes
    useEffect(() => {
      if (task) {
        setFormData({
          title: task.title || "",
          assignedTo: task.assignedTo || "",
          dueAt: task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : "",
        });
      } else {
        // Reset form for create mode
        setFormData({
          title: "",
          assignedTo: "",
          dueAt: "",
        });
      }
    }, [task]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit({
        ...formData,
        dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : null
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="special-title">Task Title</Label>
          <Input
            id="special-title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter special task title..."
            required
            data-testid="input-special-task-title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="special-assigned">Assign To</Label>
          <Select 
            value={formData.assignedTo} 
            onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
          >
            <SelectTrigger data-testid="select-special-assignee">
              <SelectValue placeholder="Select employee..." />
            </SelectTrigger>
            <SelectContent>
              {(employees as any[]).map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="special-due">Due Date & Time</Label>
          <Input
            id="special-due"
            type="datetime-local"
            value={formData.dueAt}
            onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
            data-testid="input-special-due"
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            data-testid="button-save-special-task"
          >
{isSubmitting ? (task ? "Updating..." : "Creating...") : (task ? "Update Special Task" : "Create Special Task")}
          </Button>
        </div>
      </form>
    );
  };

  const TaskForm = ({ task, onSubmit, isSubmitting }: { 
    task?: Task | null, 
    onSubmit: (data: any) => void,
    isSubmitting: boolean 
  }) => {
    const [formData, setFormData] = useState({
      title: task?.title || "",
      category: task?.category || "general",
      frequency: task?.frequency || 30,
      active: task?.active ?? true
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Task Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter task title..."
            required
            data-testid="input-task-title"
          />
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger data-testid="select-task-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="customer_service">Customer Service</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="daily">Daily Tasks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency (minutes)</Label>
            <Input
              id="frequency"
              type="number"
              min="5"
              max="480"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: parseInt(e.target.value) })}
              data-testid="input-task-frequency"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="active"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            className="h-4 w-4"
            data-testid="checkbox-task-active"
          />
          <Label htmlFor="active">Task is active</Label>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            data-testid="button-save-task"
          >
            {isSubmitting ? "Saving..." : task ? "Update Task" : "Create Task"}
          </Button>
        </div>
      </form>
    );
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="text-blue-600"><RotateCcw className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="text-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Complete</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      cleaning: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
      inventory: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
      customer_service: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
      maintenance: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
      security: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
      daily: "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300"
    };
    
    return (
      <Badge 
        variant="secondary" 
        className={colors[category] || ""}
      >
        {category.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Task Management</h1>
          <p className="text-muted-foreground">
            Manage rotating tasks, assignments, and schedules
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-task">
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <TaskForm 
              onSubmit={(data) => createTaskMutation.mutate(data)}
              isSubmitting={createTaskMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(rotatingTasks as Task[]).filter(t => t.active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(taskAssignments as any[]).filter(a => a.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {(taskAssignments as any[]).filter(a => a.status === 'overdue').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(taskAssignments as any[]).length > 0 
                ? Math.round(((taskAssignments as any[]).filter(a => a.status === 'completed').length / (taskAssignments as any[]).length) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rotating" data-testid="tab-rotating-tasks">
            <RotateCcw className="h-4 w-4 mr-2" />
            Rotating Tasks
          </TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            <Users className="h-4 w-4 mr-2" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="special" data-testid="tab-special-tasks">
            <Calendar className="h-4 w-4 mr-2" />
            Special Tasks
          </TabsTrigger>
        </TabsList>

        {/* Rotating Tasks Tab */}
        <TabsContent value="rotating" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rotating Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTasks ? (
                <div className="text-center py-8">Loading tasks...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(rotatingTasks as Task[]).map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{task.title}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getCategoryBadge(task.category || "general")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {task.frequency}m
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={task.active ? "default" : "secondary"}>
                            {task.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTask(task);
                                setIsEditDialogOpen(true);
                              }}
                              data-testid={`button-edit-task-${task.id}`}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={deleteTaskMutation.isPending}
                                  data-testid={`button-delete-task-${task.id}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{task.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteTaskMutation.mutate(task.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAssignments ? (
                <div className="text-center py-8">Loading assignments...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Due At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(taskAssignments as any[]).map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div className="font-medium">Task #{assignment.id.slice(0, 8)}</div>
                        </TableCell>
                        <TableCell>
                          {assignment.assignedTo || 'Unassigned'}
                        </TableCell>
                        <TableCell>
                          {formatTime(assignment.dueAt)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(assignment.status)}
                        </TableCell>
                        <TableCell>
                          {assignment.assignedAt ? formatTime(assignment.assignedAt) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {assignment.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => completeAssignmentMutation.mutate(assignment.id)}
                                disabled={completeAssignmentMutation.isPending}
                                data-testid={`button-complete-assignment-${assignment.id}`}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Complete
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                setIsAssignmentDialogOpen(true);
                              }}
                              data-testid={`button-reassign-${assignment.id}`}
                            >
                              <Users className="h-3 w-3 mr-1" />
                              Reassign
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Special Tasks Tab */}
        <TabsContent value="special" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Dialog open={isCreateSpecialOpen} onOpenChange={setIsCreateSpecialOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-special-task">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Special Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Special Task</DialogTitle>
                </DialogHeader>
                <SpecialTaskForm 
                  onSubmit={(data) => createSpecialTaskMutation.mutate(data)}
                  isSubmitting={createSpecialTaskMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Special Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSpecial ? (
                <div className="text-center py-8">Loading special tasks...</div>
              ) : (specialTasks as any[]).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No special tasks found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Due At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(specialTasks as any[]).map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div className="font-medium">{task.title}</div>
                        </TableCell>
                        <TableCell>
                          {task.assignedTo || 'Unassigned'}
                        </TableCell>
                        <TableCell>
                          {task.dueAt ? formatTime(task.dueAt) : 'No due date'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(task.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedSpecialTask(task);
                                setIsEditSpecialOpen(true);
                              }}
                              data-testid={`button-edit-special-${task.id}`}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            {task.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => completeSpecialTaskMutation.mutate(task.id)}
                                disabled={completeSpecialTaskMutation.isPending}
                                data-testid={`button-complete-special-${task.id}`}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Complete
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={deleteSpecialTaskMutation.isPending}
                                  data-testid={`button-delete-special-${task.id}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Special Task</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{task.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteSpecialTaskMutation.mutate(task.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <TaskForm 
            task={selectedTask}
            onSubmit={(data) => updateTaskMutation.mutate({ id: selectedTask?.id, ...data })}
            isSubmitting={updateTaskMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Special Task Dialog */}
      <Dialog open={isEditSpecialOpen} onOpenChange={setIsEditSpecialOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Special Task</DialogTitle>
          </DialogHeader>
          <SpecialTaskForm 
            task={selectedSpecialTask}
            onSubmit={(data) => updateSpecialTaskMutation.mutate({ id: selectedSpecialTask?.id, ...data })}
            isSubmitting={updateSpecialTaskMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Reassignment Dialog */}
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reassign-employee">Assign To</Label>
              <Select 
                onValueChange={(employeeId) => {
                  if (selectedAssignment?.id) {
                    reassignTaskMutation.mutate({ 
                      assignmentId: selectedAssignment.id, 
                      employeeId 
                    });
                  }
                }}
              >
                <SelectTrigger data-testid="select-reassign-employee">
                  <SelectValue placeholder="Select employee..." />
                </SelectTrigger>
                <SelectContent>
                  {(employees as any[]).map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {reassignTaskMutation.isPending && (
              <div className="text-sm text-muted-foreground">Reassigning task...</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}