import React from 'react';

export const SignalLegend: React.FC = () => {
    return (
        <div className="absolute top-4 left-4 p-3 bg-black/80 border border-cyber-dark-gray/50 backdrop-blur-sm rounded text-xs font-mono z-10 pointer-events-none opacity-80 hover:opacity-100 transition-opacity">
            <div className="uppercase text-gray-500 mb-2 tracking-wider">Signal Decoder</div>
            <div className="grid grid-cols-[12px_1fr] gap-x-3 gap-y-1 items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#39FF14] shadow-[0_0_5px_#39FF14]"></div>
                <span className="text-cyber-neon-green">START / SYNC</span>

                <div className="w-2.5 h-2.5 rounded-full bg-[#FFFF00] shadow-[0_0_5px_#FFFF00]"></div>
                <span className="text-[#FFFF00]">DATA / SAMPLE</span>

                <div className="w-2.5 h-2.5 rounded-full bg-[#FF003C] shadow-[0_0_5px_#FF003C]"></div>
                <span className="text-[#FF003C]">ERROR</span>

                <div className="w-2.5 h-2.5 rounded-full bg-[#2E59FF] shadow-[0_0_5px_#2E59FF]"></div>
                <span className="text-cyber-neon-cyan" style={{ color: '#2E59FF' }}>PARITY BIT</span>

                <div className="w-2.5 h-2.5 rounded-full bg-[#BD00FF] shadow-[0_0_5px_#BD00FF]"></div>
                <span className="text-cyber-neon-cyan" style={{ color: '#BD00FF' }}>STOP BIT</span>

                <div className="w-full h-[2px] bg-cyber-neon-cyan shadow-[0_0_5px_#00F0FF] mt-1"></div>
                <span className="text-cyber-neon-cyan mt-1">SIGNAL LINE</span>
            </div>
        </div>
    );
};
