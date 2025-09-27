import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TaskCard } from "./TaskCard";
import { PinLogin } from "./PinLogin";
import { User, Clock, LogOut, AlertCircle, CheckCircle2, Timer } from "lucide-react";

interface PersonalTask {
  id: string;
  title: string;
  category: string;
  dueAt: Date;
  status: "pending" | "done" | "missed";
  priority: "low" | "medium" | "high";
  isOverdue?: boolean;
}

interface PersonalTasksPopupProps {
  onClose: () => void;
  autoCloseMinutes?: number;
}

export function PersonalTasksPopup({ onClose, autoCloseMinutes = 2 }: PersonalTasksPopupProps) {
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string; 
    role: string;
  } | null>(null);
  
  const [timeRemaining, setTimeRemaining] = useState(autoCloseMinutes * 60); // in seconds
  const [showWarning, setShowWarning] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const lastActivityRef = useRef<number>(Date.now());

  // Fetch real personal tasks for the authenticated user
  const { data: personalTaskAssignments = [] } = useQuery({
    queryKey: ['personal-tasks', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const response = await fetch(`/api/employees/${currentUser.id}/tasks`);
      if (!response.ok) throw new Error('Failed to fetch personal tasks');
      return response.json();
    },
    enabled: !!currentUser?.id,
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Process task assignments into PersonalTask format
  const personalTasks: PersonalTask[] = personalTaskAssignments.length > 0 
    ? personalTaskAssignments.map((assignment: any) => ({
        id: assignment.id,
        title: assignment.taskTitle || 'Unknown Task',
        category: assignment.category || 'general',
        dueAt: new Date(assignment.dueAt),
        status: assignment.status,
        priority: assignment.priority || 'medium',
        isOverdue: assignment.status === 'pending' && new Date(assignment.dueAt) < new Date()
      }))
    : []; // No fallback - show empty state if no real tasks

  // Show empty state message for no tasks (removed mock fallback)
  const noTasksMessage = "No tasks assigned to you at this time.";

  // Old mock fallback (REMOVED - keeping for reference but not used)
  const _removedMockTasks: PersonalTask[] = [
    {
      id: "1",
      title: "Check cigarette inventory",
      category: "inventory",
      dueAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
      status: "pending",
      priority: "high",
      isOverdue: false
    },
    {
      id: "2",
      title: "Clean restrooms", 
      category: "cleaning",
      dueAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      status: "pending",
      priority: "medium",
      isOverdue: true
    },
    {
      id: "3",
      title: "Restock coffee station",
      category: "customer_service",
      dueAt: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
      status: "pending", 
      priority: "low",
      isOverdue: false
    }
  ];

  // Reset activity timer on any interaction
  const resetActivityTimer = () => {
    lastActivityRef.current = Date.now();
    setTimeRemaining(autoCloseMinutes * 60);
    setShowWarning(false);
    setIsActive(true);
  };

  // Auto-close timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, autoCloseMinutes * 60 - elapsed);
      
      setTimeRemaining(remaining);
      
      // Show warning in last 10 seconds
      if (remaining <= 10 && remaining > 0) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
      
      // Auto-close when time expires
      if (remaining === 0) {
        console.log("Personal task tab auto-closing due to inactivity");
        handleAutoClose();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [autoCloseMinutes]);

  // Activity listeners to reset timer
  useEffect(() => {
    const handleActivity = () => {
      if (isActive) {
        resetActivityTimer();
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [isActive]);

  const [pinError, setPinError] = useState<string>("");

  const handleLogin = (employee: { id: string; name: string; role: string; pin: string }) => {
    console.log(`Personal tasks opened for: ${employee.name}`);
    
    setCurrentUser({
      id: employee.id,
      name: employee.name,
      role: employee.role
    });
    resetActivityTimer();
  };

  const handleAutoClose = () => {
    setIsActive(false);
    console.log("Personal task session closed - redirecting to kiosk");
    onClose();
  };

  const handleManualClose = () => {
    console.log("Personal task session manually closed");
    setIsActive(false);
    onClose();
  };

  const handleTaskComplete = (taskId: string, notes?: string) => {
    console.log(`Task ${taskId} completed by ${currentUser?.name}`, notes);
    resetActivityTimer();
    // In real app, would update task status and emit events
  };

  const handleNeedHelp = (taskId: string) => {
    console.log(`Help requested for task ${taskId} by ${currentUser?.name}`);
    resetActivityTimer();
    // In real app, would notify shift lead
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return (timeRemaining / (autoCloseMinutes * 60)) * 100;
  };

  const getTasksByPriority = () => {
    return personalTasks
      .filter(task => task.status === "pending")
      .sort((a, b) => {
        // Sort by overdue first, then priority, then due time
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        
        return a.dueAt.getTime() - b.dueAt.getTime();
      });
  };

  if (!currentUser) {
    return (
      <div className="fixed inset-0 bg-background z-50">
        <PinLogin 
          onLogin={handleLogin} 
          onError={setPinError}
          title="Enter your PIN to access personal tasks"
          error={pinError}
        />
        
        {/* Auto-close timer for PIN entry */}
        <div className="fixed bottom-4 right-4 z-60">
          <Card className="bg-muted/95 backdrop-blur">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 text-sm">
                <Timer className="h-4 w-4" />
                <span>Session expires in {formatTime(timeRemaining)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const prioritizedTasks = getTasksByPriority();
  const overdueTasks = prioritizedTasks.filter(t => t.isOverdue);
  const upcomingTasks = prioritizedTasks.filter(t => !t.isOverdue);

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-auto">
      {/* Auto-close warning */}
      {showWarning && (
        <div className="fixed top-0 left-0 right-0 z-60 bg-destructive text-destructive-foreground p-4 text-center font-semibold animate-pulse">
          <div className="flex items-center justify-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>Session closing in {timeRemaining} seconds - click anywhere to stay active</span>
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <User className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">{currentUser.name}</h1>
                <Badge variant="outline">{currentUser.role.replace('_', ' ')}</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Auto-close timer */}
            <Card className="bg-muted/50">
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <div>
                    <div className="text-sm font-medium">Session Timer</div>
                    <div className="text-xs text-muted-foreground">Auto-close in {formatTime(timeRemaining)}</div>
                  </div>
                  <div className="w-16">
                    <Progress 
                      value={getProgressPercentage()} 
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              variant="outline"
              onClick={handleManualClose}
              data-testid="button-close-personal-tasks"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>

        {/* Task Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{overdueTasks.length}</div>
              <p className="text-xs text-muted-foreground">Need immediate attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{prioritizedTasks.length}</div>
              <p className="text-xs text-muted-foreground">Total assigned to you</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {personalTasks.filter(t => t.status === "done").length}
              </div>
              <p className="text-xs text-muted-foreground">Tasks finished</p>
            </CardContent>
          </Card>
        </div>

        {/* Overdue Tasks (High Priority) */}
        {overdueTasks.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Overdue Tasks</span>
              <Badge variant="destructive">{overdueTasks.length}</Badge>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {overdueTasks.map(task => (
                <TaskCard
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  category={task.category}
                  dueAt={task.dueAt}
                  assignedTo={currentUser.name}
                  status={task.status}
                  isOverdue={task.isOverdue}
                  onComplete={handleTaskComplete}
                  onReassign={() => handleNeedHelp(task.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Tasks */}
        {upcomingTasks.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Upcoming Tasks</span>
              <Badge variant="outline">{upcomingTasks.length}</Badge>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingTasks.map(task => (
                <TaskCard
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  category={task.category}
                  dueAt={task.dueAt}
                  assignedTo={currentUser.name}
                  status={task.status}
                  isOverdue={task.isOverdue}
                  onComplete={handleTaskComplete}
                  onReassign={() => handleNeedHelp(task.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Help Section */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <h3 className="font-medium">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                Click "Reassign" on any task to request assistance from your shift lead.
              </p>
              <p className="text-xs text-muted-foreground">
                This tab will auto-close after {autoCloseMinutes} minutes of inactivity. 
                You can reopen it anytime from the main kiosk.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}