import React from 'react';
import { motion } from 'framer-motion';

const About = () => {
  return (
    <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col items-center justify-center pt-8 px-6 pb-24 relative h-full">

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full text-center mb-10"
      >
        <h1 className="font-display text-5xl md:text-6xl text-foreground mb-4">
          What does this tool do?
        </h1>
      </motion.div>

      {/* Bento Grid layout */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 relative z-10">
        
        {/* Large Hero Box */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="md:col-span-2 bg-gradient-to-br from-white/95 to-white/70 backdrop-blur-xl border border-white p-8 md:p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-center items-start"
        >
          <div className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6">The Problem</div>
          <h3 className="text-3xl md:text-4xl font-display text-foreground mb-4 leading-tight">Like a party with one small door.</h3>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-xl">
            If a thousand people try to enter a building through one door simultaneously, the door breaks. That is exactly what happens to websites. We find that breaking point.
          </p>
        </motion.div>

        {/* Small Box 1 */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="md:col-span-1 bg-white/80 backdrop-blur-xl border border-white/60 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between"
        >
          <div className="text-5xl mb-6">💥</div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">We break it on purpose</h3>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              We send a massive virtual mob of fake users to your site to see exactly when and how it crashes.
            </p>
          </div>
        </motion.div>

        {/* Small Box 2 */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="md:col-span-1 bg-white/90 backdrop-blur-xl border border-white/60 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between"
        >
          <div className="text-5xl mb-6">☁️</div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">How we do it</h3>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              We borrow massive Amazon supercomputers for a few seconds to unleash the traffic.
            </p>
          </div>
        </motion.div>

        {/* Wide Bottom Box */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="md:col-span-2 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-center border border-white/60"
        >
          <div className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase w-max mb-6">The Solution</div>
          <h3 className="text-3xl md:text-4xl font-display mb-4 leading-tight text-foreground">Watch the live results.</h3>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-xl">
            You watch the dashboard on the home page like a heart monitor. You'll see the exact moment your server starts rejecting people so you can fix it.
          </p>
        </motion.div>

      </div>
    </main>
  );
};

export default About;
