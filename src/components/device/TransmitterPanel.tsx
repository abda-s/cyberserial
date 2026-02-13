import React, { useState, useEffect } from 'react';
import { GlitchButton } from '../GlitchButton';
import { getDisplayBaud } from '../../utils/serialUtils';

interface TransmitterPanelProps {
    onTransmit: (char: string) => void;
    onConfigure: (config: { txBaud?: number; txConfig?: any }) => void;
    onStart: () => void;
    isRunning: boolean;
    txStatus: 'idle' | 'sending' | 'sent';
    setTxStatus: (status: 'idle' | 'sending' | 'sent') => void;
}

export const TransmitterPanel: React.FC<TransmitterPanelProps> = ({
    onTransmit,
    onConfigure,
    onStart,
    isRunning,
    txStatus,
    setTxStatus
}) => {
    const [txBaud, setTxBaud] = useState(6); // Default to 9600 (Index 6)
    const [txParity, setTxParity] = useState<'none' | 'even' | 'odd'>('none');
    const [txStopBits, setTxStopBits] = useState<number>(1);
    const [txIdleBits, setTxIdleBits] = useState<number>(0);
    const [inputData, setInputData] = useState('');

    // Sync initial configuration on mount
    useEffect(() => {
        onConfigure({
            txBaud: getDisplayBaud(6),
            txConfig: { parity: 'none', stopBits: 1, idleBits: 0 }
        });
    }, []); // Run once on mount

    const handleTxBaudChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        setTxBaud(val);
        onConfigure({ txBaud: getDisplayBaud(val) });
    };

    const handleTxParityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value as 'none' | 'even' | 'odd';
        setTxParity(val);
        onConfigure({ txConfig: { parity: val } });
    };

    const handleTxStopBitsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = Number(e.target.value);
        setTxStopBits(val);
        onConfigure({ txConfig: { stopBits: val } });
    };

    const handleTxIdleBitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        setTxIdleBits(val);
        onConfigure({ txConfig: { idleBits: val } });
    };

    const handleSend = () => {
        if (!inputData) return;

        setTxStatus('sending');

        // UX: Auto-start if not running
        if (!isRunning) {
            onStart();
        }

        inputData.split('').forEach(char => {
            onTransmit(char);
        });
    };

    // Effect 1: Handle completion (sending -> sent)
    useEffect(() => {
        if (!isRunning && txStatus === 'sending') {
            setTxStatus('sent');
        }
    }, [isRunning, txStatus, setTxStatus]);

    // Effect 2: Handle success message duration (sent -> idle)
    useEffect(() => {
        if (txStatus === 'sent') {
            const baudRate = getDisplayBaud(txBaud);
            const bitTimeMs = (1 / baudRate) * 1000;
            const delay = bitTimeMs * 3;

            const timer = setTimeout(() => {
                setTxStatus('idle');
                setInputData('');
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [txStatus, setTxStatus, txBaud]);

    return (
        <div className="bg-black/40 border border-cyber-dark-gray p-4 relative overflow-y-auto group h-full">
            <div className="absolute top-0 right-0 p-1 bg-cyber-neon-cyan text-black text-[10px] font-bold">TX</div>
            <h3 className="text-cyber-neon-cyan text-sm mb-4 uppercase tracking-widest">Transmitter</h3>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Baud Rate</span>
                            <span className="text-cyber-neon-cyan">{getDisplayBaud(txBaud)} Bd</span>
                        </div>
                        <input
                            type="range"
                            min="1" max="11" step="1"
                            value={txBaud}
                            onChange={handleTxBaudChange}
                            className="w-full accent-cyber-neon-cyan h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Parity</span>
                        </div>
                        <select
                            value={txParity}
                            onChange={handleTxParityChange}
                            className="w-full bg-black border border-cyber-dark-gray text-cyber-neon-cyan text-xs p-1 focus:outline-none uppercase"
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
                            value={txStopBits}
                            onChange={handleTxStopBitsChange}
                            className="w-full bg-black border border-cyber-dark-gray text-cyber-neon-cyan text-xs p-1 focus:outline-none uppercase"
                        >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Idle / Guard Bits</span>
                            <span className="text-cyber-neon-cyan">{txIdleBits} bits</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="10" step="1"
                            value={txIdleBits}
                            onChange={handleTxIdleBitsChange}
                            className="w-full accent-cyber-neon-cyan h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>

                <div className="flex gap-2 relative mt-4">
                    <input
                        type="text"
                        value={inputData}
                        onChange={(e) => setInputData(e.target.value)}
                        placeholder="DATA..."
                        className={`flex-1 bg-black border border-cyber-dark-gray text-cyber-neon-cyan px-2 py-1 text-sm focus:outline-none focus:border-cyber-neon-cyan transition-colors ${txStatus !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        maxLength={8}
                        disabled={txStatus !== 'idle'}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && txStatus === 'idle') handleSend();
                        }}
                    />
                    <GlitchButton
                        onClick={handleSend}
                        variant={txStatus === 'sent' ? 'green' : 'cyan'}
                        className={`px-4 py-1 text-xs w-24 flex justify-center ${txStatus === 'sending' ? 'animate-pulse' : ''}`}
                        disabled={txStatus !== 'idle'}
                    >
                        {txStatus === 'idle' ? 'SEND' : txStatus === 'sending' ? 'TX...' : 'SENT'}
                    </GlitchButton>
                </div>
            </div>
        </div>
    );
};
