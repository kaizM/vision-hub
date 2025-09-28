import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, UserX, UserCheck, Users, Shield, Crown, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Employee {
  id: string;
  name: string;
  pin: string;
  role: string;
  active: boolean;
  createdAt: Date;
}

export function EmployeeManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();

  // Fetch employees
  const { data: employees = [], isLoading: loadingEmployees } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: (employeeData: { name: string; pin: string; role: string }) => 
      apiRequest('POST', '/api/employees', employeeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      setIsCreateDialogOpen(false);
      toast({ title: "Success", description: "Employee created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create employee", 
        variant: "destructive" 
      });
    }
  });

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, ...employeeData }: { id: string } & Partial<Employee>) => 
      apiRequest('PATCH', `/api/employees/${id}`, employeeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
      toast({ title: "Success", description: "Employee updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update employee", 
        variant: "destructive" 
      });
    }
  });

  // Deactivate employee mutation
  const deactivateEmployeeMutation = useMutation({
    mutationFn: (employeeId: string) => 
      apiRequest('PUT', `/api/employees/${employeeId}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({ title: "Success", description: "Employee deactivated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to deactivate employee", 
        variant: "destructive" 
      });
    }
  });

  // Reactivate employee mutation
  const reactivateEmployeeMutation = useMutation({
    mutationFn: (employeeId: string) => 
      apiRequest('PUT', `/api/employees/${employeeId}/reactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({ title: "Success", description: "Employee reactivated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to reactivate employee", 
        variant: "destructive" 
      });
    }
  });

  const EmployeeForm = ({ employee, onSubmit, isSubmitting }: {
    employee?: Employee,
    onSubmit: (data: any) => void,
    isSubmitting: boolean 
  }) => {
    const [formData, setFormData] = useState({
      name: "",
      pin: "",
      role: "employee",
    });

    // Sync form data when employee prop changes
    useEffect(() => {
      if (employee) {
        setFormData({
          name: employee.name || "",
          pin: "", // Don't pre-populate PIN for security
          role: employee.role || "employee",
        });
      } else {
        setFormData({
          name: "",
          pin: "",
          role: "employee",
        });
      }
    }, [employee]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // For edit mode, empty PIN means "keep current PIN"
      if (employee && !formData.pin) {
        // Submit without PIN to keep existing
        const { pin, ...dataWithoutPin } = formData;
        onSubmit(dataWithoutPin);
        return;
      }
      
      // Validate PIN is numeric and 3-8 digits as per punch list
      if (!/^\d{3,8}$/.test(formData.pin)) {
        toast({
          title: "Invalid PIN",
          description: employee 
            ? "PIN must be 3-8 digits long and contain only numbers, or leave blank to keep current PIN"
            : "PIN must be 3-8 digits long and contain only numbers",
          variant: "destructive"
        });
        return;
      }

      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="employee-name">Name</Label>
          <Input
            id="employee-name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter employee name"
            required
            data-testid="input-employee-name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="employee-pin">PIN (3-8 digits)</Label>
          <Input
            id="employee-pin"
            type="text"
            value={formData.pin}
            onChange={(e) => {
              // Only allow numeric input
              const numericValue = e.target.value.replace(/\D/g, '');
              if (numericValue.length <= 8) {
                setFormData(prev => ({ ...prev, pin: numericValue }));
              }
            }}
            placeholder={employee ? "Leave blank to keep current PIN" : "Enter unique numeric PIN"}
            required={!employee}
            maxLength={8}
            data-testid="input-employee-pin"
          />
          <p className="text-sm text-muted-foreground">
            {employee ? "Leave blank to keep current PIN" : "Must be 3-8 digits, numbers only"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="employee-role">Role</Label>
          <Select 
            value={formData.role} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
          >
            <SelectTrigger data-testid="select-employee-role">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="shift_lead">Shift Lead</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            data-testid="button-save-employee"
          >
            {isSubmitting ? (employee ? "Updating..." : "Creating...") : (employee ? "Update Employee" : "Create Employee")}
          </Button>
        </div>
      </form>
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "manager": return <Crown className="h-4 w-4" />;
      case "admin": return <Shield className="h-4 w-4" />;
      case "shift_lead": return <Users className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "manager": return "default";
      case "admin": return "secondary"; 
      case "shift_lead": return "outline";
      default: return "outline";
    }
  };

  if (loadingEmployees) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(employees as Employee[]).length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(employees as Employee[]).filter((emp: Employee) => emp.active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {(employees as Employee[]).filter((emp: Employee) => !emp.active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Employee Management</CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-employee">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Employee</DialogTitle>
                </DialogHeader>
                <EmployeeForm
                  onSubmit={(data) => createEmployeeMutation.mutate(data)}
                  isSubmitting={createEmployeeMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(employees as Employee[]).map((employee: Employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(employee.role)}
                      <span className="font-medium">{employee.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(employee.role)}>
                      {employee.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={employee.active ? "default" : "secondary"}>
                      {employee.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(employee.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setIsEditDialogOpen(true);
                        }}
                        data-testid={`button-edit-employee-${employee.id}`}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      
                      {employee.active ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={deactivateEmployeeMutation.isPending}
                              data-testid={`button-deactivate-employee-${employee.id}`}
                            >
                              <UserX className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deactivate Employee</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to deactivate "{employee.name}"? They will no longer be able to access the system.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deactivateEmployeeMutation.mutate(employee.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Deactivate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reactivateEmployeeMutation.mutate(employee.id)}
                          disabled={reactivateEmployeeMutation.isPending}
                          data-testid={`button-reactivate-employee-${employee.id}`}
                        >
                          <UserCheck className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {(employees as Employee[]).length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No employees found</p>
              <p className="text-muted-foreground mb-4">Get started by adding your first employee</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-first-employee">
                <Plus className="h-4 w-4 mr-2" />
                Add First Employee
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <EmployeeForm
            employee={selectedEmployee || undefined}
            onSubmit={(data) => updateEmployeeMutation.mutate({ id: selectedEmployee?.id || "", ...data })}
            isSubmitting={updateEmployeeMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}