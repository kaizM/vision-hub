import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Crown } from "lucide-react";

interface PinLoginProps {
  onLogin: (employee: { id: string; name: string; role: string; pin: string }) => void;
  onManagerLogin?: () => void;
  onError?: (error: string) => void;
  title?: string;
  error?: string;
}

export function PinLogin({ onLogin, onManagerLogin, onError, title, error }: PinLoginProps) {
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleNumberClick = (number: string) => {
    if (pin.length < 8) { // Allow up to 8 digits for flexibility
      setPin(prev => prev + number);
    }
  };

  const handleClear = () => {
    setPin("");
  };

  const handleLogin = async () => {
    if (pin.length < 3 || pin.length > 8) return; // Allow 3-8 digit PINs
    
    setIsLoading(true);
    
    // Real API call to authenticate employee
    try {
      const response = await fetch('/api/employees/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Invalid PIN - Please try again";
        console.log("Invalid PIN - authentication failed");
        if (onError) onError(errorMessage);
        setPin(""); // Clear PIN on error
        setIsLoading(false);
        return;
      }

      const employee = await response.json();
      console.log(`Login successful for ${employee.name}`);
      onLogin({ ...employee, pin });
      setIsLoading(false);
    } catch (error) {
      console.error("Authentication error:", error);
      setPin(""); // Clear PIN on error
      setIsLoading(false);
    }
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
          <p className="text-muted-foreground">{title || "Enter your PIN to check in"}</p>
          {error && (
            <div className="text-destructive text-sm font-medium bg-destructive/10 rounded-md p-3">
              {error}
            </div>
          )}
        </div>

        <Card className="hover-elevate">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="flex items-center justify-center space-x-2">
              <User className="h-5 w-5" />
              <span>Employee Check-In</span>
            </CardTitle>
            
            {/* PIN Display - Show actual digits for better visibility */}
            <div className="flex justify-center space-x-2 mb-4">
              <div className="min-w-[120px] p-3 bg-muted rounded-lg text-center font-mono text-xl border-2">
                {pin.split('').map((digit, index) => (
                  <span key={index} className="mx-1">
                    {digit}
                  </span>
                )) || (
                  <span className="text-muted-foreground">Enter PIN</span>
                )}
              </div>
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
                disabled={pin.length < 3 || pin.length > 8 || isLoading}
                data-testid="button-pin-login"
              >
                {isLoading ? "Checking..." : "Login"}
              </Button>
            </div>

            {/* Manager Access Option */}
            {onManagerLogin && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-sm hover-elevate"
                  onClick={onManagerLogin}
                  data-testid="button-manager-access"
                >
                  <Crown className="h-4 w-4 mr-2 text-amber-500" />
                  Manager Access
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  For administrative functions and system management
                </p>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}