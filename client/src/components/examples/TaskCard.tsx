import { TaskCard } from '../TaskCard';

export default function TaskCardExample() {
  const mockTasks = [
    {
      id: "1",
      title: "Check cigarette inventory",
      category: "inventory",
      dueAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      assignedTo: "Sarah Johnson",
      status: "pending" as const,
      isOverdue: false
    },
    {
      id: "2", 
      title: "Clean restrooms",
      category: "cleaning",
      dueAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      status: "pending" as const,
      isOverdue: true
    },
    {
      id: "3",
      title: "Restock coffee station", 
      category: "customer_service",
      dueAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      assignedTo: "Mike Chen",
      status: "done" as const
    }
  ];

  const handleComplete = (id: string, notes?: string) => {
    console.log(`Task ${id} completed`, notes);
  };

  const handleReassign = (id: string) => {
    console.log(`Task ${id} reassigned`);
  };

  return (
    <div className="p-6 space-y-4 max-w-md">
      {mockTasks.map(task => (
        <TaskCard
          key={task.id}
          {...task}
          onComplete={handleComplete}
          onReassign={handleReassign}
        />
      ))}
    </div>
  );
}