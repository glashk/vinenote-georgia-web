"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface DataPoint {
  date: string;
  count: number;
}

interface SimpleBarChartProps {
  data: DataPoint[];
  title: string;
  color?: string;
}

export function SimpleBarChart({
  data,
  title,
  color = "#10b981",
}: SimpleBarChartProps) {
  const displayData = data.map((d) => ({
    ...d,
    shortDate: d.date.slice(5), // MM-DD
  }));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
        {title}
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={displayData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="opacity-20"
            />
            <XAxis
              dataKey="shortDate"
              tick={{ fontSize: 10 }}
              stroke="currentColor"
              className="text-slate-500"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              stroke="currentColor"
              className="text-slate-500"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--tw-bg-opacity)",
                border: "1px solid",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [value, "Count"]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
