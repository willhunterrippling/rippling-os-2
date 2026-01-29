"use client";

import { useState } from "react";
import { GripVertical, Eye, EyeOff, Save, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Widget {
  id?: string;
  type: string;
  title?: string;
  queryName?: string;
  hidden?: boolean;
  [key: string]: unknown;
}

interface DashboardConfig {
  title?: string;
  widgets: Widget[];
}

interface DashboardEditorProps {
  dashboardId: string;
  initialConfig: DashboardConfig;
  canEdit: boolean;
}

export function DashboardEditor({
  dashboardId,
  initialConfig,
  canEdit,
}: DashboardEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState<DashboardConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (!canEdit) return null;

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newWidgets = [...config.widgets];
    const [draggedWidget] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(index, 0, draggedWidget);

    setConfig({ ...config, widgets: newWidgets });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const toggleWidgetVisibility = (index: number) => {
    const newWidgets = [...config.widgets];
    newWidgets[index] = {
      ...newWidgets[index],
      hidden: !newWidgets[index].hidden,
    };
    setConfig({ ...config, widgets: newWidgets });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/dashboards/${dashboardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });

      if (!res.ok) throw new Error("Failed to save");

      setIsEditing(false);
      // Optionally refresh the page to show updated dashboard
      window.location.reload();
    } catch (error) {
      console.error("Failed to save dashboard:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setConfig(initialConfig);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsEditing(true)}
        className="gap-2"
      >
        <Pencil className="h-4 w-4" />
        Edit Layout
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Editor toolbar */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
        <div className="text-sm font-medium">Editing Dashboard Layout</div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Widget list */}
      <div className="space-y-2">
        {config.widgets.map((widget, index) => (
          <div
            key={widget.id || index}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "flex items-center gap-3 p-3 bg-background border rounded-lg cursor-move transition-opacity",
              draggedIndex === index && "opacity-50",
              widget.hidden && "opacity-60"
            )}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium text-sm">
                {widget.title || widget.queryName || `${widget.type} widget`}
              </div>
              <div className="text-xs text-muted-foreground capitalize">
                {widget.type}
                {widget.queryName && ` • ${widget.queryName}`}
              </div>
            </div>
            <button
              onClick={() => toggleWidgetVisibility(index)}
              className={cn(
                "p-1.5 rounded hover:bg-accent",
                widget.hidden ? "text-muted-foreground" : "text-foreground"
              )}
              title={widget.hidden ? "Show widget" : "Hide widget"}
            >
              {widget.hidden ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Drag widgets to reorder. Click the eye icon to show/hide widgets.
        For more complex changes, use Cursor.
      </p>
    </div>
  );
}
