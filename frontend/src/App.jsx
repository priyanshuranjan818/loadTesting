import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Search, Bell, ChevronDown, Rocket, Lock, Settings, LogOut, CreditCard, ExternalLink } from 'lucide-react';
import TestForm from './TestForm';
import ResultsDashboard from './ResultsDashboard';
import About from './About';
import Contact from './Contact';
import Docs from './Docs';

const DashboardPreview = ({ onTestStart, testId, testStats, isExpanded, onExpanding }) => {
  const [activeWindow, setActiveWindow] = useState('dashboard');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Close menus when clicking outside (simple implementation by closing on any main click)
  const closeMenus = () => {
    setShowProfileMenu(false);
    setShowSearch(false);
    setShowNotifications(false);
  };

  return (
    <motion.div 
      layout
      onClick={closeMenus}
      initial={{ opacity: 0, y: 30 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        borderRadius: isExpanded ? "0px" : "16px"
      }}
      transition={{ layout: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }}
      className={`shrink-0 ${isExpanded ? 'fixed inset-0 z-50 w-full h-full p-0 m-0' : 'relative mt-8 w-full max-w-5xl p-3 md:p-4 z-10'}`}
      style={{
        background: isExpanded ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.4)',
        border: isExpanded ? 'none' : '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: isExpanded ? 'none' : 'var(--shadow-dashboard)',
        backdropFilter: 'blur(8px)'
      }}
    >
      <motion.div 
        layout 
        className={`w-full bg-background shadow-sm flex flex-col text-[11px] overflow-hidden relative ${isExpanded ? 'h-full border-0 rounded-none' : 'rounded-xl border border-border h-[550px]'}`}
      >
        
        {/* Top bar */}
        <motion.div layout="position" className={`flex items-center justify-between border-b border-border px-4 py-2.5 bg-background shrink-0 select-none z-20 ${isExpanded ? '' : 'rounded-t-xl'}`}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveWindow('dashboard')}>
            <div className="bg-primary text-primary-foreground font-bold text-xs rounded w-6 h-6 flex items-center justify-center">H</div>
            <span className="font-semibold text-xs text-foreground">Haxx</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground ml-1" />
          </div>
          
          <div 
            className="flex items-center bg-secondary hover:bg-secondary/80 transition-colors px-3 py-1.5 rounded-md w-64 justify-between border border-border/50 cursor-pointer relative"
            onClick={(e) => { e.stopPropagation(); setShowSearch(!showSearch); setShowProfileMenu(false); setShowNotifications(false); }}
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <Search className="w-3 h-3" />
              <span>Search metrics...</span>
            </div>
            <div className="text-[9px] border bg-background px-1 rounded text-muted-foreground">⌘K</div>
            
            <AnimatePresence>
              {showSearch && (
                <motion.div 
                  key="search-menu"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute top-10 left-0 w-full bg-background border border-border rounded-xl shadow-lg p-2 z-50 text-foreground"
                >
                  <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium mb-1">Recent Searches</div>
                  <div className="px-2 py-1.5 hover:bg-secondary rounded-md cursor-pointer flex items-center justify-between">
                    <span>Latency (p99)</span>
                    <Search className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div className="px-2 py-1.5 hover:bg-secondary rounded-md cursor-pointer flex items-center justify-between">
                    <span>Error Rate by Region</span>
                    <Search className="w-3 h-3 text-muted-foreground" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex items-center gap-4 relative">
            <div 
              className={`font-medium cursor-pointer transition-colors ${activeWindow === 'docs' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setActiveWindow('docs')}
            >
              Docs
            </div>
            
            <div className="relative">
              <Bell 
                className={`w-4 h-4 cursor-pointer transition-colors ${showNotifications ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`} 
                onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); setShowProfileMenu(false); setShowSearch(false); }}
              />
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    key="notifications-menu"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute top-8 right-[-10px] w-64 bg-background border border-border rounded-xl shadow-lg p-3 z-50 transform origin-top-right"
                  >
                    <div className="font-semibold text-xs mb-2 border-b border-border pb-2 text-foreground">Notifications</div>
                    <div className="p-4 text-center text-muted-foreground italic bg-secondary/30 rounded-lg">
                      No new alerts
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <div 
                className="bg-secondary rounded-full w-6 h-6 flex items-center justify-center font-medium border border-border text-foreground cursor-pointer hover:ring-2 ring-primary/20 transition-all"
                onClick={(e) => { e.stopPropagation(); setShowProfileMenu(!showProfileMenu); setShowSearch(false); setShowNotifications(false); }}
              >
                JB
              </div>
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div 
                    key="profile-menu"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute top-8 right-0 w-48 bg-background border border-border rounded-xl shadow-lg p-1.5 z-50 transform origin-top-right flex flex-col gap-0.5 text-foreground"
                  >
                    <div className="px-2 py-2 border-b border-border mb-1">
                      <div className="font-semibold text-xs">Jared B.</div>
                      <div className="text-[10px] text-muted-foreground">jared@example.com</div>
                    </div>
                    <div className="px-2 py-1.5 hover:bg-secondary rounded-md cursor-pointer flex items-center gap-2 text-xs">
                      <Settings className="w-3.5 h-3.5" /> Settings
                    </div>
                    <div className="px-2 py-1.5 hover:bg-secondary rounded-md cursor-pointer flex items-center gap-2 text-xs">
                      <CreditCard className="w-3.5 h-3.5" /> Billing
                    </div>
                    <div className="px-2 py-1.5 opacity-60 cursor-not-allowed flex items-center justify-between text-xs mb-1 border-b border-border pb-2">
                       <div className="flex items-center gap-2">
                         <ExternalLink className="w-3.5 h-3.5" /> API Keys
                       </div>
                       <Lock className="w-3 h-3" />
                    </div>
                    <div className="px-2 py-1.5 hover:bg-red-500/10 text-red-500 rounded-md cursor-pointer flex items-center gap-2 text-xs mt-1">
                      <LogOut className="w-3.5 h-3.5" /> Log Out
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Main Body */}
        <motion.div layout="position" className={`flex flex-1 min-h-0 overflow-hidden ${isExpanded ? '' : 'rounded-b-xl'}`}>
          
          {activeWindow === 'docs' ? (
            <div className="flex-1 bg-secondary/10 p-8 flex flex-col overflow-y-auto h-full relative">
              <Docs />
            </div>
          ) : (
            <>
              {/* Sidebar Area (Left Form) */}
              <div className={`${isExpanded ? 'w-80' : 'w-72'} transition-all duration-700 border-r border-border bg-background flex flex-col py-4 px-4 h-full overflow-y-auto`}>
                <TestForm onTestStart={onTestStart} onExpanding={onExpanding} />
              </div>

              {/* Main Content Area (Right Dashboard) */}
              <div className="flex-1 bg-secondary/30 p-6 flex flex-col overflow-y-auto h-full relative">
                {testId ? (
                  <ResultsDashboard stats={testStats} />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-muted-foreground pointer-events-none select-none">
                    <div className="bg-background border border-border p-4 rounded-2xl shadow-sm mb-4">
                      <Rocket className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">Awaiting Telemetry</h3>
                    <p className="max-w-[250px] leading-relaxed">Configure and initialize an attack sequence on the left to begin gathering live ingestion metrics.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default function App() {
  const [testId, setTestId] = useState(null);
  const [testStats, setTestStats] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    let intervalId;
    if (testId) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/results/${testId}`);
          if (res.ok) {
            const data = await res.json();
            setTestStats(data);
            if (data.isComplete) {
              clearInterval(intervalId);
            }
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 2000);
    }
    return () => clearInterval(intervalId);
  }, [testId]);

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden relative">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-[0]"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4"
      />

      <div className="relative z-10 flex flex-col items-center w-full h-full overflow-y-auto">
        {/* Navbar */}
        <nav className="w-full flex items-center justify-between px-6 md:px-12 lg:px-20 py-5 font-body">
          <div className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-1.5">
            ✦ Haxx
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground select-none">
            <div onClick={() => setActiveTab('home')} className={`transition-colors cursor-pointer ${activeTab === 'home' ? 'text-foreground font-semibold' : 'hover:text-foreground'}`}>Home</div>
            <div className="flex items-center gap-1.5 opacity-50 cursor-not-allowed">Pricing <Lock className="w-3 h-3" /></div>
            <div onClick={() => setActiveTab('about')} className={`transition-colors cursor-pointer ${activeTab === 'about' ? 'text-foreground font-semibold' : 'hover:text-foreground'}`}>About</div>
            <div onClick={() => setActiveTab('contact')} className={`transition-colors cursor-pointer ${activeTab === 'contact' ? 'text-foreground font-semibold' : 'hover:text-foreground'}`}>Contact</div>
          </div>
          <button onClick={() => setIsExpanded(true)} className="rounded-full px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm cursor-pointer">
            Get started
          </button>
        </nav>

        {/* Content Router */}
        {activeTab === 'home' ? (
          <main className="flex-1 w-full flex flex-col items-center justify-start pt-16 px-4 pb-16 relative">
            
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-sm text-muted-foreground font-body mb-6 shadow-sm"
            >
              Cloud-Powered Load Testing ✨
            </motion.div>

            {/* Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="text-center font-display text-5xl md:text-6xl lg:text-[5rem] leading-[0.95] tracking-tight text-foreground max-w-2xl"
            >
              Find Your Website's <span className="font-display italic">Breaking Point</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="mt-4 text-center text-base md:text-lg text-muted-foreground max-w-[650px] leading-relaxed font-body"
            >
              Send thousands of virtual users to your API or website all at once. Find bottlenecks and fix server slowdowns before your real customers ever notice.
            </motion.p>

            <DashboardPreview onTestStart={setTestId} testId={testId} testStats={testStats} isExpanded={isExpanded || !!testId} onExpanding={() => setIsExpanded(true)} />
            
          </main>
        ) : activeTab === 'about' ? (
          <About />
        ) : activeTab === 'contact' ? (
          <Contact />
        ) : null}
      </div>
    </div>
  );
}
