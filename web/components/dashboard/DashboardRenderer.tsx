"use client";

import { MetricCard } from "./MetricCard";
import { Chart } from "./Chart";
import { DataTable } from "./DataTable";

interface Widget {
  type: "metric" | "chart" | "table";
  title?: string;
  queryName?: string;
  data: unknown[];
  valueKey?: string;
  chartType?: "line" | "bar" | "area" | "pie";
  xKey?: string;
  yKey?: string;
  columns?: string[];
  hidden?: boolean;
}

interface DashboardConfig {
  title?: string;
  description?: string;
  layout?: "grid" | "stack";
  widgets: Widget[];
}

interface DashboardRendererProps {
  config: DashboardConfig;
}

export function DashboardRenderer({ config }: DashboardRendererProps) {
  const { title, description, layout = "grid", widgets } = config;

  const renderWidget = (widget: Widget, index: number) => {
    const { type, title, queryName, data } = widget;
    const displayTitle = title || queryName || `Widget ${index + 1}`;
    const typedData = data as Record<string, unknown>[];

    switch (type) {
      case "metric": {
        const valueKey = widget.valueKey || "value";
        const value = typedData?.[0]?.[valueKey] ?? 0;
        return (
          <MetricCard
            key={index}
            title={displayTitle}
            value={value as string | number}
          />
        );
      }

      case "chart": {
        const { chartType = "line", xKey = "x", yKey = "y" } = widget;
        return (
          <Chart
            key={index}
            title={displayTitle}
            data={typedData}
            chartType={chartType}
            xKey={xKey}
            yKey={yKey}
          />
        );
      }

      case "table": {
        return (
          <DataTable
            key={index}
            title={displayTitle}
            data={typedData}
            columns={widget.columns}
          />
        );
      }

      default:
        return null;
    }
  };

  const gridClass = layout === "grid" 
    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
    : "space-y-4";

  // Separate metrics from other widgets for better layout
  const metricWidgets = widgets.filter((w) => w.type === "metric");
  const otherWidgets = widgets.filter((w) => w.type !== "metric");

  return (
    <div className="space-y-6">
      {title && (
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}

      {metricWidgets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricWidgets.map((widget, index) => renderWidget(widget, index))}
        </div>
      )}

      {otherWidgets.length > 0 && (
        <div className={gridClass}>
          {otherWidgets.map((widget, index) =>
            renderWidget(widget, metricWidgets.length + index)
          )}
        </div>
      )}

      {widgets.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No widgets configured for this dashboard.</p>
          <p className="text-sm mt-2">
            Run /query in Cursor to add data, then select &quot;Add to dashboard&quot;.
          </p>
        </div>
      )}
    </div>
  );
}
