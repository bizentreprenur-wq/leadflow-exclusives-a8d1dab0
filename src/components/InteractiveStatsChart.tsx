import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, Mail, Users, Target, BarChart3 } from "lucide-react";

interface StatsData {
  emailsSent?: number;
  emailsOpened?: number;
  leadsGenerated?: number;
  conversions?: number;
}

interface InteractiveStatsChartProps {
  data?: StatsData;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

export default function InteractiveStatsChart({ data }: InteractiveStatsChartProps) {
  const [activeChart, setActiveChart] = useState("overview");

  // Sample data for demonstration
  const weeklyData = [
    { name: "Mon", emails: 45, opens: 28, leads: 12, conversions: 3 },
    { name: "Tue", emails: 52, opens: 35, leads: 15, conversions: 5 },
    { name: "Wed", emails: 38, opens: 22, leads: 8, conversions: 2 },
    { name: "Thu", emails: 65, opens: 48, leads: 22, conversions: 8 },
    { name: "Fri", emails: 72, opens: 55, leads: 28, conversions: 10 },
    { name: "Sat", emails: 25, opens: 15, leads: 5, conversions: 1 },
    { name: "Sun", emails: 18, opens: 10, leads: 3, conversions: 1 },
  ];

  const pieData = [
    { name: "Opened", value: 45, color: "hsl(var(--chart-1))" },
    { name: "Clicked", value: 25, color: "hsl(var(--chart-2))" },
    { name: "Replied", value: 15, color: "hsl(var(--chart-3))" },
    { name: "No Response", value: 15, color: "hsl(var(--chart-4))" },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-foreground mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs text-muted-foreground">
              <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
              {entry.name}: <span className="font-semibold text-foreground">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Performance Analytics
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeChart} onValueChange={setActiveChart} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              <TrendingUp className="w-4 h-4 mr-1.5 hidden sm:block" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="emails" className="text-xs sm:text-sm">
              <Mail className="w-4 h-4 mr-1.5 hidden sm:block" />
              Emails
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="text-xs sm:text-sm">
              <Target className="w-4 h-4 mr-1.5 hidden sm:block" />
              Breakdown
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="emails"
                  name="Emails Sent"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorEmails)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  name="Leads Generated"
                  stroke="hsl(var(--chart-2))"
                  fillOpacity={1}
                  fill="url(#colorLeads)"
                  strokeWidth={2}
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="emails" className="mt-4">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="emails" name="Sent" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="opens" name="Opened" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="conversions" name="Converted" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="breakdown" className="mt-4">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={200} className="max-w-[250px]">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
