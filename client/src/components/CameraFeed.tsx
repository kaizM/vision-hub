import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, Wifi, WifiOff, Settings, Maximize2 } from "lucide-react";

interface CameraFeedProps {
  id: string;
  name: string;
  location: string;
  isActive?: boolean;
  simulatedImageUrl?: string;
  onSettings?: (id: string) => void;
  onFullscreen?: (id: string) => void;
}

export function CameraFeed({
  id,
  name,
  location,
  isActive = true,
  simulatedImageUrl,
  onSettings,
  onFullscreen
}: CameraFeedProps) {
  const [isConnected, setIsConnected] = useState(isActive);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Simulate connection status changes
  useEffect(() => {
    if (!isActive) return;
    
    const statusTimer = setInterval(() => {
      // Randomly disconnect/reconnect for demo
      if (Math.random() < 0.05) { // 5% chance per second
        setIsConnected(prev => !prev);
      }
    }, 1000);

    return () => clearInterval(statusTimer);
  }, [isActive]);

  const handleSettingsClick = () => {
    console.log(`Opening settings for camera: ${name}`);
    onSettings?.(id);
  };

  const handleFullscreenClick = () => {
    console.log(`Opening fullscreen for camera: ${name}`);
    onFullscreen?.(id);
  };

  return (
    <Card className="hover-elevate overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Camera className="h-4 w-4" />
          <CardTitle className="text-sm font-medium">{name}</CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            variant={isConnected ? "secondary" : "destructive"}
            className="text-xs"
          >
            <div className="flex items-center space-x-1">
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              <span>{isConnected ? "Live" : "Offline"}</span>
            </div>
          </Badge>
          <div className="flex space-x-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={handleSettingsClick}
              data-testid={`button-camera-settings-${id}`}
            >
              <Settings className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost" 
              className="h-6 w-6"
              onClick={handleFullscreenClick}
              data-testid={`button-camera-fullscreen-${id}`}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative aspect-video bg-muted">
          {isConnected && simulatedImageUrl ? (
            <img
              src={simulatedImageUrl}
              alt={`${name} feed`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <Camera className="h-8 w-8 mx-auto opacity-50" />
                <p className="text-sm">{isConnected ? "Loading..." : "Camera Offline"}</p>
              </div>
            </div>
          )}
          
          {/* Overlay with timestamp and location */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
            <div className="absolute bottom-2 left-2 text-white text-xs space-y-1">
              <div className="bg-black/50 px-2 py-1 rounded">
                {location}
              </div>
              <div className="bg-black/50 px-2 py-1 rounded font-mono">
                {currentTime.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}