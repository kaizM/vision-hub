import { useState } from "react";
import { PinLogin } from "./PinLogin";
import { Dashboard } from "./Dashboard";
import { SidebarProvider } from "@/components/ui/sidebar";

export function StoreHubApp() {
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    role: string;
    checkedInAt: Date;
  } | null>(null);

  const handleLogin = (pin: string, employeeName: string, role: string) => {
    console.log(`User logged in: ${employeeName} (${role})`);
    
    // Create user session - todo: remove mock functionality
    const user = {
      id: pin, // Using PIN as ID for demo
      name: employeeName,
      role: role,
      checkedInAt: new Date()
    };
    
    setCurrentUser(user);
  };

  const handleLogout = () => {
    console.log("User logged out");
    setCurrentUser(null);
  };

  // Custom sidebar width for StoreHub
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (!currentUser) {
    return <PinLogin onLogin={handleLogin} />;
  }

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <Dashboard 
        currentUser={currentUser} 
        onLogout={handleLogout} 
      />
    </SidebarProvider>
  );
}