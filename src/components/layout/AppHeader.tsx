import React from 'react';
import uPlot from 'uplot';

interface AppHeaderProps {
    isRunning: boolean;
    data: uPlot.AlignedData;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ isRunning, data }) => {
    return (
        <header className="h-16 border-b border-cyber-dark-gray flex items-center px-6 justify-between bg-black/50 backdrop-blur-sm z-40 shrink-0">
            <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full shadow-[0_0_8px_#00F0FF] transition-all duration-300 ${isRunning ? 'bg-cyber-neon-green animate-pulse shadow-[0_0_8px_#39FF14]' : 'bg-cyber-neon-pink'}`}></div>
                <h1 className="text-2xl font-display tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyber-neon-cyan to-white drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]">
                    CYBER<span className="text-white">SERIAL</span>
                </h1>
            </div>
            <div className="text-xs text-cyber-neon-green font-mono flex gap-4">
                <span>BUFFER: {data[0]?.length || 0} PTS</span>
                <span>STATUS: {isRunning ? 'RUNNING' : 'HALTED'}</span>
            </div>
        </header>
    );
};
