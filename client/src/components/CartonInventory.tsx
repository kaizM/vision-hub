import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Package, 
  Plus, 
  Minus, 
  RotateCcw, 
  Undo2, 
  Download,
  RefreshCw,
  Calculator,
  History,
  FileText
} from "lucide-react";
import type { CartonLedger, Employee } from "@shared/schema";

// Form schema for carton operations
const cartonOperationSchema = z.object({
  employee: z.string().min(1, "Employee is required"),
  action: z.enum(["add", "remove", "set", "reset"]),
  amount: z.coerce.number().min(0).optional(),
  note: z.string().max(120, "Note cannot exceed 120 characters").optional(),
});

type CartonOperationForm = z.infer<typeof cartonOperationSchema>;

export function CartonInventory() {
  const [selectedAction, setSelectedAction] = useState<"add" | "remove" | "set" | "reset" | null>(null);
  const [isOperationDialogOpen, setIsOperationDialogOpen] = useState(false);

  // Fetch current carton total
  const { data: cartonData, isLoading: loadingTotal } = useQuery<{ total: number }>({
    queryKey: ["/api/cartons/total"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch carton ledger history
  const { data: ledgerData, isLoading: loadingLedger } = useQuery<CartonLedger[]>({
    queryKey: ["/api/cartons/ledger"],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Fetch employees for dropdown
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const form = useForm<CartonOperationForm>({
    resolver: zodResolver(cartonOperationSchema),
    defaultValues: {
      employee: "",
      action: "add",
      amount: undefined,
      note: "",
    },
  });

  // Carton adjustment mutation
  const adjustMutation = useMutation({
    mutationFn: async (data: CartonOperationForm) => {
      // Calculate delta for the operation
      let delta = 0;
      const currentTotal = cartonData?.total || 0;

      switch (data.action) {
        case "add":
          delta = data.amount || 0;
          break;
        case "remove":
          delta = -(data.amount || 0);
          break;
        case "set":
          delta = (data.amount || 0) - currentTotal;
          break;
        case "reset":
          delta = -currentTotal;
          break;
      }

      return apiRequest("POST", "/api/cartons/adjust", {
        ...data,
        delta, // Include calculated delta
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cartons/total"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cartons/ledger"] });
      setIsOperationDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Carton inventory updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update carton inventory",
        variant: "destructive",
      });
    },
  });

  // Undo last operation mutation
  const undoMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/cartons/undo");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cartons/total"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cartons/ledger"] });
      toast({
        title: "Success",
        description: "Last carton operation undone successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to undo last operation",
        variant: "destructive",
      });
    },
  });

  // CSV Export function
  const exportToCSV = () => {
    if (!ledgerData || ledgerData.length === 0) {
      toast({
        title: "No Data",
        description: "No carton ledger data to export",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Timestamp", "Employee", "Action", "Amount", "Delta", "Total After", "Note"];
    const rows = ledgerData.map((entry: CartonLedger) => [
      entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "",
      entry.employee,
      entry.action.toUpperCase(),
      entry.amount || "",
      entry.delta > 0 ? `+${entry.delta}` : entry.delta.toString(),
      entry.totalAfter,
      entry.note || "",
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map((cell: any) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `carton-inventory-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: "Carton inventory data exported to CSV",
    });
  };

  const handleOperationSubmit = (data: CartonOperationForm) => {
    // Validation for actions that require amount
    if (["add", "remove", "set"].includes(data.action) && (!data.amount || data.amount <= 0)) {
      toast({
        title: "Invalid Amount",
        description: "Amount must be greater than 0 for this operation",
        variant: "destructive",
      });
      return;
    }

    // Validation for remove operation
    if (data.action === "remove" && data.amount! > (cartonData?.total || 0)) {
      toast({
        title: "Insufficient Stock",
        description: "Cannot remove more cartons than current total",
        variant: "destructive",
      });
      return;
    }

    adjustMutation.mutate(data);
  };

  const openOperationDialog = (action: "add" | "remove" | "set" | "reset") => {
    setSelectedAction(action);
    form.setValue("action", action);
    
    // Reset amount for reset operation
    if (action === "reset") {
      form.setValue("amount", undefined);
    } else {
      form.setValue("amount", 1);
    }
    
    setIsOperationDialogOpen(true);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "add": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "remove": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "set": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "reset": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const currentTotal = cartonData?.total || 0;
  const lastEntry = ledgerData?.[0];
  const canUndo = ledgerData && ledgerData.length > 0;

  return (
    <div className="space-y-6">
      {/* Current Total Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Carton Total</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold" data-testid="text-carton-total">
            {loadingTotal ? (
              <RefreshCw className="h-8 w-8 animate-spin" />
            ) : (
              currentTotal.toLocaleString()
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {lastEntry ? (
              <>Last updated by {lastEntry.employee} • {lastEntry.timestamp ? new Date(lastEntry.timestamp).toLocaleString() : ""}</>
            ) : (
              "No recent updates"
            )}
          </p>
        </CardContent>
      </Card>

      {/* Operation Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          onClick={() => openOperationDialog("add")}
          className="h-auto flex-col gap-2 p-4"
          variant="outline"
          data-testid="button-add-cartons"
        >
          <Plus className="h-5 w-5" />
          <span>Add Cartons</span>
        </Button>

        <Button
          onClick={() => openOperationDialog("remove")}
          className="h-auto flex-col gap-2 p-4"
          variant="outline"
          data-testid="button-remove-cartons"
        >
          <Minus className="h-5 w-5" />
          <span>Remove Cartons</span>
        </Button>

        <Button
          onClick={() => openOperationDialog("set")}
          className="h-auto flex-col gap-2 p-4"
          variant="outline"
          data-testid="button-set-cartons"
        >
          <Calculator className="h-5 w-5" />
          <span>Set Total</span>
        </Button>

        <Button
          onClick={() => openOperationDialog("reset")}
          className="h-auto flex-col gap-2 p-4"
          variant="outline"
          data-testid="button-reset-cartons"
        >
          <RotateCcw className="h-5 w-5" />
          <span>Reset to Zero</span>
        </Button>
      </div>

      {/* Action Buttons Row */}
      <div className="flex gap-4">
        <Button
          onClick={() => undoMutation.mutate()}
          disabled={!canUndo || undoMutation.isPending}
          variant="secondary"
          className="gap-2"
          data-testid="button-undo-last"
        >
          <Undo2 className="h-4 w-4" />
          {undoMutation.isPending ? "Undoing..." : "Undo Last"}
        </Button>

        <Button
          onClick={exportToCSV}
          disabled={!ledgerData || ledgerData.length === 0}
          variant="secondary"
          className="gap-2"
          data-testid="button-export-csv"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          <History className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loadingLedger ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading recent activity...</span>
            </div>
          ) : ledgerData && ledgerData.length > 0 ? (
            <div className="space-y-3">
              {ledgerData.slice(0, 10).map((entry: CartonLedger) => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge className={getActionColor(entry.action)}>
                      {entry.action.toUpperCase()}
                    </Badge>
                    <div>
                      <div className="font-medium">{entry.employee}</div>
                      <div className="text-sm text-muted-foreground">
                        {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ""}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {entry.delta > 0 ? `+${entry.delta}` : entry.delta} cartons
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total: {entry.totalAfter}
                    </div>
                  </div>
                  {entry.note && (
                    <div className="text-sm text-muted-foreground max-w-32 truncate">
                      "{entry.note}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p>No carton activity recorded yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operation Dialog */}
      <Dialog open={isOperationDialogOpen} onOpenChange={setIsOperationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAction === "add" && "Add Cartons"}
              {selectedAction === "remove" && "Remove Cartons"}
              {selectedAction === "set" && "Set Carton Total"}
              {selectedAction === "reset" && "Reset Carton Total"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleOperationSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="employee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-employee">
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.name}>
                            {employee.name} ({employee.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedAction !== "reset" && (
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {selectedAction === "add" && "Cartons to Add"}
                        {selectedAction === "remove" && "Cartons to Remove"}
                        {selectedAction === "set" && "Set Total To"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Enter amount"
                          {...field}
                          data-testid="input-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add a note about this operation"
                        className="resize-none"
                        {...field}
                        data-testid="input-note"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedAction === "reset" && (
                <Alert>
                  <AlertDescription>
                    This will reset the carton total to 0. This action can be undone using "Undo Last".
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOperationDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={adjustMutation.isPending}
                  data-testid="button-confirm-operation"
                >
                  {adjustMutation.isPending ? "Processing..." : "Confirm"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}