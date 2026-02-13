import React from 'react';

interface ScopeStatusProps {
    cursorValues: {
        tx: number | null,
        sync: number | null,
        data: number | null,
        valid: number | null,
        stop: number | null,
        parity: number | null,
        error: number | null,
        time: number | null
    } | null;
}

export const ScopeStatus: React.FC<ScopeStatusProps> = ({ cursorValues }) => {
    return (
        <div className="h-8 bg-black/80 border-t border-cyber-dark-gray flex items-center px-4 gap-6 text-xs font-mono shrink-0 overflow-x-auto">
            <div className="flex items-center gap-2">
                <span className="text-gray-500">TIME:</span>
                <span className="text-white min-w-[6ch]">{cursorValues?.time ? cursorValues.time.toFixed(3) : '--'}s</span>
            </div>

            <div className="w-[1px] h-4 bg-cyber-dark-gray/50"></div>

            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#00F0FF] rounded-full shadow-[0_0_5px_#00F0FF]"></div>
                <span className="text-[#00F0FF]">TX:</span>
                <span className="text-white min-w-[2ch]">{cursorValues?.tx !== null && cursorValues?.tx !== undefined ? cursorValues.tx : '--'}</span>
            </div>

        </div>
    );
};
