import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Clock, LogOut, Crown, Shield } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  role: string;
  checkedInAt: Date;
}

interface EmployeeStatusProps {
  currentUser: Employee;
  activeEmployees: Employee[];
  onCheckOut?: (employeeId: string) => void;
  onViewAll?: () => void;
}

export function EmployeeStatus({ 
  currentUser, 
  activeEmployees, 
  onCheckOut,
  onViewAll 
}: EmployeeStatusProps) {
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
        return null;
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

  const formatCheckInTime = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    const minutes = Math.floor(((Date.now() - date.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    }
    return `${minutes}m ago`;
  };

  const handleCheckOut = () => {
    console.log(`${currentUser.name} checking out`);
    onCheckOut?.(currentUser.id);
  };

  const handleViewAll = () => {
    console.log("Opening employee management");
    onViewAll?.();
  };

  return (
    <Card className="hover-elevate">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Active Staff</span>
        </CardTitle>
        <Badge variant="outline" className="flex items-center space-x-1">
          <span>{activeEmployees.length}</span>
          <span>on duty</span>
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current User */}
        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{currentUser.name}</span>
                  <Badge variant={getRoleBadgeVariant(currentUser.role) as any} className="text-xs">
                    <div className="flex items-center space-x-1">
                      {getRoleIcon(currentUser.role)}
                      <span>{currentUser.role.replace('_', ' ')}</span>
                    </div>
                  </Badge>
                </div>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Checked in {formatCheckInTime(currentUser.checkedInAt)}</span>
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCheckOut}
              data-testid="button-checkout"
            >
              <LogOut className="h-3 w-3 mr-1" />
              Check Out
            </Button>
          </div>
        </div>

        {/* Other Active Employees */}
        <div className="space-y-2">
          {activeEmployees
            .filter(emp => emp.id !== currentUser.id)
            .slice(0, 3)
            .map((employee) => (
              <div key={employee.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(employee.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{employee.name}</span>
                    <Badge variant={getRoleBadgeVariant(employee.role) as any} className="text-xs">
                      <div className="flex items-center space-x-1">
                        {getRoleIcon(employee.role)}
                        <span>{employee.role.replace('_', ' ')}</span>
                      </div>
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatCheckInTime(employee.checkedInAt)}
                  </div>
                </div>
              </div>
            ))}
          
          {activeEmployees.length > 4 && (
            <div className="text-center pt-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleViewAll}
                data-testid="button-view-all-employees"
              >
                View all {activeEmployees.length} employees
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}