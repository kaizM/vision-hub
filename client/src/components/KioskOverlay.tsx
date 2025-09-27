import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Clock, Volume2, VolumeX, Smartphone, ExternalLink } from "lucide-react";

interface KioskOverlayProps {
  employeeName: string;
  taskTitle: string;
  timestamp: Date;
  onAcknowledge: () => void;
  onDismiss: () => void;
  onOpenTask: () => void;
  qrCodeUrl?: string;
}

export function KioskOverlay({
  employeeName,
  taskTitle,
  timestamp,
  onAcknowledge,
  onDismiss,
  onOpenTask,
  qrCodeUrl
}: KioskOverlayProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Update elapsed time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - timestamp.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [timestamp]);

  // Repeating audio system - chime every 10 seconds until acknowledged
  useEffect(() => {
    if (isMuted) return;

    // Initial audio
    playNotificationSound();
    speakEmployeeName();

    // Set up repeating chime every 10 seconds
    const chimeInterval = setInterval(() => {
      if (!isMuted) {
        playNotificationSound();
        // Don't repeat TTS every time, just chime
      }
    }, 10000); // 10 seconds

    // TTS repeats every 30 seconds (less frequent than chime)
    const ttsInterval = setInterval(() => {
      if (!isMuted) {
        speakEmployeeName();
      }
    }, 30000); // 30 seconds

    return () => {
      clearInterval(chimeInterval);
      clearInterval(ttsInterval);
      window.speechSynthesis.cancel();
    };
  }, [employeeName, isMuted]);

  const playNotificationSound = async () => {
    try {
      setIsPlaying(true);
      // Create a simple chime sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Create a pleasant chime sound
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(900, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      setTimeout(() => setIsPlaying(false), 500);
    } catch (error) {
      console.log("Audio playback failed:", error);
      setIsPlaying(false);
    }
  };

  const speakEmployeeName = () => {
    if ('speechSynthesis' in window && !isMuted) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(
        `${employeeName}, please enter your PIN.`
      );
      
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      // Repeat 3 times with delay
      const speakWithDelay = (count: number) => {
        if (count > 0 && !isMuted) {
          window.speechSynthesis.speak(utterance);
          setTimeout(() => speakWithDelay(count - 1), 2000);
        }
      };
      
      speakWithDelay(3);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      // Mute - stop any ongoing speech
      window.speechSynthesis.cancel();
      console.log("Audio muted for 60 seconds");
      // Auto-unmute after 60 seconds
      setTimeout(() => setIsMuted(false), 60000);
    } else {
      console.log("Audio unmuted");
    }
  };

  const handleAcknowledge = () => {
    console.log(`Call acknowledged for ${employeeName}`);
    window.speechSynthesis.cancel();
    onAcknowledge();
  };

  const handleOpenTask = () => {
    console.log(`Opening task for ${employeeName}`);
    window.speechSynthesis.cancel();
    onOpenTask();
  };

  const handleDismiss = () => {
    console.log(`Call dismissed for ${employeeName}`);
    window.speechSynthesis.cancel();
    onDismiss();
  };

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl border-4 border-primary bg-background shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
        <CardHeader className="text-center space-y-4 pb-4">
          <div className="flex items-center justify-center space-x-3">
            <UserCircle className="h-12 w-12 text-primary" />
            <div>
              <CardTitle className="text-3xl font-bold text-primary">{employeeName}</CardTitle>
              <Badge variant="secondary" className="mt-1">Employee Call</Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-4 text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Called {formatElapsedTime(elapsedTime)} ago</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleMute}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-toggle-mute"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              <span className="ml-1">{isMuted ? "Muted" : "Sound On"}</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">Assigned Task</h3>
            <p className="text-lg text-muted-foreground bg-muted/50 p-3 rounded-lg">
              {taskTitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              size="lg"
              onClick={handleOpenTask}
              className="text-lg py-6"
              data-testid="button-open-task"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Open Task
            </Button>

            {qrCodeUrl && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.open(qrCodeUrl, '_blank')}
                className="text-lg py-6"
                data-testid="button-mobile-access"
              >
                <Smartphone className="h-5 w-5 mr-2" />
                Mobile Access
              </Button>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>Please enter your PIN to access your personal tasks.</p>
            <p>This alert will continue until acknowledged or completed.</p>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handleAcknowledge}
              data-testid="button-acknowledge"
            >
              Acknowledge (Silence)
            </Button>
            <Button
              variant="ghost"
              onClick={handleDismiss}
              data-testid="button-dismiss"
            >
              Dismiss Call
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}