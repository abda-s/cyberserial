import React from 'react';

interface ScopeControlsProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    onPan: (direction: 'left' | 'right') => void;
}

export const ScopeControls: React.FC<ScopeControlsProps> = ({
    onZoomIn,
    onZoomOut,
    onReset,
    onPan
}) => {
    return (
        <div className="absolute top-4 right-4 z-20 flex gap-2">
            <div className="flex bg-black/80 border border-cyber-dark-gray rounded overflow-hidden backdrop-blur-sm">
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
            <div className="flex bg-black/80 border border-cyber-dark-gray rounded overflow-hidden backdrop-blur-sm">
                <button onClick={() => onPan('left')} className="p-2 hover:bg-cyber-neon-cyan/20 text-cyber-neon-cyan transition-colors" title="Pan Left">←</button>
                <button onClick={() => onPan('right')} className="p-2 hover:bg-cyber-neon-cyan/20 text-cyber-neon-cyan transition-colors border-l border-cyber-dark-gray" title="Pan Right">→</button>
            </div>
        </div>
    );
};
