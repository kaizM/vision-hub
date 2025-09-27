import { Dashboard } from '../Dashboard';

export default function DashboardExample() {
  const currentUser = {
    id: "1",
    name: "Sarah Johnson",
    role: "shift_lead",
    checkedInAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  };

  const handleLogout = () => {
    console.log("User logging out");
  };

  return <Dashboard currentUser={currentUser} onLogout={handleLogout} />;
}