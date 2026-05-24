import React, { useRef } from "react";
import CameraView from "./camera/CameraView";
import Cube3D from "./cube/Cube3D";

export default function HowItWorks() {
  const cameraRef = useRef<any>(null);

  return (
    <section className="w-full bg-paper-white border-y-4 border-cube-black py-20 px-margin-mobile md:px-margin-desktop">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-headline-lg text-display-lg-mobile md:text-display-lg text-cube-black text-center mb-16 uppercase tracking-tight">
          HOW IT WORKS
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {/* Card 1: Scan */}
          <div className="bg-paper-white border-[4px] border-cube-black p-panel-padding shadow-[4px_4px_0px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all flex flex-col gap-6">
            <h3 className="font-headline-md text-headline-md text-cube-black uppercase">
              1. SCAN
            </h3>
            <div className="w-full aspect-square bg-cube-red border-[3px] border-cube-black flex items-center justify-center overflow-hidden shadow-[inset_0px_0px_10px_rgba(0,0,0,0.5)]">
              <CameraView size={300} cameraRef={cameraRef} />
            </div>
            <p className="font-body-md text-body-md text-cube-black">
              Point your camera. Our OpenCV integration auto-detects all 6 faces instantly.
            </p>
          </div>

          {/* Card 2: Process */}
          <div className="bg-paper-white border-[4px] border-cube-black p-panel-padding shadow-[4px_4px_0px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all flex flex-col gap-6">
            <h3 className="font-headline-md text-headline-md text-cube-black uppercase">
              2. PROCESS
            </h3>
            <div className="w-full aspect-square bg-cube-black border-[3px] border-cube-black flex flex-col justify-between p-4 font-mono text-xs text-green-400 overflow-hidden select-none">
              <div>
                <p className="text-[#7ffc9c] font-bold">&gt; RUNNING KOCIEMBA AI...</p>
                <p className="text-white/60">Input: UUURRRFFFD...DD</p>
                <p className="text-white/40">Searching depth 10... found</p>
                <p className="text-white/60">G1 -&gt; G2 phase check... OK</p>
                <p className="text-white/40">Searching depth 20... found</p>
                <p className="text-white font-bold">Solution found (21 moves)!</p>
                <p className="text-[#FF5800] font-bold">U2 F2 R2 B2 D2 F2 L2 ...</p>
              </div>
              <div className="animate-pulse text-right text-[#7ffc9c] font-bold">
                [READY]_
              </div>
            </div>
            <p className="font-body-md text-body-md text-cube-black">
              The Kociemba engine crunches the state to find the optimal 23-move solution.
            </p>
          </div>

          {/* Card 3: Solve */}
          <div className="bg-paper-white border-[4px] border-cube-black p-panel-padding shadow-[4px_4px_0px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all flex flex-col gap-6">
            <h3 className="font-headline-md text-headline-md text-cube-black uppercase">
              3. SOLVE
            </h3>
            <div className="w-full aspect-square bg-cube-blue border-[3px] border-cube-black flex items-center justify-center overflow-hidden">
              <Cube3D width="100%" height={300} autoRotate={true} />
            </div>
            <p className="font-body-md text-body-md text-cube-black">
              Follow the gamified 3D animated playback step-by-step to crush your solve.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
