import { useState } from "react";
import { KioskLayout } from "./KioskLayout";
import { PersonalTasksPopup } from "./PersonalTasksPopup";
import { AdminCallInterface } from "./AdminCallInterface";

interface EmployeeCall {
  id: string;
  employeeId: string;
  employeeName: string;
  taskTitle: string;
  timestamp: Date;
}

export function StoreHubKiosk() {
  const [showPersonalTasks, setShowPersonalTasks] = useState(false);
  const [showAdminInterface, setShowAdminInterface] = useState(false);
  const [activeCall, setActiveCall] = useState<EmployeeCall | null>(null);
  const [isAdminMode] = useState(false); // Remove demo mode - real authentication required

  const handleOpenPersonalTasks = (requirePin = false) => {
    console.log("Opening personal tasks popup", { requirePin });
    setShowPersonalTasks(true);
  };

  const handleClosePersonalTasks = () => {
    console.log("Closing personal tasks popup");
    setShowPersonalTasks(false);
  };

  const handleOpenAdminInterface = () => {
    console.log("Opening admin interface");
    setShowAdminInterface(true);
  };

  const handleCloseAdminInterface = () => {
    console.log("Closing admin interface");
    setShowAdminInterface(false);
  };

  const handleCallEmployee = (
    employeeId: string,
    employeeName: string,
    taskId?: string,
    taskTitle?: string
  ) => {
    console.log(`Initiating call for ${employeeName}:`, { employeeId, taskId, taskTitle });
    
    const newCall: EmployeeCall = {
      id: Date.now().toString(),
      employeeId,
      employeeName,
      taskTitle: taskTitle || "Report to manager",
      timestamp: new Date()
    };

    setActiveCall(newCall);
    setShowAdminInterface(false);

    // In a real app, this would trigger:
    // 1. Kiosk overlay display
    // 2. Audio chime and TTS
    // 3. Event logging
    // 4. Real-time notifications
  };

  return (
    <div className="relative">
      {/* Main Kiosk Interface */}
      <KioskLayout
        onOpenPersonalTasks={handleOpenPersonalTasks}
        onAdminAccess={handleOpenAdminInterface}
        isAdminMode={isAdminMode}
      />

      {/* Personal Tasks Popup (Full Screen Overlay) */}
      {showPersonalTasks && (
        <PersonalTasksPopup
          onClose={handleClosePersonalTasks}
          autoCloseMinutes={2} // Default 2-minute auto-close
        />
      )}

      {/* Admin Call Interface */}
      {showAdminInterface && (
        <AdminCallInterface
          onCallEmployee={handleCallEmployee}
          onCloseAdmin={handleCloseAdminInterface}
        />
      )}

      {/* Active Call State (for debugging) */}
      {activeCall && (
        <div className="fixed bottom-4 left-4 z-40 bg-primary text-primary-foreground p-3 rounded-lg shadow-lg">
          <div className="text-sm">
            Active Call: {activeCall.employeeName} - {activeCall.taskTitle}
          </div>
        </div>
      )}
    </div>
  );
}