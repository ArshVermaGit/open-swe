"use client";

import React, { useState } from "react";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download, 
  Search,
  ExternalLink,
  Zap,
  Brain,
  ShieldCheck,
  LayoutDashboard,
  DollarSign,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// --- Mock Data ---

const DAILY_DATA = [
  { date: "2024-03-12", cost: 1.25, tokens: 125000, input: 85000, output: 40000 },
  { date: "2024-03-13", cost: 2.10, tokens: 210000, input: 140000, output: 70000 },
  { date: "2024-03-14", cost: 1.85, tokens: 185000, input: 120000, output: 65000 },
  { date: "2024-03-15", cost: 3.45, tokens: 345000, input: 230000, output: 115000 },
  { date: "2024-03-16", cost: 0.95, tokens: 95000, input: 60000, output: 35000 },
  { date: "2024-03-17", cost: 1.50, tokens: 150000, input: 100000, output: 50000 },
  { date: "2024-03-18", cost: 2.80, tokens: 280000, input: 190000, output: 90000 },
];

const AGENT_DATA = [
  { name: "Planner", value: 35, cost: 4.85, fill: "#3b82f6" },
  { name: "Programmer", value: 45, cost: 6.20, fill: "#10b981" },
  { name: "Reviewer", value: 15, cost: 2.10, fill: "#f59e0b" },
  { name: "Manager", value: 5, cost: 0.70, fill: "#8b5cf6" },
];

const RECENT_TASKS = [
  { id: "task-1", title: "Add Auth Middleware", date: "2024-03-18 14:20", cost: 1.45, tokens: 145000, status: "completed" },
  { id: "task-2", title: "Refactor Database Schema", date: "2024-03-18 10:15", cost: 2.80, tokens: 280000, status: "completed" },
  { id: "task-3", title: "Fix CSS Grid Layout", date: "2024-03-17 16:45", cost: 0.85, tokens: 85000, status: "completed" },
  { id: "task-4", title: "Implement Unit Tests", date: "2024-03-16 11:30", cost: 3.10, tokens: 310000, status: "error" },
  { id: "task-5", title: "Update README", date: "2024-03-15 09:00", cost: 0.25, tokens: 25000, status: "completed" },
];

// --- Sub-components ---

const StatCard = ({ title, value, subValue, icon: Icon, trend, trendValue }: any) => (
  <Card className="overflow-hidden border-border/50 shadow-md">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</p>
          <p className="text-2xl font-black tracking-tighter">{value}</p>
          <div className="flex items-center gap-1.5 mt-1">
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3 text-red-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-emerald-500" />
            )}
            <span className={cn(
              "text-[10px] font-bold",
              trend === "up" ? "text-red-500" : "text-emerald-500"
            )}>
              {trendValue}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">{subValue}</span>
          </div>
        </div>
        <div className="bg-primary/10 p-3 rounded-2xl text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// --- Main Page ---

export default function TokenAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d");
  const [searchQuery, setSearchQuery] = useState("");

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const formatNumber = (num: number) => num.toLocaleString("en-US");

  const exportToCSV = () => {
    const headers = ["ID", "Title", "Date", "Tokens", "Cost", "Status"];
    const rows = RECENT_TASKS.map(t => [t.id, t.title, t.date, t.tokens, t.cost, t.status]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `token_usage_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Exported", { description: "Your usage data has been downloaded." });
  };

  return (
    <div className="min-h-screen bg-background p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-black uppercase tracking-tighter italic">Usage Analytics</h1>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Historical cost trends and operational efficiency metrics.</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] border-border/50 bg-card font-bold">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="font-bold border-border/50" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Spend" 
          value="$154.20" 
          subValue="vs last 7d" 
          icon={DollarSign} 
          trend="up" 
          trendValue="+12%" 
        />
        <StatCard 
          title="Avg Cost / Task" 
          value="$1.12" 
          subValue="vs last 7d" 
          icon={TrendingDown} 
          trend="down" 
          trendValue="-5%" 
        />
        <StatCard 
          title="Total Tokens" 
          value="12.5M" 
          subValue="vs last 7d" 
          icon={Zap} 
          trend="up" 
          trendValue="+8.2%" 
        />
        <StatCard 
          title="Peak Execution" 
          value="$4.82" 
          subValue="Single high-cost task" 
          icon={AlertCircle} 
          trend="up" 
          trendValue="+2.1%" 
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Cost Trend */}
        <Card className="lg:col-span-2 border-border/50 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black uppercase italic tracking-tight">Cost Trajectory</CardTitle>
                <CardDescription>Daily spend and token consumption trends.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">Cost (USD)</Badge>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Tokens</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DAILY_DATA}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10} 
                  fontWeight={600}
                  tickFormatter={(val: string) => val.split('-').slice(1).join('/')}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} fontWeight={600} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                  itemStyle={{ fontWeight: 700, fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="cost" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Agent Distribution */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase italic tracking-tight">Agent Distribution</CardTitle>
            <CardDescription>Resource allocation by agent phase.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col justify-center">
            <ResponsiveContainer width="100%" height="200px">
              <PieChart>
                <Pie
                  data={AGENT_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {AGENT_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {AGENT_DATA.map((agent) => (
                <div key={agent.name} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: agent.fill }} />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{agent.name}</span>
                    <span className="text-[12px] font-black">{agent.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-black uppercase italic tracking-tight">Recent Activity</CardTitle>
            <CardDescription>Detailed breakdown of latest representative tasks.</CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-muted/30 border-border/40 font-medium h-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/40 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border/40">
                <tr className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <th className="px-4 py-3">Task Name</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Tokens</th>
                  <th className="px-4 py-3 text-right">Estimated Cost</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {RECENT_TASKS.map((task) => (
                  <tr key={task.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-black tracking-tight">{task.title}</div>
                      <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{task.id}</div>
                    </td>
                    <td className="px-4 py-4 text-xs font-medium text-muted-foreground">{task.date}</td>
                    <td className="px-4 py-4 text-xs font-bold font-mono">{formatNumber(task.tokens)}</td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-black text-primary">{formatCurrency(task.cost)}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-[9px] uppercase font-black tracking-widest",
                          task.status === "completed" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                        )}
                      >
                        {task.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-primary/2 border-primary/20">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <Brain className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-black uppercase italic">Efficiency Insight</h4>
              <p className="text-xs font-medium leading-relaxed">
                Programming tasks consume <span className="text-primary font-bold">45%</span> of your total budget. 
                Consider enabling more aggressive caching to reduce repetitive file-read costs during test loops.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/2 border-emerald-500/20">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-500">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-black uppercase italic tracking-wider">Budget Health</h4>
              <p className="text-xs font-medium leading-relaxed text-emerald-700 dark:text-emerald-400">
                Total spend is within <span className="font-bold">20%</span> of your projected monthly allocation. 
                No high-cost spikes detected in the last 48 hours. Execution is healthy.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
