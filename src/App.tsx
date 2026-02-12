import { ScopeGraph } from './components/ScopeGraph';
import type { ScopeGraphHandle } from './components/ScopeGraph';
import { useSimulation } from './hooks/useSimulation';
import { DevicePanel } from './components/DevicePanel';
import { useRef } from 'react';

function App() {
  const { data, start, isRunning, transmit, configure, setAutoMode, rxLog, rxError } = useSimulation();
  const scopeRef = useRef<ScopeGraphHandle>(null);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-cyber-black text-white font-mono flex flex-col">
      {/* Scanline Overlay */}
      <div className="pointer-events-none absolute inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-60" />

      {/* Header */}
      <header className="h-16 border-b border-cyber-dark-gray flex items-center px-6 justify-between bg-black/50 backdrop-blur-sm z-40 shrink-0">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full shadow-[0_0_8px_#00F0FF] transition-all duration-300 ${isRunning ? 'bg-cyber-neon-green animate-pulse shadow-[0_0_8px_#39FF14]' : 'bg-cyber-neon-pink'}`}></div>
          <h1 className="text-2xl font-display tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyber-neon-cyan to-white drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]">
            CYBER<span className="text-white">SERIAL</span>
          </h1>
        </div>
        <div className="text-xs text-cyber-neon-green font-mono flex gap-4">
          <span>BUFFER: {data[0].length} PTS</span>
          <span>STATUS: {isRunning ? 'RUNNING' : 'HALTED'}</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex relative overflow-hidden">

        {/* Left Column: Visualization & Device Panel */}
        <div className="flex-1 flex flex-col min-w-0 m-4 gap-4">
          {/* Simulation Viewport */}
          <section className="flex-1 relative bg-cyber-dark-gray/30 border border-cyber-dark-gray rounded-lg overflow-hidden shadow-inner flex flex-col min-h-0">
            <div className="flex-1 relative w-full h-full">
              <ScopeGraph ref={scopeRef} data={data} />
            </div>

            {/* Integrated Message Overlay if stopped */}
            {/* Integrated Message Overlay if stopped */}
            {!isRunning && data[0].length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-cyber-neon-cyan opacity-50 animate-pulse">[ SYSTEM READY - AWAITING SIGNAL ]</div>
              </div>
            )}

            {/* Navigation Controls Overlay */}
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              <div className="flex bg-black/80 border border-cyber-dark-gray rounded overflow-hidden backdrop-blur-sm">
                <button onClick={() => scopeRef.current?.zoomIn()} className="p-2 hover:bg-cyber-neon-cyan/20 text-cyber-neon-cyan transition-colors" title="Zoom In">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                </button>
                <button onClick={() => scopeRef.current?.zoomOut()} className="p-2 hover:bg-cyber-neon-cyan/20 text-cyber-neon-cyan transition-colors border-l border-cyber-dark-gray" title="Zoom Out">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                </button>
                <button onClick={() => scopeRef.current?.reset()} className="p-2 hover:bg-cyber-neon-cyan/20 text-cyber-neon-cyan transition-colors border-l border-cyber-dark-gray text-xs font-bold px-3" title="Reset View">
                  RESET
                </button>
              </div>
              <div className="flex bg-black/80 border border-cyber-dark-gray rounded overflow-hidden backdrop-blur-sm">
                <button onClick={() => scopeRef.current?.pan('left')} className="p-2 hover:bg-cyber-neon-cyan/20 text-cyber-neon-cyan transition-colors" title="Pan Left">←</button>
                <button onClick={() => scopeRef.current?.pan('right')} className="p-2 hover:bg-cyber-neon-cyan/20 text-cyber-neon-cyan transition-colors border-l border-cyber-dark-gray" title="Pan Right">→</button>
              </div>
            </div>

            {/* Signal Legend Overlay - Moved to bottom right or left? kept top right but pushed down? 
                Actually user said "top of the scope on a corner". 
                I'll put Nav top-right and Legend top-left or bottom-right.
                Legend is currently top-right. Let's move Legend to bottom-right or top-left.
                Top-Left seems open.
            */}
            <div className="absolute top-4 left-4 p-3 bg-black/80 border border-cyber-dark-gray/50 backdrop-blur-sm rounded text-xs font-mono z-10 pointer-events-none opacity-80 hover:opacity-100 transition-opacity">
              <div className="uppercase text-gray-500 mb-2 tracking-wider">Signal Decoder</div>
              <div className="grid grid-cols-[12px_1fr] gap-x-3 gap-y-1 items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF003C] shadow-[0_0_5px_#FF003C]"></div>
                <span className="text-cyber-neon-pink">SYNC / ERR</span>

                <div className="w-2.5 h-2.5 rounded-full bg-[#FCEE0A] shadow-[0_0_5px_#FCEE0A]"></div>
                <span className="text-cyber-neon-yellow">DATA BIT</span>

                <div className="w-2.5 h-2.5 rounded-full bg-[#39FF14] shadow-[0_0_5px_#39FF14]"></div>
                <span className="text-cyber-neon-green">SAMPLE POINT</span>

                <div className="w-2.5 h-2.5 rounded-full bg-[#BD00FF] shadow-[0_0_5px_#BD00FF]"></div>
                <span className="text-cyber-neon-cyan" style={{ color: '#BD00FF' }}>STOP BIT</span>

                <div className="w-full h-[2px] bg-cyber-neon-cyan shadow-[0_0_5px_#00F0FF] mt-1"></div>
                <span className="text-cyber-neon-cyan mt-1">SIGNAL LINE</span>
              </div>
            </div>
          </section>

          {/* Device Control Panel (New) */}
          <section className="h-64 shrink-0">
            <DevicePanel
              onTransmit={transmit}
              onConfigure={configure}
              onAutoMode={setAutoMode}
              isRunning={isRunning}
              onStart={start}
              rxLog={rxLog}
              rxError={rxError}
            />
          </section>
        </div>

        {/* Right Control Panel */}
        <aside className="w-80 border-l border-cyber-dark-gray bg-black/80 backdrop-blur-md p-4 z-30 flex flex-col gap-4 shrink-0">
          <h2 className="text-cyber-neon-cyan text-sm uppercase tracking-widest border-b border-cyber-neon-cyan/30 pb-2 mb-4">Control Plane</h2>
          <div className="flex-1 flex flex-col gap-4">
            {/* Navigation Controls */}

          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
