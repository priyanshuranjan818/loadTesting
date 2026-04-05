import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const StatCard = ({ title, value, unit }) => (
  <div className="bg-background border border-border p-4 rounded-xl shadow-sm flex flex-col shrink-0 min-w-0">
    <h4 className="text-muted-foreground text-[11px] font-medium mb-1 truncate">{title}</h4>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-bold tracking-tight text-foreground truncate">{value !== undefined ? value : '-'}</span>
      <span className="text-muted-foreground font-medium text-[10px]">{unit}</span>
    </div>
  </div>
);

const ResultsDashboard = ({ stats }) => {
  if (!stats) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-secondary/30 rounded-xl border border-border/50">
        <ArrowPathIcon className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  const { p50, p95, p99, errors, completed, wanted, isComplete, regions } = stats;
  const progress = wanted > 0 ? Math.min(100, Math.round((completed / wanted) * 100)) : 0;

  const regionData = Object.keys(regions || {}).map(key => ({
    name: key,
    requests: regions[key].count
  }));

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          Live Telemetry
          {isComplete ? 
            <span className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 font-medium"><CheckCircleIcon className="w-3 h-3"/> Complete</span> : 
            <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1 font-medium"><ArrowPathIcon className="w-3 h-3 animate-spin"/> Running</span>
          }
        </h2>
        <div className="text-xs font-medium text-muted-foreground bg-background border border-border px-2 py-1 rounded-md shadow-sm">
          {completed} / {wanted} Reqs
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
        <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <StatCard title="P50 Latency" value={p50} unit="ms" />
        <StatCard title="P95 Latency" value={p95} unit="ms" />
        <StatCard title="P99 Latency" value={p99} unit="ms" />
        <StatCard title="Failed" value={errors} unit="reqs" />
      </div>

      <div className="bg-background rounded-xl border border-border p-4 shadow-sm flex flex-col min-h-[160px] flex-1">
        <h3 className="text-[11px] font-semibold text-muted-foreground mb-3">Regional Distribution</h3>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
              <YAxis stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
              <Tooltip 
                cursor={{fill: 'hsl(var(--secondary))'}} 
                contentStyle={{backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))', fontSize: '12px'}}
                itemStyle={{color: 'hsl(var(--primary))'}}
              />
              <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard;
