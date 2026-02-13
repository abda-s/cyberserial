import { forwardRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { ScopeStatus } from './graph/ScopeStatus';
import { ScopeScrollbar } from './graph/ScopeScrollbar';
import { useScopeGraph, type ScopeGraphHandle } from '../hooks/useScopeGraph'; // Import hook and type

// Export the type so other components can use it (it's re-exported from hook now)
export type { ScopeGraphHandle };

interface ScopeGraphProps {
    data: uPlot.AlignedData;
    options?: Partial<uPlot.Options>;
}

export const ScopeGraph = forwardRef<ScopeGraphHandle, ScopeGraphProps>(({ data, options }, ref) => {

    // Use the custom hook for all logic
    const { plotRef, scrollbarHandleRef, cursorValues, handleUserScroll } = useScopeGraph(data, ref, options);

    return (
        <div className="w-full h-full flex flex-col">
            <div ref={plotRef} className="flex-1 min-h-0 w-full mb-4" />

            <ScopeScrollbar
                ref={scrollbarHandleRef}
                onUserScroll={handleUserScroll}
            />

            <ScopeStatus cursorValues={cursorValues} />
        </div>
    );
});

ScopeGraph.displayName = 'ScopeGraph';
