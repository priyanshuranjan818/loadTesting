import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Database, Play, FastForward, Activity } from 'lucide-react';

const Docs = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto h-full space-y-8 pb-10"
    >
      <div>
        <h2 className="text-3xl font-display font-semibold mb-2 text-foreground">Documentation</h2>
        <p className="text-muted-foreground text-sm">Everything you need to know to harness the power of Haxx.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Quick Start Card */}
        <div className="bg-background border border-border rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="bg-primary/10 text-primary w-10 h-10 rounded-lg flex items-center justify-center mb-4">
            <Play className="w-5 h-5" fill="currentColor" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Quick Start</h3>
          <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
            Enter your target API URL and specify the massive concurrency rate. Our AWS Lambda army will immediately spin up and begin executing your requests.
          </p>
          <div className="mt-auto bg-secondary p-3 rounded-xl border border-border/50 font-mono text-[11px] text-muted-foreground">
            <span className="text-primary font-semibold">POST</span> /api/startTest<br/>
            {`{"url": "https://api.example.com", "concurrency": 1000}`}
          </div>
        </div>

        {/* Telemetry Card */}
        <div className="bg-background border border-border rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="bg-blue-500/10 text-blue-500 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Live Telemetry</h3>
          <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
            Haxx polls your results every 2 seconds, calculating p50, p95, and p99 latencies in real-time. Watch the dashboard to see your server sweat.
          </p>
          <div className="mt-auto bg-secondary p-3 rounded-xl border border-border/50 font-mono text-[11px] text-muted-foreground">
            <span className="text-blue-500 font-semibold">GET</span> /api/results/:testId<br/>
            {`Returns { "p99": 340, "errors": 0 }`}
          </div>
        </div>

      </div>

      <div className="bg-background border border-border rounded-2xl p-6 shadow-sm">
        <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
          <Terminal className="w-5 h-5 text-muted-foreground" />
          Architecture Overview
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Haxx is powered by a serverless architecture designed for infinite scale. When you start a test, AWS Step Functions coordinate hundreds of individual Lambda workers. Each worker hammers your endpoint simultaneously and writes latency data directly into DynamoDB for instant aggregation.
        </p>
        <div className="flex items-center gap-4 text-xs font-medium text-foreground bg-secondary/50 p-4 rounded-xl border border-border/50 overflow-x-auto">
          <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
            <div className="bg-background border border-border p-2 rounded-lg"><Play className="w-4 h-4 text-primary" /></div>
            <span>Frontend</span>
          </div>
          <div className="text-muted-foreground">→</div>
          <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
            <div className="bg-background border border-border p-2 rounded-lg"><FastForward className="w-4 h-4 text-purple-500" /></div>
            <span>Step Functions</span>
          </div>
          <div className="text-muted-foreground">→</div>
          <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
            <div className="bg-background border border-border p-2 rounded-lg"><Terminal className="w-4 h-4 text-orange-500" /></div>
            <span>Lambda Army</span>
          </div>
          <div className="text-muted-foreground">→</div>
          <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
            <div className="bg-background border border-border p-2 rounded-lg"><Database className="w-4 h-4 text-blue-500" /></div>
            <span>DynamoDB</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Docs; 
