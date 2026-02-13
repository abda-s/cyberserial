import React from 'react';
import { GlitchButton } from '../GlitchButton';

interface ControlPanelProps {
    onClearHistory: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ onClearHistory }) => {
    return (
        <aside className="w-80 border-l border-cyber-dark-gray bg-black/80 backdrop-blur-md p-4 z-30 flex flex-col gap-4 shrink-0">
            <h2 className="text-cyber-neon-cyan text-sm uppercase tracking-widest border-b border-cyber-neon-cyan/30 pb-2 mb-4">Control Plane</h2>
            <div className="flex-1 flex flex-col gap-4">
                <GlitchButton
                    onClick={onClearHistory}
                    variant="pink"
                    className="w-full py-3 text-sm"
                >
                    CLEAR ALL
                </GlitchButton>
            </div>
        </aside>
    );
};
