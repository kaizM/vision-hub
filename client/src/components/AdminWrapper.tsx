import { SimpleAdminDashboard } from "./SimpleAdminDashboard";

// Mock user for admin access via gear icon (no PIN required as per punch list)
const mockAdminUser = {
  id: "admin-gear-access",
  name: "Store Manager", 
  role: "Manager",
  checkedInAt: new Date()
};

export function AdminWrapper() {
  const handleLogout = () => {
    // For gear icon admin access, just navigate back to main view
    window.location.href = "/";
  };

  return (
    <SimpleAdminDashboard 
      currentUser={mockAdminUser}
      onLogout={handleLogout}
    />
  );
}