// Authentication utilities and context management

export interface AuthenticatedUser {
  id: string;
  name: string;
  role: "employee" | "shift_lead" | "admin" | "manager";
  pin?: string;
  isManager?: boolean;
}

// Create manager API client with proper authorization
export function createManagerApiClient(managerPin: string) {
  return {
    headers: {
      'Authorization': `Manager ${managerPin}`,
      'Content-Type': 'application/json'
    }
  };
}

// Fetch manager dashboard data with proper authorization
export async function fetchManagerDashboard(managerPin: string) {
  const response = await fetch('/api/manager/dashboard', {
    headers: createManagerApiClient(managerPin).headers
  });

  if (!response.ok) {
    throw new Error('Failed to fetch manager dashboard');
  }

  return response.json();
}

// Fetch all employees (manager only)
export async function fetchAllEmployees(managerPin: string) {
  const response = await fetch('/api/manager/all-employees', {
    headers: createManagerApiClient(managerPin).headers
  });

  if (!response.ok) {
    throw new Error('Failed to fetch all employees');
  }

  return response.json();
}

// Update system settings (manager only)
export async function updateSystemSetting(managerPin: string, key: string, value: string) {
  const response = await fetch('/api/manager/system-settings', {
    method: 'POST',
    headers: createManagerApiClient(managerPin).headers,
    body: JSON.stringify({ key, value })
  });

  if (!response.ok) {
    throw new Error('Failed to update system setting');
  }

  return response.json();
}

// Validate user permissions
export function hasPermission(user: AuthenticatedUser | null, requiredRole: string): boolean {
  if (!user) return false;
  
  const roleHierarchy = {
    employee: 1,
    shift_lead: 2,
    admin: 3,
    manager: 4
  };
  
  const userLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 1;
  
  return userLevel >= requiredLevel;
}

// Check if user is authenticated manager
export function isAuthenticatedManager(user: AuthenticatedUser | null): boolean {
  return user?.role === "manager" && !!user?.pin;
}