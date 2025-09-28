import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Send, Clock, User, Users as UsersIcon, Calendar, Eye } from "lucide-react";
import type { Employee } from "@shared/schema";

interface Message {
  id: string;
  type: "broadcast" | "direct";
  recipientId?: string;
  senderId: string;
  content: string;
  sentAt: string;
  readAt?: string;
  recipientName?: string;
  senderName?: string;
}

export function MessagingSystem() {
  const [messageType, setMessageType] = useState<"broadcast" | "direct">("broadcast");
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);

  // Fetch employees
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Fetch online employees
  const { data: onlineEmployees = [] } = useQuery<any[]>({
    queryKey: ["/api/check-ins/active"],
    refetchInterval: 5000,
  });

  // Fetch messages
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    refetchInterval: 10000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      type: "broadcast" | "direct";
      recipientId?: string;
      content: string;
      scheduledTime?: string;
    }) => {
      return apiRequest("POST", "/api/messages/send", data);
    },
    onSuccess: () => {
      setMessageContent("");
      setSelectedRecipient("");
      setScheduledTime("");
      setIsScheduled(false);
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({
        title: "Success",
        description: isScheduled ? "Message scheduled successfully" : "Message sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageContent.trim()) {
      toast({
        title: "No Message Content",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    if (messageType === "direct" && !selectedRecipient) {
      toast({
        title: "No Recipient Selected",
        description: "Please select a recipient for direct messages",
        variant: "destructive",
      });
      return;
    }

    const sendData: any = {
      type: messageType,
      content: messageContent,
    };

    if (messageType === "direct") {
      sendData.recipientId = selectedRecipient;
    }

    if (isScheduled && scheduledTime) {
      sendData.scheduledTime = scheduledTime;
    }

    sendMessageMutation.mutate(sendData);
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.name : "Unknown";
  };

  const isEmployeeOnline = (employeeId: string) => {
    return onlineEmployees.some(oe => oe.employeeId === employeeId);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h2 className="text-2xl font-bold">Employee Messaging System</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Send Message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Message Type</Label>
              <Select value={messageType} onValueChange={(value: "broadcast" | "direct") => setMessageType(value)}>
                <SelectTrigger data-testid="select-message-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="broadcast">
                    <div className="flex items-center gap-2">
                      <UsersIcon className="h-4 w-4" />
                      Broadcast to All
                    </div>
                  </SelectItem>
                  <SelectItem value="direct">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Direct Message
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {messageType === "direct" && (
              <div className="space-y-2">
                <Label>Recipient</Label>
                <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                  <SelectTrigger data-testid="select-recipient">
                    <SelectValue placeholder="Select employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isEmployeeOnline(employee.id) ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {employee.name}
                          <Badge variant="outline" className="text-xs">
                            {employee.role}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Message Content</Label>
              <Textarea
                placeholder="Enter your message..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={4}
                data-testid="textarea-message-content"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="scheduled"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="scheduled">Schedule for later</Label>
            </div>

            {isScheduled && (
              <div className="space-y-2">
                <Label>Scheduled Time</Label>
                <Input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  data-testid="input-scheduled-time"
                />
              </div>
            )}

            <Button
              onClick={handleSendMessage}
              className="w-full"
              disabled={sendMessageMutation.isPending || !messageContent.trim()}
              data-testid="button-send-message"
            >
              {sendMessageMutation.isPending ? "Sending..." : 
                isScheduled ? "Schedule Message" : "Send Message"
              }
            </Button>

            {messageType === "broadcast" && (
              <Alert>
                <UsersIcon className="h-4 w-4" />
                <AlertDescription>
                  Broadcast messages will be sent to all employees and displayed when they log in.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Online Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Employee Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Currently Online ({onlineEmployees.length})</Label>
              <div className="space-y-2">
                {onlineEmployees.map((checkedIn) => {
                  const employee = employees.find(e => e.id === checkedIn.employeeId);
                  if (!employee) return null;
                  
                  return (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between p-2 border rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <span className="font-medium">{employee.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {employee.role}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Since {formatTime(checkedIn.timestamp)}
                      </span>
                    </div>
                  );
                })}

                {onlineEmployees.length === 0 && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      No employees are currently online.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Recent Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {messages.slice(0, 10).map((message) => (
              <div
                key={message.id}
                className="flex items-start justify-between p-3 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={message.type === "broadcast" ? "default" : "outline"}>
                      {message.type === "broadcast" ? "Broadcast" : "Direct"}
                    </Badge>
                    {message.type === "direct" && message.recipientName && (
                      <span className="text-sm text-muted-foreground">
                        to {message.recipientName}
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{message.content}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Sent: {formatTime(message.sentAt)}</span>
                    {message.readAt && (
                      <span>• Read: {formatTime(message.readAt)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {messages.length === 0 && (
              <Alert>
                <MessageSquare className="h-4 w-4" />
                <AlertDescription>
                  No messages sent yet.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}