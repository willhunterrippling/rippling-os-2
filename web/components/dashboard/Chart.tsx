"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "./DataTable";

// Custom tooltip component with proper styling
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
  }>;
  label?: string;
}

// Format date for tooltip display (more detailed than axis)
function formatTooltipDate(value: string | undefined): string {
  if (!value) return "";
  
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T|$)/;
  if (isoDateRegex.test(value)) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric",
        year: "numeric"
      });
    }
  }
  
  return value;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const formattedLabel = formatTooltipDate(label);

  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-md shadow-lg px-3 py-2">
      <p className="font-medium text-sm mb-1">{formattedLabel}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {entry.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

interface ChartProps {
  title: string;
  data: Record<string, unknown>[];
  chartType: "line" | "bar" | "area" | "pie";
  xKey: string;
  yKey: string;
  color?: string;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// Format date values for display on axis
function formatAxisValue(value: unknown): string {
  if (typeof value !== "string") return String(value);
  
  // Check if it's an ISO date string
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T|$)/;
  if (isoDateRegex.test(value)) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      // Format as "Jan 12" for cleaner display
      return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric" 
      });
    }
  }
  
  return value;
}

// Validation result for chart data
interface ValidationResult {
  valid: boolean;
  message?: string;
}

// Validate that chart data is suitable for visualization
function validateChartData(
  data: Record<string, unknown>[],
  xKey: string,
  yKey: string,
  chartType: string
): ValidationResult {
  // Check if data exists
  if (!data || data.length === 0) {
    return { valid: false, message: "No data available for chart." };
  }

  // Check if we have enough data points (charts with 1 point are meaningless)
  if (data.length < 2) {
    return { 
      valid: false, 
      message: "Not enough data points for a chart. Showing as table instead." 
    };
  }

  // Check if xKey column exists
  if (!(xKey in data[0])) {
    return { 
      valid: false, 
      message: `X-axis column "${xKey}" not found in data. Showing as table instead.` 
    };
  }

  // Check if yKey column exists
  if (!(yKey in data[0])) {
    return { 
      valid: false, 
      message: `Y-axis column "${yKey}" not found in data. Showing as table instead.` 
    };
  }

  // Check if yKey values are numeric
  const firstYValue = data[0][yKey];
  if (typeof firstYValue !== "number" && (typeof firstYValue !== "string" || isNaN(Number(firstYValue)))) {
    return { 
      valid: false, 
      message: `Y-axis values are not numeric. Showing as table instead.` 
    };
  }

  // Bar charts with too many categories are hard to read
  if (chartType === "bar" && data.length > 15) {
    return { 
      valid: false, 
      message: `Too many categories (${data.length}) for a bar chart. Showing as table instead.` 
    };
  }

  // Pie charts with too many slices are unreadable
  if (chartType === "pie" && data.length > 8) {
    return { 
      valid: false, 
      message: `Too many slices (${data.length}) for a pie chart. Showing as table instead.` 
    };
  }

  return { valid: true };
}

export function Chart({ title, data, chartType, xKey, yKey, color = "hsl(var(--chart-1))" }: ChartProps) {
  // Validate chart data before rendering
  const validation = validateChartData(data, xKey, yKey, chartType);

  // If validation fails, render a table with explanation
  if (!validation.valid) {
    return (
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
          {validation.message}
        </div>
        <DataTable title={title} data={data} />
      </div>
    );
  }

  const renderChart = () => {
    switch (chartType) {
      case "line":
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey={xKey} 
              className="text-xs" 
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={formatAxisValue}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey={yKey} 
              stroke={color} 
              strokeWidth={2}
              dot={{ fill: color }}
            />
          </LineChart>
        );

      case "bar":
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey={xKey} 
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={formatAxisValue}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case "area":
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey={xKey} 
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={formatAxisValue}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey={yKey} 
              stroke={color} 
              fill={color}
              fillOpacity={0.2}
            />
          </AreaChart>
        );

      case "pie":
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={yKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
