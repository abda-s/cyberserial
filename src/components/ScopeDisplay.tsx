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
}

export const ScopeDisplay: React.FC<ScopeDisplayProps> = ({
    data,
    isRunning,
    scopeRef
}) => {
    return (
        <section className="flex-1 relative bg-cyber-dark-gray/30 border border-cyber-dark-gray overflow-hidden shadow-inner flex flex-col min-h-0">
            <div className="flex-1 relative w-full h-full">
                <ScopeGraph ref={scopeRef} data={data} />
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
                onPan={(dir) => scopeRef.current?.pan(dir)}
            />

            <SignalLegend />
        </section>
    );
};
