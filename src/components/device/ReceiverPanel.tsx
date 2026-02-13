import React, { useState, useEffect, useRef } from 'react';
import { getDisplayBaud } from '../../utils/serialUtils';

interface ReceiverPanelProps {
    onConfigure: (config: { rxBaud?: number; rxConfig?: any }) => void;
    rxLog: { char: string; error: boolean }[];
    rxError: string | null;
}

export const ReceiverPanel: React.FC<ReceiverPanelProps> = ({
    onConfigure,
    rxLog,
    rxError
}) => {
    const [rxBaud, setRxBaud] = useState(6); // Default to 9600 (Index 6)
    const [rxParity, setRxParity] = useState<'none' | 'even' | 'odd'>('none');
    const [rxStopBits, setRxStopBits] = useState<number>(1);
    const logRef = useRef<HTMLDivElement>(null);

    // Auto-scroll log
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [rxLog]);

    // Sync initial configuration on mount
    useEffect(() => {
        onConfigure({
            rxBaud: getDisplayBaud(6),
            rxConfig: { parity: 'none', stopBits: 1 }
        });
    }, []); // Run once on mount

    const handleRxBaudChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        setRxBaud(val);
        onConfigure({ rxBaud: getDisplayBaud(val) });
    };

    const handleRxParityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value as 'none' | 'even' | 'odd';
        setRxParity(val);
        onConfigure({ rxConfig: { parity: val } });
    };

    const handleRxStopBitsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = Number(e.target.value);
        setRxStopBits(val);
        onConfigure({ rxConfig: { stopBits: val } });
    };

    return (
        <div className="bg-black/40 border border-cyber-dark-gray p-4 relative overflow-y-auto h-full">
            <div className="absolute top-0 right-0 p-1 bg-cyber-neon-pink text-black text-[10px] font-bold">RX</div>
            <h3 className="text-cyber-neon-pink text-sm mb-4 uppercase tracking-widest">Receiver</h3>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Baud Rate</span>
                            <span className="text-cyber-neon-pink">{getDisplayBaud(rxBaud)} Bd</span>
                        </div>
                        <input
                            type="range"
                            min="1" max="11" step="1"
                            value={rxBaud}
                            onChange={handleRxBaudChange}
                            className="w-full accent-cyber-neon-pink h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Parity</span>
                        </div>
                        <select
                            value={rxParity}
                            onChange={handleRxParityChange}
                            className="w-full bg-black border border-cyber-dark-gray text-cyber-neon-pink text-xs p-1 focus:outline-none uppercase"
                        >
                            <option value="none">None</option>
                            <option value="even">Even</option>
                            <option value="odd">Odd</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Stop Bits</span>
                        </div>
                        <select
                            value={rxStopBits}
                            onChange={handleRxStopBitsChange}
                            className="w-full bg-black border border-cyber-dark-gray text-cyber-neon-pink text-xs p-1 focus:outline-none uppercase"
                        >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                        </select>
                    </div>
                </div>

                <div className="p-2 border border-cyber-dark-gray/50 bg-black/50 h-16 overflow-hidden rounded relative">
                    <div className="text-[10px] text-gray-500 mb-1 flex justify-between">
                        <span>DECODED OUTPUT</span>
                        <span className="text-[9px] text-gray-600">ASCII</span>
                    </div>
                    <div ref={logRef} className="font-mono text-xs text-cyber-neon-green text-sm overflow-y-auto h-10 w-full break-all whitespace-pre-wrap leading-tight">
                        {rxLog.length === 0 ? (
                            <span className="opacity-50 italic">Waiting for data...</span>
                        ) : (
                            rxLog.map((item, i) => (
                                <span key={i} className={item.error ? "text-[#FF003C] font-bold" : ""}>
                                    {item.char}
                                </span>
                            ))
                        )}
                        <span className="animate-pulse inline-block w-1.5 h-3 bg-cyber-neon-green ml-0.5 align-middle"></span>
                    </div>

                    {/* Error Overlay */}
                    {rxError && (
                        <div className="absolute inset-0 bg-red-900/90 flex items-center justify-center animate-pulse z-10 border border-red-500">
                            <span className="text-red-100 font-bold text-xs tracking-widest uppercase">{rxError.replace('_', ' ')}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
