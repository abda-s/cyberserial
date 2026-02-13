import React from 'react';
import uPlot from 'uplot';
import { ScopeGraph } from './ScopeGraph';
import type { ScopeGraphHandle } from './ScopeGraph';
import { ScopeControls } from './graph/ScopeControls';
import { SignalLegend } from './layout/SignalLegend';

interface ScopeDisplayProps {
    data: uPlot.AlignedData;
    isRunning: boolean;
    scopeRef: React.RefObject<ScopeGraphHandle | null>;
    onSpeedChange: (speed: number) => void;
    currentSpeed: number;
    txBaud?: number;
}

export const ScopeDisplay: React.FC<ScopeDisplayProps> = ({
    data,
    isRunning,
    scopeRef,
    onSpeedChange,
    currentSpeed,
    txBaud
}) => {
    return (
        <section className="flex-1 relative bg-cyber-dark-gray/30 border border-cyber-dark-gray overflow-hidden shadow-inner flex flex-col min-h-0">
            <div className="flex-1 relative w-full h-full">
                <ScopeGraph ref={scopeRef} data={data} txBaud={txBaud} />
            </div>

            {/* Integrated Message Overlay if stopped */}
            {!isRunning && data[0].length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-cyber-neon-cyan opacity-50 animate-pulse">[ SYSTEM READY - AWAITING SIGNAL ]</div>
                </div>
            )}

            <ScopeControls
                onZoomIn={() => scopeRef.current?.zoomIn()}
                onZoomOut={() => scopeRef.current?.zoomOut()}
                onReset={() => scopeRef.current?.reset()}
                onSpeedChange={onSpeedChange}
                currentSpeed={currentSpeed}
            />

            <SignalLegend />
        </section>
    );
};
