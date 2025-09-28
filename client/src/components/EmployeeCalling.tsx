import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Phone, Users, MessageSquare, Volume2, Clock } from "lucide-react";
import type { Employee } from "@shared/schema";

export function EmployeeCalling() {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [workAssignment, setWorkAssignment] = useState("");
  const [callMethod, setCallMethod] = useState<"voice" | "message">("voice");

  // Fetch employees
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Fetch who's currently online (checked in)
  const { data: checkedInEmployees = [] } = useQuery<any[]>({
    queryKey: ["/api/check-ins/active"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Send call/message mutation
  const sendCallMutation = useMutation({
    mutationFn: async (data: {
      employeeIds: string[];
      message: string;
      method: "voice" | "message";
    }) => {
      return apiRequest("POST", "/api/employee-calling/send", data);
    },
    onSuccess: () => {
      setSelectedEmployees([]);
      setWorkAssignment("");
      toast({
        title: "Success",
        description: `${callMethod === "voice" ? "Voice call" : "Message"} sent to selected employees`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send call/message",
        variant: "destructive",
      });
    },
  });

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    const activeIds = checkedInEmployees.map(ci => ci.employeeId);
    setSelectedEmployees(activeIds);
  };

  const handleClearSelection = () => {
    setSelectedEmployees([]);
  };

  const handleSendCall = () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: "No Employees Selected",
        description: "Please select at least one employee",
        variant: "destructive",
      });
      return;
    }

    if (!workAssignment.trim()) {
      toast({
        title: "No Work Assignment",
        description: "Please enter work assignment details",
        variant: "destructive",
      });
      return;
    }

    sendCallMutation.mutate({
      employeeIds: selectedEmployees,
      message: workAssignment,
      method: callMethod,
    });
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.name : "Unknown";
  };

  const isEmployeeOnline = (employeeId: string) => {
    return checkedInEmployees.some(ci => ci.employeeId === employeeId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Phone className="h-5 w-5" />
        <h2 className="text-2xl font-bold">Employee Calling & Work Assignment</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Employee Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Select Employees
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={handleSelectAll}
                variant="outline"
                size="sm"
                data-testid="button-select-all-online"
              >
                Select All Online ({checkedInEmployees.length})
              </Button>
              <Button 
                onClick={handleClearSelection}
                variant="outline"
                size="sm"
                data-testid="button-clear-selection"
              >
                Clear Selection
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Online Employees</Label>
              <div className="space-y-2">
                {checkedInEmployees.map((checkedIn) => {
                  const employee = employees.find(e => e.id === checkedIn.employeeId);
                  if (!employee) return null;
                  
                  return (
                    <div
                      key={employee.id}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover-elevate ${
                        selectedEmployees.includes(employee.id) ? 'bg-primary/10 border-primary' : ''
                      }`}
                      onClick={() => handleEmployeeToggle(employee.id)}
                      data-testid={`employee-option-${employee.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <span className="font-medium">{employee.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {employee.role}
                        </Badge>
                      </div>
                      {selectedEmployees.includes(employee.id) && (
                        <Badge>Selected</Badge>
                      )}
                    </div>
                  );
                })}

                {checkedInEmployees.length === 0 && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      No employees are currently checked in. Employees need to be checked in to receive calls.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {selectedEmployees.length > 0 && (
              <Alert>
                <MessageSquare className="h-4 w-4" />
                <AlertDescription>
                  Selected {selectedEmployees.length} employee{selectedEmployees.length > 1 ? 's' : ''}: {' '}
                  {selectedEmployees.map(id => getEmployeeName(id)).join(', ')}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Work Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Work Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="call-method">Call Method</Label>
              <Select value={callMethod} onValueChange={(value: "voice" | "message") => setCallMethod(value)}>
                <SelectTrigger data-testid="select-call-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="voice">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      Voice Announcement
                    </div>
                  </SelectItem>
                  <SelectItem value="message">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Text Message
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="work-assignment">Work Assignment Details</Label>
              <Textarea
                id="work-assignment"
                placeholder="Enter work assignment details..."
                value={workAssignment}
                onChange={(e) => setWorkAssignment(e.target.value)}
                rows={6}
                data-testid="textarea-work-assignment"
              />
            </div>

            <Button
              onClick={handleSendCall}
              className="w-full"
              disabled={sendCallMutation.isPending || selectedEmployees.length === 0 || !workAssignment.trim()}
              data-testid="button-send-call"
            >
              {sendCallMutation.isPending ? "Sending..." : 
                `Send ${callMethod === "voice" ? "Voice Call" : "Message"} to ${selectedEmployees.length} Employee${selectedEmployees.length !== 1 ? 's' : ''}`
              }
            </Button>

            {callMethod === "voice" && (
              <Alert>
                <Volume2 className="h-4 w-4" />
                <AlertDescription>
                  Voice announcements will be played through the kiosk speakers. 
                  Employee names will be announced along with the work assignment.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}