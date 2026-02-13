import React from 'react';

export const ControlPanel: React.FC = () => {
    return (
        <aside className="w-80 border-l border-cyber-dark-gray bg-black/80 backdrop-blur-md p-4 z-30 flex flex-col gap-4 shrink-0">
            <h2 className="text-cyber-neon-cyan text-sm uppercase tracking-widest border-b border-cyber-neon-cyan/30 pb-2 mb-4">Control Plane</h2>
            <div className="flex-1 flex flex-col gap-4">
                {/* Future Controls */}
                <div className="text-xs text-gray-500 italic">No additional controls connected.</div>
            </div>
        </aside>
    );
};
