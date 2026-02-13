import React, { useState } from 'react';
import { TransmitterPanel } from './device/TransmitterPanel';
import { ReceiverPanel } from './device/ReceiverPanel';

interface DevicePanelProps {
    onTransmit: (char: string) => void;
    onConfigure: (config: { txBaud?: number; rxBaud?: number; config?: any; txConfig?: any; rxConfig?: any }) => void;
    onAutoMode: (enabled: boolean) => void;
    isRunning: boolean;
    onStart: () => void;
    rxLog?: { char: string; error: boolean }[];
    rxError?: string | null;
}

export const DevicePanel: React.FC<DevicePanelProps> = ({
    onTransmit, onConfigure, onAutoMode, isRunning, onStart,
    rxLog = [], rxError = null
}) => {
    const [autoMode, setAutoMode] = useState(false);
    const [txStatus, setTxStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

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
        <div className="grid grid-cols-2 gap-4 h-full relative">
            {/* Transmitter Panel */}
            <div className="h-full">
                <TransmitterPanel
                    onTransmit={onTransmit}
                    onConfigure={onConfigure}
                    onStart={onStart}
                    isRunning={isRunning}
                    txStatus={txStatus}
                    setTxStatus={setTxStatus}
                />

                <div className="absolute bottom-4 left-4 z-10">
                    <label className="flex items-center gap-2 cursor-pointer bg-black/80 px-2 py-1 rounded border border-cyber-dark-gray/50 backdrop-blur-sm">
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

            {/* Receiver Panel */}
            <div className="h-full">
                <ReceiverPanel
                    onConfigure={onConfigure}
                    rxLog={rxLog}
                    rxError={rxError}
                />
            </div>
        </div>
    );
};
