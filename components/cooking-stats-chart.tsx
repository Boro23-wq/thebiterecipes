"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

interface DailyActivity {
  date: string;
  count: number;
}

export function CookingStatsChart({
  dailyActivity,
}: {
  dailyActivity: DailyActivity[];
}) {
  const [chartType, setChartType] = useState<"bar" | "area">("bar");

  // Fill in missing days for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activityMap = new Map(dailyActivity.map((d) => [d.date, d.count]));

  const chartData: {
    date: string;
    label: string;
    shortLabel: string;
    count: number;
    isToday: boolean;
  }[] = [];

  const todayStr = new Date().toISOString().split("T")[0];

  for (let i = 0; i <= 30; i++) {
    const date = new Date(thirtyDaysAgo);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    const label = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const shortLabel = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    chartData.push({
      date: dateStr,
      label,
      shortLabel,
      count: activityMap.get(dateStr) ?? 0,
      isToday: dateStr === todayStr,
    });
  }

  // Summary stats
  const totalCooks = chartData.reduce((sum, d) => sum + d.count, 0);
  const activeDays = chartData.filter((d) => d.count > 0).length;
  const bestDay = chartData.reduce(
    (best, d) => (d.count > best.count ? d : best),
    chartData[0],
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-semibold text-text-primary">
            Cooking Activity
          </h3>
          <span className="text-xs text-text-muted">Last 30 days</span>
        </div>

        {/* Chart type toggle */}
        <div className="flex items-center bg-brand-100 rounded-sm p-0.5">
          <button
            onClick={() => setChartType("bar")}
            className={cn(
              "px-2.5 py-1 text-xs font-medium rounded-sm transition-all cursor-pointer",
              chartType === "bar"
                ? "bg-white text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            Bar
          </button>
          <button
            onClick={() => setChartType("area")}
            className={cn(
              "px-2.5 py-1 text-xs font-medium rounded-sm transition-all cursor-pointer",
              chartType === "area"
                ? "bg-white text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            Trend
          </button>
        </div>
      </div>

      {/* Mini stats */}
      <div className="flex items-center gap-6 mb-4">
        <div>
          <p className="text-xs text-text-muted">Total</p>
          <p className="text-sm font-bold text-text-primary">
            {totalCooks} cooks
          </p>
        </div>
        <div className="w-px h-6 bg-brand-200" />
        <div>
          <p className="text-xs text-text-muted">Active Days</p>
          <p className="text-sm font-bold text-text-primary">
            {activeDays} of 30
          </p>
        </div>
        <div className="w-px h-6 bg-brand-200" />
        <div>
          <p className="text-xs text-text-muted">Best Day</p>
          <p className="text-sm font-bold text-text-primary">
            {bestDay.count > 0
              ? `${bestDay.count} on ${bestDay.shortLabel}`
              : "—"}
          </p>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        {chartType === "bar" ? (
          <BarChart data={chartData} barCategoryGap="20%">
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(255, 107, 53, 0.08)"
            />
            <XAxis
              dataKey="shortLabel"
              tick={{ fontSize: 10, fill: "#999" }}
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fill: "#999" }}
              tickLine={false}
              axisLine={false}
              width={20}
            />
            <Tooltip
              cursor={{ fill: "rgba(255, 107, 53, 0.05)" }}
              contentStyle={{
                background: "white",
                border: "1px solid #FFEFE6",
                borderRadius: "4px",
                fontSize: "12px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                padding: "8px 12px",
              }}
              formatter={(value) => `${value} cook${value !== 1 ? "s" : ""}`}
              labelFormatter={(_, payload) => {
                if (payload?.[0]?.payload?.label) {
                  return String(payload[0].payload.label);
                }
                return "";
              }}
            />
            <Bar
              dataKey="count"
              name="Count"
              radius={[3, 3, 0, 0]}
              maxBarSize={16}
            >
              {chartData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={
                    entry.isToday
                      ? "#FF6B35"
                      : entry.count > 0
                        ? "rgba(255, 107, 53, 0.6)"
                        : "rgba(255, 107, 53, 0.15)"
                  }
                  stroke={entry.isToday ? "#FF6B35" : "none"}
                  strokeWidth={entry.isToday ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="cookGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(255, 107, 53, 0.08)"
            />
            <XAxis
              dataKey="shortLabel"
              tick={{ fontSize: 10, fill: "#999" }}
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fill: "#999" }}
              tickLine={false}
              axisLine={false}
              width={20}
            />
            <Tooltip
              contentStyle={{
                background: "white",
                border: "1px solid #FFEFE6",
                borderRadius: "4px",
                fontSize: "12px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                padding: "8px 12px",
              }}
              formatter={(value) => `${value} cook${value !== 1 ? "s" : ""}`}
              labelFormatter={(_, payload) => {
                if (payload?.[0]?.payload?.label) {
                  return String(payload[0].payload.label);
                }
                return "";
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              name="Count"
              stroke="#FF6B35"
              strokeWidth={2}
              fill="url(#cookGradient)"
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (payload.count === 0) return <></>;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={payload.isToday ? 5 : 3}
                    fill={payload.isToday ? "#FF6B35" : "white"}
                    stroke="#FF6B35"
                    strokeWidth={2}
                  />
                );
              }}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
