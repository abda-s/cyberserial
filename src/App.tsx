import { useRef, useState } from 'react';
import { useSimulation } from './hooks/useSimulation';
import type { ScopeGraphHandle } from './components/ScopeGraph';
import { DevicePanel } from './components/DevicePanel';
import { AppHeader } from './components/layout/AppHeader';
import { ScopeDisplay } from './components/ScopeDisplay';
import { ControlPanel } from './components/layout/ControlPanel';
import { DEFAULT_SPEED } from './utils/serialUtils';

function App() {
  const { data, start, isRunning, transmit, configure, setAutoMode, setSpeed, rxLog, rxError, txBaud } = useSimulation();
  const [currentSpeed, setCurrentSpeed] = useState(DEFAULT_SPEED);
  const scopeRef = useRef<ScopeGraphHandle>(null);

  const handleTransmit = (char: string | number) => {
    scopeRef.current?.scrollToEnd();
    transmit(char);
  };

  const handleAutoMode = (enabled: boolean) => {
    if (enabled) scopeRef.current?.scrollToEnd();
    setAutoMode(enabled);
  };

  const handleSpeedChange = (speed: number) => {
    setSpeed(speed);
    setCurrentSpeed(speed);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-cyber-black text-white font-mono flex flex-col">
      {/* Scanline Overlay */}
      <div className="pointer-events-none absolute inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-60" />

      <AppHeader isRunning={isRunning} data={data} />

      {/* Main Content Area */}
      <main className="flex-1 flex relative overflow-hidden">

        {/* Left Column: Visualization & Device Panel */}
        <div className="flex-1 flex flex-col min-w-0 m-4 gap-4">

          <ScopeDisplay
            data={data}
            isRunning={isRunning}
            scopeRef={scopeRef}
            onSpeedChange={handleSpeedChange}
            currentSpeed={currentSpeed}
            txBaud={txBaud} />

          {/* Device Control Panel */}
          <section className="h-75 shrink-0">
            <DevicePanel
              onTransmit={handleTransmit}
              onConfigure={configure}
              onAutoMode={handleAutoMode}
              isRunning={isRunning}
              onStart={start}
              rxLog={rxLog}
              rxError={rxError}
            />
          </section>
        </div>

        <ControlPanel />
      </main>
    </div>
  );
}

export default App;
