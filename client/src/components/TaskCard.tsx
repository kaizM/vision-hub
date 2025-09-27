import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertTriangle, User, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  id: string;
  title: string;
  category: string;
  dueAt: Date;
  assignedTo?: string;
  status: "pending" | "done" | "missed";
  isOverdue?: boolean;
  onComplete?: (id: string, notes?: string) => void;
  onReassign?: (id: string) => void;
}

export function TaskCard({
  id,
  title,
  category,
  dueAt,
  assignedTo,
  status,
  isOverdue = false,
  onComplete,
  onReassign
}: TaskCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    console.log(`Completing task: ${title}`);
    
    // Simulate API call
    setTimeout(() => {
      onComplete?.(id);
      setIsCompleting(false);
    }, 500);
  };

  const getStatusIcon = () => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "missed":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    if (status === "done") return <Badge variant="secondary" className="text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-300">Complete</Badge>;
    if (status === "missed") return <Badge variant="destructive">Missed</Badge>;
    if (isOverdue) return <Badge variant="destructive">Overdue</Badge>;
    return <Badge variant="outline">Pending</Badge>;
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "inventory": return "text-blue-600 dark:text-blue-400";
      case "cleaning": return "text-green-600 dark:text-green-400";
      case "customer_service": return "text-purple-600 dark:text-purple-400";
      case "maintenance": return "text-orange-600 dark:text-orange-400";
      default: return "text-muted-foreground";
    }
  };

  const timeUntilDue = Math.round((dueAt.getTime() - Date.now()) / 60000); // minutes

  return (
    <Card className={cn(
      "hover-elevate transition-all duration-200",
      isOverdue && status === "pending" && "border-destructive/50 bg-destructive/5",
      status === "done" && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <Badge variant="outline" className={getCategoryColor(category)}>
            {category.replace('_', ' ')}
          </Badge>
        </div>
        {getStatusBadge()}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>
                {status === "pending" ? (
                  timeUntilDue > 0 ? `Due in ${timeUntilDue}m` : `Overdue by ${Math.abs(timeUntilDue)}m`
                ) : (
                  dueAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                )}
              </span>
            </div>
            {assignedTo && (
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>{assignedTo}</span>
              </div>
            )}
          </div>
        </div>

        {status === "pending" && (
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={handleComplete}
              disabled={isCompleting}
              className="flex-1"
              data-testid={`button-complete-${id}`}
            >
              {isCompleting ? "Completing..." : "Mark Complete"}
            </Button>
            {onReassign && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReassign(id)}
                data-testid={`button-reassign-${id}`}
              >
                Reassign
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}