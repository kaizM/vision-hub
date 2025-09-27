import { useState } from 'react';
import { AlertBanner } from '../AlertBanner';

export default function AlertBannerExample() {
  const [alerts, setAlerts] = useState([
    {
      id: "1",
      type: "error" as const,
      title: "Camera Offline",
      message: "Parking lot camera has lost connection. Check network cable.",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      priority: "high" as const,
      dismissible: true
    },
    {
      id: "2", 
      type: "warning" as const,
      title: "Low Inventory",
      message: "Newport Menthol cigarettes are below minimum threshold (3 remaining).",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      priority: "medium" as const,
      dismissible: true
    },
    {
      id: "3",
      type: "info" as const,
      title: "Employee Check-in",
      message: "Sarah Johnson checked in at 8:30 AM.",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      priority: "low" as const,
      dismissible: true
    },
    {
      id: "4",
      type: "warning" as const,
      title: "Task Overdue",
      message: "Restroom cleaning task is 15 minutes overdue.",
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      priority: "high" as const,
      dismissible: true
    },
    {
      id: "5",
      type: "success" as const,
      title: "Task Completed",
      message: "Coffee station restocked by Mike Chen.",
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      priority: "low" as const,
      dismissible: true
    }
  ]);

  const handleDismiss = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  return (
    <div className="p-6 max-w-2xl">
      <AlertBanner 
        alerts={alerts}
        onDismiss={handleDismiss}
        maxVisible={3}
      />
    </div>
  );
}