import { EmployeeStatus } from '../EmployeeStatus';

export default function EmployeeStatusExample() {
  const currentUser = {
    id: "1",
    name: "Sarah Johnson",
    role: "shift_lead",
    checkedInAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  };

  const activeEmployees = [
    currentUser,
    {
      id: "2",
      name: "Mike Chen", 
      role: "employee",
      checkedInAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
    },
    {
      id: "3",
      name: "Store Manager",
      role: "admin", 
      checkedInAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
    },
    {
      id: "4",
      name: "Alex Rivera",
      role: "employee",
      checkedInAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    }
  ];

  const handleCheckOut = (employeeId: string) => {
    console.log(`Employee ${employeeId} checking out`);
  };

  const handleViewAll = () => {
    console.log("Opening employee management view");
  };

  return (
    <div className="p-6 max-w-md">
      <EmployeeStatus
        currentUser={currentUser}
        activeEmployees={activeEmployees}
        onCheckOut={handleCheckOut}
        onViewAll={handleViewAll}
      />
    </div>
  );
}