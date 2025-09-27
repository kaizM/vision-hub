import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, User } from "lucide-react";

interface PinLoginProps {
  onLogin: (pin: string, employeeName: string, role: string) => void;
}

export function PinLogin({ onLogin }: PinLoginProps) {
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Mock employee data - todo: remove mock functionality
  const mockEmployees = [
    { pin: "1234", name: "Store Manager", role: "admin" },
    { pin: "5678", name: "Sarah Johnson", role: "shift_lead" },
    { pin: "9999", name: "Mike Chen", role: "employee" }
  ];

  const handleNumberClick = (number: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + number);
    }
  };

  const handleClear = () => {
    setPin("");
  };

  const handleLogin = async () => {
    if (pin.length !== 4) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const employee = mockEmployees.find(emp => emp.pin === pin);
      if (employee) {
        console.log(`Login successful for ${employee.name}`);
        onLogin(pin, employee.name, employee.role);
      } else {
        console.log("Invalid PIN");
        setPin("");
      }
      setIsLoading(false);
    }, 500);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "shift_lead": return "default";
      default: return "secondary";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">StoreHub</h1>
          </div>
          <p className="text-muted-foreground">Enter your PIN to check in</p>
        </div>

        <Card className="hover-elevate">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="flex items-center justify-center space-x-2">
              <User className="h-5 w-5" />
              <span>Employee Check-In</span>
            </CardTitle>
            
            {/* PIN Display */}
            <div className="flex justify-center space-x-2">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="w-4 h-4 rounded-full border-2 border-border flex items-center justify-center"
                >
                  {pin[index] && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                <Button
                  key={number}
                  variant="outline"
                  size="lg"
                  className="h-12 text-lg font-semibold hover-elevate"
                  onClick={() => handleNumberClick(number.toString())}
                  data-testid={`button-pin-${number}`}
                >
                  {number}
                </Button>
              ))}
              <Button
                variant="outline"
                size="lg"
                className="h-12 text-lg font-semibold hover-elevate"
                onClick={handleClear}
                data-testid="button-pin-clear"
              >
                Clear
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 text-lg font-semibold hover-elevate"
                onClick={() => handleNumberClick("0")}
                data-testid="button-pin-0"
              >
                0
              </Button>
              <Button
                variant="default"
                size="lg"
                className="h-12 text-lg font-semibold"
                onClick={handleLogin}
                disabled={pin.length !== 4 || isLoading}
                data-testid="button-pin-login"
              >
                {isLoading ? "Checking..." : "Login"}
              </Button>
            </div>

            {/* Demo Instructions */}
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">Demo PINs:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {mockEmployees.map((emp) => (
                  <Badge
                    key={emp.pin}
                    variant={getRoleColor(emp.role) as any}
                    className="text-xs cursor-pointer hover-elevate"
                    onClick={() => setPin(emp.pin)}
                    data-testid={`badge-demo-${emp.pin}`}
                  >
                    {emp.pin} - {emp.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}