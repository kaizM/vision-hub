import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Package, AlertTriangle, Plus, Minus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface InventoryCardProps {
  id: string;
  sku: string;
  name: string;
  count: number;
  minThreshold: number;
  lastCountTs: Date;
  onUpdateCount?: (id: string, newCount: number, reason: string) => void;
  onQuickCount?: (id: string) => void;
}

export function InventoryCard({
  id,
  sku,
  name,
  count,
  minThreshold,
  lastCountTs,
  onUpdateCount,
  onQuickCount
}: InventoryCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showQuickUpdate, setShowQuickUpdate] = useState(false);
  const [quickCount, setQuickCount] = useState(count.toString());

  const isLowStock = count <= minThreshold;
  const isCriticalStock = count <= Math.floor(minThreshold / 2);

  const handleQuickUpdate = async (delta: number, reason: string) => {
    setIsUpdating(true);
    const newCount = Math.max(0, count + delta);
    console.log(`Updating ${name}: ${count} → ${newCount} (${reason})`);
    
    setTimeout(() => {
      onUpdateCount?.(id, newCount, reason);
      setIsUpdating(false);
    }, 300);
  };

  const handleQuickCountSubmit = async () => {
    const newCount = parseInt(quickCount);
    if (isNaN(newCount) || newCount < 0) return;
    
    setIsUpdating(true);
    console.log(`Manual count update for ${name}: ${count} → ${newCount}`);
    
    setTimeout(() => {
      onUpdateCount?.(id, newCount, "manual_count");
      setShowQuickUpdate(false);
      setIsUpdating(false);
    }, 300);
  };

  const handleQuickCountClick = () => {
    console.log(`Quick count initiated for ${name}`);
    onQuickCount?.(id);
  };

  const getStockStatus = () => {
    if (isCriticalStock) return { label: "Critical", variant: "destructive" as const };
    if (isLowStock) return { label: "Low Stock", variant: "default" as const };
    return { label: "In Stock", variant: "secondary" as const };
  };

  const status = getStockStatus();
  const daysSinceCount = Math.floor((Date.now() - lastCountTs.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card className={cn(
      "hover-elevate transition-all duration-200",
      isCriticalStock && "border-destructive/50 bg-destructive/5",
      isLowStock && !isCriticalStock && "border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Package className={cn(
            "h-4 w-4",
            isCriticalStock ? "text-destructive" : isLowStock ? "text-yellow-600" : "text-muted-foreground"
          )} />
          <Badge variant="outline" className="text-xs font-mono">
            {sku}
          </Badge>
        </div>
        <Badge variant={status.variant}>
          {status.label}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <CardTitle className="text-lg">{name}</CardTitle>
          <div className="flex items-center justify-between mt-2">
            <div className="text-2xl font-bold">
              {count}
              <span className="text-sm text-muted-foreground ml-1">units</span>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div>Min: {minThreshold}</div>
              {daysSinceCount > 0 && (
                <div className="flex items-center space-x-1 text-xs">
                  <Clock className="h-3 w-3" />
                  <span>{daysSinceCount}d ago</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {isLowStock && (
          <div className="flex items-center space-x-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-md">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800 dark:text-yellow-200">
              {isCriticalStock ? "Critical stock level!" : "Low stock - consider reordering"}
            </span>
          </div>
        )}

        {showQuickUpdate ? (
          <div className="space-y-2">
            <Input
              type="number"
              value={quickCount}
              onChange={(e) => setQuickCount(e.target.value)}
              placeholder="New count"
              className="text-center"
              data-testid={`input-count-${id}`}
            />
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={handleQuickCountSubmit}
                disabled={isUpdating}
                className="flex-1"
                data-testid={`button-submit-count-${id}`}
              >
                Update
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowQuickUpdate(false)}
                data-testid={`button-cancel-count-${id}`}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickUpdate(-1, "shrinkage")}
              disabled={isUpdating || count === 0}
              data-testid={`button-decrease-${id}`}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickUpdate(1, "delivery")}
              disabled={isUpdating}
              data-testid={`button-increase-${id}`}
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              onClick={() => setShowQuickUpdate(true)}
              className="flex-1"
              data-testid={`button-count-${id}`}
            >
              Quick Count
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}