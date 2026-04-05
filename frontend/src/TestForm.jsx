import React, { useState } from 'react';
import { RocketLaunchIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

const TestForm = ({ onTestStart, onExpanding }) => {
  const [url, setUrl] = useState('https://httpbin.org/get');
  const [totalRequests, setTotalRequests] = useState(100);
  const [concurrency, setConcurrency] = useState(10);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onExpanding) onExpanding();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/start-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, totalRequests, concurrency })
      });
      const data = await res.json();
      if (data.testId) {
        onTestStart(data.testId);
      } else {
        alert(data.error || "Failed to start test");
      }
    } catch (err) {
      alert("Error connecting to API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="text-xs font-semibold text-foreground mb-4">
        Test Configuration
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Target API URL</label>
          <input 
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all font-mono text-xs shadow-sm"
            required
          />
        </div>
        
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Total Requests</label>
          <input 
            type="number"
            value={totalRequests}
            onChange={e => setTotalRequests(parseInt(e.target.value))}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all text-xs shadow-sm"
            required min="1"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Concurrency</label>
          <input 
            type="number"
            value={concurrency}
            onChange={e => setConcurrency(parseInt(e.target.value))}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all text-xs shadow-sm"
            required min="1"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="mt-2 bg-primary text-primary-foreground font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 cursor-pointer text-xs"
        >
          {loading ? (
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <RocketLaunchIcon className="w-4 h-4" />
              Initialize Attack
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default TestForm;
