import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Crown, UserCircle, AlertTriangle } from "lucide-react";

interface RoleGuardProps {
  children: ReactNode;
  requiredRole?: "employee" | "shift_lead" | "admin" | "manager";
  currentUser?: {
    id: string;
    name: string;
    role: string;
    pin?: string;
  } | null;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}

export function RoleGuard({ 
  children, 
  requiredRole = "employee", 
  currentUser = null,
  fallback = null,
  showAccessDenied = true
}: RoleGuardProps) {
  
  // Define role hierarchy levels
  const roleHierarchy = {
    employee: 1,
    shift_lead: 2,
    admin: 3,
    manager: 4
  };

  // Check if user has sufficient role access
  const hasAccess = () => {
    if (!currentUser) return false;
    
    // Server-verified manager role gets highest access
    if (currentUser.role === "manager") return true;
    
    // Check role hierarchy based on server-verified role
    const userRoleLevel = roleHierarchy[currentUser.role as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole];
    
    return userRoleLevel >= requiredRoleLevel;
  };

  // If user has access, render children
  if (hasAccess()) {
    return <>{children}</>;
  }

  // If fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show access denied message if configured
  if (showAccessDenied) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            <CardTitle className="text-lg">Access Denied</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              You need {getRoleDisplayName(requiredRole)} privileges to access this feature.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Your Role:</p>
                <Badge variant="outline" className="flex items-center space-x-1">
                  {getRoleIcon(currentUser?.role || "employee")}
                  <span>{getRoleDisplayName(currentUser?.role || "employee")}</span>
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Required:</p>
                <Badge variant="destructive" className="flex items-center space-x-1">
                  {getRoleIcon(requiredRole)}
                  <span>{getRoleDisplayName(requiredRole)}</span>
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Return nothing if no access and no fallback
  return null;
}

function getRoleIcon(role: string) {
  switch (role) {
    case "manager":
      return <Crown className="h-3 w-3 text-amber-500" />;
    case "admin":
      return <Crown className="h-3 w-3 text-red-500" />;
    case "shift_lead":
      return <Shield className="h-3 w-3 text-blue-500" />;
    default:
      return <UserCircle className="h-3 w-3 text-gray-500" />;
  }
}

function getRoleDisplayName(role: string) {
  switch (role) {
    case "manager":
      return "Manager";
    case "admin":
      return "Administrator";
    case "shift_lead":
      return "Shift Lead";
    default:
      return "Employee";
  }
}

// Hook for checking role access in components
export function useRoleAccess(requiredRole: string = "employee", currentUser: any = null) {
  const roleHierarchy = {
    employee: 1,
    shift_lead: 2,
    admin: 3,
    manager: 4
  };

  const hasAccess = () => {
    if (!currentUser) return false;
    
    // Server-verified manager role gets highest access
    if (currentUser.role === "manager") return true;
    
    // Check role hierarchy based on server-verified role
    const userRoleLevel = roleHierarchy[currentUser.role as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 1;
    
    return userRoleLevel >= requiredRoleLevel;
  };

  return {
    hasAccess: hasAccess(),
    userRole: currentUser?.role || "employee",
    requiredRole,
    isManager: currentUser?.role === "manager"
  };
}