import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, AlertTriangle, Info, CheckCircle, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "error" | "warning" | "info" | "success";
  title: string;
  message: string;
  timestamp: Date;
  priority: "low" | "medium" | "high";
  dismissible?: boolean;
}

interface AlertBannerProps {
  alerts: Alert[];
  onDismiss?: (id: string) => void;
  maxVisible?: number;
}

export function AlertBanner({ alerts, onDismiss, maxVisible = 3 }: AlertBannerProps) {
  const [visibleAlerts, setVisibleAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Sort by priority and timestamp, show most recent high priority first
    const sortedAlerts = [...alerts]
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.timestamp.getTime() - a.timestamp.getTime();
      })
      .slice(0, maxVisible);
      
    setVisibleAlerts(sortedAlerts);
  }, [alerts, maxVisible]);

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getAlertColors = (type: Alert["type"]) => {
    switch (type) {
      case "error":
        return "border-destructive/50 bg-destructive/10 text-destructive";
      case "warning":
        return "border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200";
      case "success":
        return "border-green-500/50 bg-green-50/50 dark:bg-green-950/20 text-green-800 dark:text-green-200";
      default:
        return "border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-200";
    }
  };

  const getPriorityBadge = (priority: Alert["priority"]) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive" className="text-xs">High</Badge>;
      case "medium":
        return <Badge variant="default" className="text-xs">Medium</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Low</Badge>;
    }
  };

  const handleDismiss = (id: string) => {
    console.log(`Dismissing alert: ${id}`);
    onDismiss?.(id);
  };

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {visibleAlerts.map((alert) => (
        <Card
          key={alert.id}
          className={cn(
            "hover-elevate transition-all duration-200",
            getAlertColors(alert.type)
          )}
        >
          <CardContent className="p-3">
            <div className="flex items-start justify-between space-x-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium">{alert.title}</h4>
                    {getPriorityBadge(alert.priority)}
                  </div>
                  <p className="text-sm opacity-90">{alert.message}</p>
                  <div className="flex items-center space-x-2 mt-1 text-xs opacity-75">
                    <Bell className="h-3 w-3" />
                    <span>{alert.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
              {alert.dismissible !== false && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-70 hover:opacity-100"
                  onClick={() => handleDismiss(alert.id)}
                  data-testid={`button-dismiss-${alert.id}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      
      {alerts.length > maxVisible && (
        <div className="text-center">
          <Badge variant="outline" className="text-xs">
            +{alerts.length - maxVisible} more alerts
          </Badge>
        </div>
      )}
    </div>
  );
}