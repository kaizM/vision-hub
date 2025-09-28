import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Globe, ArrowUpRight, Zap } from "lucide-react";

interface Shortcut {
  id: string;
  name: string;
  url: string;
  icon?: string;
  category?: string;
  visible: boolean;
  sortOrder: number;
}

interface QuickShortcutsProps {
  maxVisible?: number;
  layout?: "grid" | "list";
  showHeader?: boolean;
}

export function QuickShortcuts({ 
  maxVisible = 6, 
  layout = "grid", 
  showHeader = true 
}: QuickShortcutsProps) {
  
  // Fetch visible shortcuts from API
  const { data: shortcuts = [], isLoading } = useQuery({
    queryKey: ['/api/shortcuts?visible=true'],
    queryFn: () => fetch('/api/shortcuts?visible=true').then(res => res.json()),
    refetchInterval: 60000 // Refresh every minute
  });

  // Sort by sortOrder and limit to maxVisible
  const visibleShortcuts = (shortcuts as Shortcut[])
    .sort((a: Shortcut, b: Shortcut) => a.sortOrder - b.sortOrder)
    .slice(0, maxVisible);

  const handleShortcutClick = async (shortcut: Shortcut) => {
    try {
      // Log the click event
      await fetch('/api/shortcuts/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shortcutId: shortcut.id,
          name: shortcut.name,
          url: shortcut.url
        }),
      });

      // Open URL in new tab
      window.open(shortcut.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to log shortcut click:', error);
      // Still open the URL even if logging fails
      window.open(shortcut.url, '_blank', 'noopener,noreferrer');
    }
  };

  const getShortcutIcon = (shortcut: Shortcut) => {
    if (shortcut.icon) {
      // If it's an emoji or text icon
      if (shortcut.icon.length <= 2) {
        return <span className="text-lg">{shortcut.icon}</span>;
      }
    }
    
    // Default icon based on URL domain
    if (shortcut.url.includes('google')) {
      return <Globe className="h-4 w-4 text-blue-500" />;
    } else if (shortcut.url.includes('microsoft') || shortcut.url.includes('office')) {
      return <Globe className="h-4 w-4 text-orange-500" />;
    } else {
      return <ExternalLink className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'inventory':
        return <Badge variant="outline" className="text-xs">Inventory</Badge>;
      case 'admin':
        return <Badge variant="destructive" className="text-xs">Admin</Badge>;
      case 'tools':
        return <Badge variant="secondary" className="text-xs">Tools</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Zap className="h-5 w-5" />
              <span>Quick Shortcuts</span>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className={layout === "grid" ? "grid grid-cols-2 gap-2" : "space-y-2"}>
            {Array.from({ length: maxVisible }).map((_, index) => (
              <div
                key={index}
                className="h-12 bg-muted/30 rounded-md animate-pulse"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (visibleShortcuts.length === 0) {
    return (
      <Card>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Zap className="h-5 w-5" />
              <span>Quick Shortcuts</span>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-4">
            <ExternalLink className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No shortcuts configured</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover-elevate">
      {showHeader && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Zap className="h-5 w-5 text-primary" />
            <span>Quick Shortcuts</span>
            <Badge variant="outline" className="ml-auto text-xs">
              {visibleShortcuts.length}
            </Badge>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className={layout === "grid" ? "grid grid-cols-2 gap-2" : "space-y-2"}>
          {visibleShortcuts.map((shortcut) => (
            <Button
              key={shortcut.id}
              variant="outline"
              size="sm"
              className="h-auto p-3 justify-start hover-elevate"
              onClick={() => handleShortcutClick(shortcut)}
              data-testid={`shortcut-${shortcut.id}`}
            >
              <div className="flex items-center space-x-2 w-full">
                <div className="flex-shrink-0">
                  {getShortcutIcon(shortcut)}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="font-medium text-sm truncate">
                    {shortcut.name}
                  </div>
                  {shortcut.category && layout === "list" && (
                    <div className="mt-1">
                      {getCategoryBadge(shortcut.category)}
                    </div>
                  )}
                </div>
                <ArrowUpRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              </div>
            </Button>
          ))}
        </div>
        
        {(shortcuts as Shortcut[]).length > maxVisible && (
          <div className="mt-3 pt-2 border-t">
            <p className="text-xs text-center text-muted-foreground">
              {(shortcuts as Shortcut[]).length - maxVisible} more shortcuts available in admin
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}