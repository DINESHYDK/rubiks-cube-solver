import React from "react";

export default function CTA() {
  return (
    <section className="w-full bg-cube-orange border-t-4 border-cube-black py-24 px-margin-mobile md:px-margin-desktop flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative Halftone Pattern Background Overlay */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ 
          backgroundImage: "radial-gradient(#1A1A1A 20%, transparent 20%)", 
          backgroundSize: "16px 16px" 
        }} 
      />
      
      {/* Speech Bubble */}
      <div className="relative z-10 bg-paper-white border-4 border-cube-black shadow-[4px_4px_0px_0px_#1A1A1A] px-6 py-3 mb-8 transform -rotate-2">
        <p className="font-headline-md text-headline-md text-cube-black uppercase">
          EASIEST SOLVE EVER!
        </p>
        {/* Speech bubble tail */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-cube-black" />
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-paper-white" />
      </div>

      {/* Headline */}
      <h2 
        className="relative z-10 font-display-lg text-display-lg md:text-display-lg text-paper-white text-center uppercase mb-12 transform rotate-1" 
        style={{ 
          textShadow: "4px 4px 0px #1A1A1A, -1px -1px 0 #1A1A1A, 1px -1px 0 #1A1A1A, -1px 1px 0 #1A1A1A, 1px 1px 0 #1A1A1A" 
        }}
      >
        READY TO CRUSH YOUR PR?
      </h2>

      {/* Primary Button */}
      <a 
        className="relative z-10 group inline-flex items-center justify-center bg-[#7ffc9c] border-4 border-cube-black px-12 py-6 shadow-[8px_8px_0px_0px_#1A1A1A] transition-all hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#1A1A1A] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none" 
        href="#"
      >
        <span className="font-headline-lg text-headline-lg text-cube-black uppercase tracking-wider flex items-center gap-4">
          DOWNLOAD THE APK NOW
          <span className="material-symbols-outlined text-[40px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
            download
          </span>
        </span>
      </a>
    </section>
  );
}
