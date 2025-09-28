import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export function AppHeader() {
  const [, setLocation] = useLocation();

  const handleAdminAccess = () => {
    // Check for Manager PIN 786110 before allowing access
    const pin = prompt("Enter Manager PIN (786110) to access admin controls:");
    if (pin === "786110") {
      setLocation("/admin");
    } else if (pin !== null) {
      alert("Invalid Manager PIN - Access Denied");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Left: Store name */}
        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-semibold text-foreground" data-testid="text-store-name">
            Lemur Express Central Hub
          </h1>
        </div>

        {/* Center: Optional QS tiles link (for future implementation) */}
        <div className="flex-1" />

        {/* Right: Admin gear icon */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAdminAccess}
            className="hover-elevate"
            data-testid="button-admin-gear"
            title="Admin Controls"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}