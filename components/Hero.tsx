import React from "react";
import Cube3D from "./cube/Cube3D";

export default function Hero() {
  return (
    <section className="relative bg-cube-yellow w-full min-h-[819px] flex items-center justify-center py-20 px-margin-mobile md:px-margin-desktop overflow-hidden border-b-4 border-cube-black">
      {/* Grainy texture overlay */}
      <div className="absolute inset-0 bg-grainy pointer-events-none opacity-50 mix-blend-multiply" />
      
      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-gutter items-center">
        {/* Left Side: 3D interactive cube in a comic panel */}
        <div className="relative group perspective-1000 p-4">
          <div className="bg-cube-blue border-4 border-cube-black shadow-comic rounded-DEFAULT p-8 aspect-square flex flex-col items-center justify-center overflow-hidden transition-transform duration-500 ease-out transform group-hover:-translate-y-2 group-hover:rotate-1">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyIiBmaWxsPSIjRkZGRkZGIiBvcGFjaXR5PSIwLjEiLz4KPC9zdmc+')] opacity-20 pointer-events-none" />
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-4">
              <div className="w-full h-[280px] md:h-[350px]">
                <Cube3D width="100%" height={320} autoRotate={true} />
              </div>
              <span className="font-headline-md text-headline-md text-paper-white uppercase text-center opacity-90 border-2 border-dashed border-paper-white/50 p-2 rounded-lg w-3/4">
                Interactive 3D Demo
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Headline and features */}
        <div className="flex flex-col items-start gap-8 px-4 md:px-8">
          <h1 
            className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg uppercase text-paper-white tracking-tighter" 
            style={{ 
              textShadow: "4px 4px 0px #1A1A1A, -2px -2px 0 #1A1A1A, 2px -2px 0 #1A1A1A, -2px 2px 0 #1A1A1A, 2px 2px 0 #1A1A1A" 
            }}
          >
            SOLVE UNDER<br />
            <span className="text-cube-orange">23 MOVES!</span>
          </h1>

          <div className="bg-paper-white border-4 border-cube-black shadow-comic rounded-DEFAULT p-6 w-full max-w-md transform -rotate-1 hover:rotate-0 transition-transform">
            <ul className="font-body-lg text-body-lg text-on-surface space-y-4 flex flex-col">
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-cube-blue" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>
                  arrow_forward_ios
                </span>
                <span className="font-bold border-b-2 border-cube-orange/30 pb-1">
                  OpenCV Face Scanning
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-cube-blue" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>
                  arrow_forward_ios
                </span>
                <span className="font-bold border-b-2 border-cube-orange/30 pb-1">
                  Kociemba Algorithm Engine
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-cube-blue" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>
                  arrow_forward_ios
                </span>
                <span className="font-bold border-b-2 border-cube-orange/30 pb-1">
                  3D Animated Playback
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-4">
            <button className="bg-cube-green text-paper-white border-4 border-cube-black shadow-[6px_6px_0px_0px_#1A1A1A] hover:shadow-[3px_3px_0px_0px_#1A1A1A] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all duration-150 px-10 py-5 rounded-DEFAULT font-headline-md text-headline-md uppercase tracking-wider flex items-center gap-4 group">
              <span>DOWNLOAD APK</span>
              <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform" style={{ fontVariationSettings: "'wght' 700" }}>
                download
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
