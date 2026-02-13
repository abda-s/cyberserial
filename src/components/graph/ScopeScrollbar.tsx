import { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { clampViewRange } from '../../utils/graphUtils';

export interface ScopeScrollbarHandle {
    update: (viewMin: number, viewMax: number, dataMin: number, dataMax: number) => void;
}

interface ScopeScrollbarProps {
    onUserScroll: (newMin: number, newMax: number) => void;
}

export const ScopeScrollbar = forwardRef<ScopeScrollbarHandle, ScopeScrollbarProps>(({ onUserScroll }, ref) => {
    const scrollbarRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);

    // State to track data range for drag calculations
    const stateRef = useRef({
        viewMin: 0,
        viewMax: 0,
        dataMin: 0,
        dataMax: 0,
        dataRange: 0
    });

    useImperativeHandle(ref, () => ({
        update: (viewMin, viewMax, dataMin, dataMax) => {
            if (!thumbRef.current) return;

            const effectiveMax = Math.max(dataMax, viewMax);
            const dataRange = effectiveMax - dataMin;
            stateRef.current = { viewMin, viewMax, dataMin, dataMax, dataRange };

            if (dataRange <= 0) {
                thumbRef.current.style.width = '100%';
                thumbRef.current.style.left = '0%';
                return;
            }

            const pctLeft = ((viewMin - dataMin) / dataRange) * 100;
            const pctWidth = ((viewMax - viewMin) / dataRange) * 100;

            thumbRef.current.style.left = `${Math.max(0, Math.min(100, pctLeft))}%`;
            thumbRef.current.style.width = `${Math.max(0, Math.min(100, pctWidth))}%`;
        }
    }));

    useEffect(() => {
        const thumbDiv = thumbRef.current;
        const trackDiv = scrollbarRef.current;
        if (!thumbDiv || !trackDiv) return;

        let isDragging = false;
        let startX = 0;
        let startViewMin = 0;
        let startViewMax = 0;
        let startDataRange = 0;
        let startDataMin = 0;
        let startDataMax = 0;

        const handleMouseDown = (e: MouseEvent) => {
            if (e.button !== 0) return;
            e.stopPropagation();
            e.preventDefault();

            isDragging = true;
            startX = e.clientX;

            // Capture state at start of drag
            startViewMin = stateRef.current.viewMin;
            startViewMax = stateRef.current.viewMax;
            startDataRange = stateRef.current.dataRange;
            startDataMin = stateRef.current.dataMin;
            startDataMax = stateRef.current.dataMax;

            thumbDiv.style.cursor = 'grabbing';
            document.body.style.cursor = 'grabbing';
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const dx = e.clientX - startX;
            const trackWidth = trackDiv.clientWidth;

            if (trackWidth === 0) return;

            const pctChange = dx / trackWidth;
            const timeShift = pctChange * startDataRange;

            let newMin = startViewMin + timeShift;
            let newMax = startViewMax + timeShift;

            const clamped = clampViewRange(newMin, newMax, startDataMin, startDataMax);
            newMin = clamped.min;
            newMax = clamped.max;

            onUserScroll(newMin, newMax);
        };


        const handleMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                thumbDiv.style.cursor = 'grab';
                document.body.style.cursor = '';
            }
        };

        thumbDiv.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            thumbDiv.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [onUserScroll]);

    return (
        <div
            ref={scrollbarRef}
            className="h-5 w-full bg-cyber-dark-gray/20 border-t border-cyber-dark-gray/50 relative shrink-0 overflow-hidden group flex items-center"
        >
            {/* Track Detail (Scanlines) */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_50%,rgba(0,240,255,0.05)_50%)] bg-[length:4px_100%] opacity-50 pointer-events-none" />

            {/* Thumb */}
            <div
                ref={thumbRef}
                className="absolute top-0 bottom-0 bg-cyber-neon-cyan/20 border-x border-cyber-neon-cyan/60 hover:bg-cyber-neon-cyan/40 transition-colors cursor-grab active:cursor-grabbing backdrop-blur-sm shadow-[0_0_10px_rgba(0,240,255,0.1)]"
                style={{ left: '0%', width: '100%' }}
            >
                {/* Thumb Grip Lines */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center gap-[3px] opacity-80">
                    <div className="w-[1px] h-3 bg-cyber-neon-cyan shadow-[0_0_2px_#00F0FF]"></div>
                    <div className="w-[1px] h-3 bg-cyber-neon-cyan shadow-[0_0_2px_#00F0FF]"></div>
                    <div className="w-[1px] h-3 bg-cyber-neon-cyan shadow-[0_0_2px_#00F0FF]"></div>
                </div>
            </div>
        </div>
    );
});

ScopeScrollbar.displayName = 'ScopeScrollbar';
