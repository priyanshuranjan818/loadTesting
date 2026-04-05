import React from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

const GithubIcon = ({size=20, className=""}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4"></path></svg>
);
const LinkedinIcon = ({size=20, className=""}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
);
const InstagramIcon = ({size=20, className=""}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);
const TwitterIcon = ({size=20, className=""}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
);

const Contact = () => {
  return (
    <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col items-center justify-center pt-8 px-6 pb-24 relative h-full">

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-6xl p-3 md:p-4 relative z-10 rounded-[3rem]"
        style={{
          background: 'rgba(255, 255, 255, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: 'var(--shadow-dashboard)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <div className="w-full h-full bg-background rounded-[2.5rem] p-8 md:p-14 shadow-sm border border-border grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center overflow-hidden">
        
        {/* Left Side: Contact Info & Socials */}
        <div className="flex flex-col text-left relative z-10">
          <div className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-extrabold tracking-widest uppercase mb-6 w-max shadow-sm border border-primary/10">Get in Touch</div>
          <h1 className="font-display text-5xl md:text-[5rem] text-foreground mb-6 leading-none tracking-tight">
            Let's Talk.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-body mb-12 max-w-md font-medium">
            Whether you have a massive launch coming up, a technical question about the protocol, or just want to connect—reach out below.
          </p>

          <div className="flex flex-col gap-5">
            <h4 className="text-xs font-bold text-foreground/70 tracking-widest uppercase">Connect Directly</h4>
            <div className="flex items-center gap-4">
              <a href="#" className="p-3.5 bg-white backdrop-blur-md rounded-2xl border border-border/40 hover:bg-white hover:text-foreground hover:shadow-md transition-all shadow-sm text-foreground group">
                <GithubIcon size={20} className="group-hover:scale-110 transition-transform" />
              </a>
              <a href="#" className="p-3.5 bg-white backdrop-blur-md rounded-2xl border border-border/40 hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-all shadow-sm text-foreground group">
                <LinkedinIcon size={20} className="group-hover:scale-110 transition-transform" />
              </a>
              <a href="#" className="p-3.5 bg-white backdrop-blur-md rounded-2xl border border-border/40 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white hover:border-transparent transition-all shadow-sm text-foreground group">
                <InstagramIcon size={20} className="group-hover:scale-110 transition-transform" />
              </a>
              <a href="#" className="p-3.5 bg-white backdrop-blur-md rounded-2xl border border-border/40 hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2] transition-all shadow-sm text-foreground group">
                <TwitterIcon size={20} className="group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Side: Contact Form */}
        <div className="w-full relative z-10">
          <form className="w-full flex flex-col gap-5" onSubmit={e => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground mb-2 tracking-widest uppercase">First Name</label>
                <input 
                  type="text" 
                  placeholder="John" 
                  className="w-full bg-transparent border border-foreground/20 hover:border-foreground/40 px-4 py-3.5 rounded-xl focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all text-sm text-foreground placeholder:text-muted-foreground/40"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground mb-2 tracking-widest uppercase">Last Name</label>
                <input 
                  type="text" 
                  placeholder="Doe" 
                  className="w-full bg-transparent border border-foreground/20 hover:border-foreground/40 px-4 py-3.5 rounded-xl focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all text-sm text-foreground placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground mb-2 tracking-widest uppercase">Email Address</label>
              <input 
                type="email" 
                placeholder="you@company.com" 
                required
                className="w-full bg-transparent border border-foreground/20 hover:border-foreground/40 px-4 py-3.5 rounded-xl focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all text-sm text-foreground placeholder:text-muted-foreground/40"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground mb-2 tracking-widest uppercase">Project Details</label>
              <textarea 
                rows={4}
                required
                placeholder="Tell us about what you're building..." 
                className="w-full bg-transparent border border-foreground/20 hover:border-foreground/40 px-4 py-3.5 rounded-xl focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all text-sm resize-none text-foreground placeholder:text-muted-foreground/40"
              />
            </div>
            
            <button type="submit" className="mt-3 bg-foreground text-background font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all hover:bg-foreground/90 active:scale-[0.98] w-full text-sm cursor-pointer border border-transparent group">
              Send Message
              <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
        </div>
      </motion.div>
    </main>
  );
};

export default Contact;
