import React from 'react';
import { DEFAULT_SPEED } from '../../utils/serialUtils';

interface ScopeControlsProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    onSpeedChange?: (speed: number) => void;
    currentSpeed?: number;
}

export const ScopeControls: React.FC<ScopeControlsProps> = ({
    onZoomIn,
    onZoomOut,
    onReset,
    onSpeedChange,
    currentSpeed = DEFAULT_SPEED
}) => {
    return (
        <div className="absolute top-4 right-4 z-20 flex gap-2">
            <div className="flex bg-black/80 border border-cyber-dark-gray overflow-hidden backdrop-blur-sm">
                <button onClick={onZoomIn} className="p-2 hover:bg-cyber-neon-cyan/20 text-cyber-neon-cyan transition-colors" title="Zoom In">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                </button>
                <button onClick={onZoomOut} className="p-2 hover:bg-cyber-neon-cyan/20 text-cyber-neon-cyan transition-colors border-l border-cyber-dark-gray" title="Zoom Out">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                </button>
                <button onClick={onReset} className="p-2 hover:bg-cyber-neon-cyan/20 text-cyber-neon-cyan transition-colors border-l border-cyber-dark-gray text-xs font-bold px-3" title="Reset View">
                    RESET
                </button>
            </div>

            {/* Speed Controls */}
            <div className="flex bg-black/80 border border-cyber-dark-gray  overflow-hidden backdrop-blur-sm">
                <button onClick={() => onSpeedChange?.(1)} className={`px-2 py-1 text-xs hover:bg-cyber-neon-cyan/20 transition-colors ${currentSpeed === 1 ? 'text-cyber-neon-cyan font-bold bg-cyber-neon-cyan/10' : 'text-gray-400'}`} title="Real-time">1x</button>
                <button onClick={() => onSpeedChange?.(0.01)} className={`px-2 py-1 text-xs border-l border-cyber-dark-gray hover:bg-cyber-neon-cyan/20 transition-colors ${currentSpeed === 0.01 ? 'text-cyber-neon-cyan font-bold bg-cyber-neon-cyan/10' : 'text-gray-400'}`} title="Slow Motion">0.01x</button>
                <button onClick={() => onSpeedChange?.(0.001)} className={`px-2 py-1 text-xs border-l border-cyber-dark-gray hover:bg-cyber-neon-cyan/20 transition-colors ${currentSpeed === 0.001 ? 'text-cyber-neon-cyan font-bold bg-cyber-neon-cyan/10' : 'text-gray-400'}`} title="Ultra Slow">0.001x</button>
            </div>

        </div>
    );
};
