import React, { useState, useEffect } from 'react';
import { GlitchButton } from './GlitchButton';

interface DevicePanelProps {
    onTransmit: (char: string) => void;
    onConfigure: (config: { txBaud?: number; rxBaud?: number; config?: any }) => void;
    onAutoMode: (enabled: boolean) => void;
    isRunning: boolean;
    onStart: () => void;
    rxLog?: string[];
    rxError?: string | null;
}

export const DevicePanel: React.FC<DevicePanelProps> = ({
    onTransmit, onConfigure, onAutoMode, isRunning, onStart,
    rxLog = [], rxError = null
}) => {
    const [txBaud, setTxBaud] = useState(2);
    const [rxBaud, setRxBaud] = useState(2);
    const [parity, setParity] = useState<'none' | 'even' | 'odd'>('none');
    const [inputData, setInputData] = useState('');
    const [autoMode, setAutoMode] = useState(false);
    const [txStatus, setTxStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
    const logRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll log
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [rxLog]);

    useEffect(() => {
        if (!isRunning && txStatus === 'sending') {
            setTxStatus('sent');
            // Reset after success message
            setTimeout(() => {
                setTxStatus('idle');
                setInputData('');
            }, 1500);
        }
    }, [isRunning, txStatus]);

    const handleTxBaudChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        setTxBaud(val);
        onConfigure({ txBaud: val });
    };

    const handleRxBaudChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        setRxBaud(val);
        onConfigure({ rxBaud: val });
    };

    const handleParityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value as 'none' | 'even' | 'odd';
        setParity(val);
        onConfigure({ config: { parity: val } }); // Send general config update
    };

    // Map internal speed (1-10) to "Standard" Baud Rates for display
    const getDisplayBaud = (val: number) => {
        const rates = [300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200];
        // simple mapping: val=1 -> 300, val=6 -> 9600, val=11 -> 115200
        const index = Math.min(Math.floor(val) - 1, rates.length - 1);
        return rates[index] || 9600;
    };

    const handleSend = () => {
        if (!inputData) return;

        setTxStatus('sending');

        // UX: Auto-start if not running
        if (!isRunning) {
            onStart();
        }

        // Send first char for now, or loop? 
        // Let's implement full string sending in worker later, for now single char or burst
        // We'll iterate here for simplicity
        inputData.split('').forEach(char => {
            onTransmit(char);
        });
        // Input clear happens after success timeout
    };

    const toggleAuto = () => {
        const newState = !autoMode;
        setAutoMode(newState);
        onAutoMode(newState);

        // UX: Auto-start if enabling auto mode
        if (newState && !isRunning) {
            onStart();
        }
    };

    return (
        <div className="grid grid-cols-2 gap-4 mt-4 h-full">
            {/* Transmitter Panel */}
            <div className="bg-black/40 border border-cyber-dark-gray p-4 rounded relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-1 bg-cyber-neon-cyan text-black text-[10px] font-bold">TX</div>
                <h3 className="text-cyber-neon-cyan text-sm mb-4 uppercase tracking-widest">Transmitter</h3>

                <div className="space-y-4">
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
                            value={parity}
                            onChange={handleParityChange}
                            className="w-full bg-black border border-cyber-dark-gray text-cyber-neon-cyan text-xs p-1 focus:outline-none uppercase"
                        >
                            <option value="none">None</option>
                            <option value="even">Even</option>
                            <option value="odd">Odd</option>
                        </select>
                    </div>

                    <div className="flex gap-2 relative">
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

                    <div className="pt-2 border-t border-cyber-dark-gray/30">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoMode}
                                onChange={toggleAuto}
                                className="accent-cyber-neon-cyan bg-transparent"
                            />
                            <span className="text-xs text-gray-400">Auto-Generate Traffic</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Receiver Panel */}
            <div className="bg-black/40 border border-cyber-dark-gray p-4 rounded relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1 bg-cyber-neon-pink text-black text-[10px] font-bold">RX</div>
                <h3 className="text-cyber-neon-pink text-sm mb-4 uppercase tracking-widest">Receiver</h3>

                <div className="space-y-4">
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
                        <div className="text-[10px] text-gray-500 mt-1">
                            * Mismatching baud rates will cause framing errors
                        </div>
                    </div>

                    <div className="p-2 border border-cyber-dark-gray/50 bg-black/50 h-16 overflow-hidden rounded relative">
                        <div className="text-[10px] text-gray-500 mb-1 flex justify-between">
                            <span>DECODED OUTPUT</span>
                            <span className="text-[9px] text-gray-600">ASCII</span>
                        </div>
                        <div ref={logRef} className="font-mono text-cyber-neon-green text-sm overflow-y-auto h-10 w-full break-all whitespace-pre-wrap leading-tight">
                            {rxLog.join('')}
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
        </div>
    );
};
