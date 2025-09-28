import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, ArrowLeft } from "lucide-react";

interface ManagerAuthProps {
  onManagerLogin: (managerData: { id: string; name: string; role: string; pin: string }) => void;
  onBackToRegular: () => void;
  onError?: (error: string) => void;
  error?: string;
}

export function ManagerAuth({ onManagerLogin, onBackToRegular, onError, error }: ManagerAuthProps) {
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleNumberClick = (number: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + number);
    }
  };

  const handleClear = () => {
    setPin("");
  };

  const handleManagerLogin = async () => {
    if (pin.length !== 6) return;
    
    setIsLoading(true);
    
    try {
      // Server-side authentication via API
      const response = await fetch('/api/manager/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Invalid Manager PIN - Access Denied";
        console.log("Manager authentication failed");
        if (onError) onError(errorMessage);
        setPin(""); // Clear PIN on error
        setIsLoading(false);
        return;
      }

      const managerData = await response.json();
      console.log("Manager authentication successful");
      onManagerLogin(managerData); // Pass server-verified manager data
      setIsLoading(false);
    } catch (error) {
      console.error("Manager authentication error:", error);
      if (onError) onError("Manager authentication failed");
      setPin("");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Crown className="h-8 w-8 text-amber-500" />
            <h1 className="text-2xl font-bold text-foreground">Manager Access</h1>
          </div>
          <p className="text-muted-foreground">Enter Manager PIN (6 digits)</p>
        </div>

        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center space-x-2">
              <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-700">
                <Crown className="h-3 w-3 mr-1 text-amber-600 dark:text-amber-400" />
                Manager Authentication
              </Badge>
            </div>
            
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md mt-2">
                {error}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* PIN Display */}
            <div className="flex justify-center space-x-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full border-2 transition-colors ${
                    i < pin.length
                      ? "bg-amber-500 border-amber-500"
                      : "border-muted-foreground/30"
                  }`}
                  data-testid={`pin-dot-${i}`}
                />
              ))}
            </div>

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                <Button
                  key={number}
                  variant="outline"
                  size="lg"
                  className="h-14 text-lg font-semibold hover-elevate active-elevate-2"
                  onClick={() => handleNumberClick(number.toString())}
                  data-testid={`number-${number}`}
                >
                  {number}
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="lg"
                className="h-14 text-lg hover-elevate active-elevate-2"
                onClick={handleClear}
                data-testid="button-clear"
              >
                Clear
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="h-14 text-lg font-semibold hover-elevate active-elevate-2"
                onClick={() => handleNumberClick("0")}
                data-testid="number-0"
              >
                0
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="h-14 hover-elevate active-elevate-2"
                onClick={onBackToRegular}
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>

            {/* Login Button */}
            <div className="space-y-3">
              <Button
                onClick={handleManagerLogin}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                size="lg"
                disabled={pin.length !== 6 || isLoading}
                data-testid="button-manager-login"
              >
                {isLoading ? "Verifying..." : "Manager Login"}
              </Button>
              
              <div className="text-xs text-center text-muted-foreground">
                Manager access provides full system control including settings, user management, and administrative functions.
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}