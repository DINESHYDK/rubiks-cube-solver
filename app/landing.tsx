import React from "react";
import { useRouter } from "expo-router";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import CTA from "@/components/CTA";

export default function LandingPage() {
  const router = useRouter();

  const handleGetStarted = () => {
    // Navigate to the main tabs app
    router.replace("/(tabs)");
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md text-body-md overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      {/* Top AppBar */}
      <header className="flex justify-between items-center w-full px-margin-desktop py-4 bg-background border-b-4 border-cube-black shadow-[4px_4px_0px_0px_#1A1A1A] top-0 sticky z-50">
        <div className="font-headline-lg text-headline-lg uppercase italic text-cube-black tracking-tight cursor-pointer" onClick={handleGetStarted}>
          CUBE_SOLVER
        </div>
        
        <nav className="hidden md:flex items-center gap-gutter">
          <a 
            className="font-label-caps text-label-caps text-cube-orange font-bold underline decoration-4 underline-offset-4 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none" 
            href="#"
            onClick={(e) => { e.preventDefault(); handleGetStarted(); }}
          >
            SOLVER
          </a>
          <a 
            className="font-label-caps text-label-caps text-cube-black hover:text-cube-blue hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none" 
            href="#"
            onClick={(e) => { e.preventDefault(); router.push("/tutorial" as any); }}
          >
            DEMO
          </a>
          <a 
            className="font-label-caps text-label-caps text-cube-black hover:text-cube-blue hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none" 
            href="https://github.com" 
            target="_blank" 
            rel="noreferrer"
          >
            TUTORIALS
          </a>
        </nav>

        <button 
          onClick={handleGetStarted}
          className="hidden md:block font-label-caps text-label-caps px-6 py-3 bg-cube-black text-paper-white border-2 border-cube-black shadow-comic hover:shadow-comic-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none uppercase cursor-pointer"
        >
          GET STARTED
        </button>
        
        <button 
          onClick={handleGetStarted}
          className="md:hidden flex items-center justify-center p-2 border-2 border-cube-black shadow-comic hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-comic-hover active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'wght' 700" }}>menu</span>
        </button>
      </header>

      {/* Main Content Sections */}
      <main className="flex-grow">
        <Hero />
        <HowItWorks />
        <CTA />
      </main>

      {/* Footer */}
      <footer className="flex flex-col md:flex-row justify-between items-center w-full px-margin-desktop py-12 gap-gutter bg-cube-black border-t-4 border-cube-black">
        <div className="font-headline-md text-headline-md text-cube-orange italic tracking-tight cursor-pointer" onClick={handleGetStarted}>
          CUBE_SOLVER
        </div>
        
        <nav className="flex flex-wrap justify-center gap-6">
          <a className="font-label-caps text-label-caps text-paper-white/80 hover:text-cube-orange transition-colors hover:scale-105" href="#">PRIVACY</a>
          <a className="font-label-caps text-label-caps text-paper-white/80 hover:text-cube-orange transition-colors hover:scale-105" href="#">TERMS</a>
          <a className="font-label-caps text-label-caps text-paper-white/80 hover:text-cube-orange transition-colors hover:scale-105" href="#">GITHUB</a>
          <a className="font-label-caps text-label-caps text-paper-white/80 hover:text-cube-orange transition-colors hover:scale-105" href="#">DISCORD</a>
        </nav>
        
        <div className="font-label-caps text-label-caps text-paper-white/60 text-center md:text-right">
          © 2026 CUBE SOLVER AI.<br className="md:hidden"/> ALL RIGHTS RESERVED. NO CHEATING!
        </div>
      </footer>
    </div>
  );
}
