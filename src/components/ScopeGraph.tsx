import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

export interface ScopeGraphHandle {
    zoomIn: () => void;
    zoomOut: () => void;
    pan: (direction: 'left' | 'right') => void;
    reset: () => void;
}

interface ScopeGraphProps {
    data: uPlot.AlignedData;
    options?: Partial<uPlot.Options>;
}

export const ScopeGraph = forwardRef<ScopeGraphHandle, ScopeGraphProps>(({ data, options }, ref) => {
    const plotRef = useRef<HTMLDivElement>(null);
    const uPlotInstance = useRef<uPlot | null>(null);
    const isAutoScroll = useRef(true);
    const manualRange = useRef<{ min: number, max: number } | null>(null);
    const scrollbarRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);

    // State for custom legend/status panel
    const [cursorValues, setCursorValues] = useState<{
        tx: number | null,
        sync: number | null,
        data: number | null,
        valid: number | null,
        stop: number | null,
        parity: number | null,
        error: number | null,
        time: number | null
    } | null>(null);

    useImperativeHandle(ref, () => ({
        zoomIn: () => {
            if (!uPlotInstance.current) return;
            isAutoScroll.current = false; // Disable auto-scroll logic
            const min = uPlotInstance.current.scales.x.min;
            const max = uPlotInstance.current.scales.x.max;
            if (min === undefined || max === undefined) return;

            const range = max - min;
            const center = min + range / 2;
            const newRange = range * 0.8; // Zoom in by 20%

            const newMin = center - newRange / 2;
            const newMax = center + newRange / 2;

            manualRange.current = { min: newMin, max: newMax };

            uPlotInstance.current.setScale('x', {
                min: newMin,
                max: newMax
            });
        },
        zoomOut: () => {
            if (!uPlotInstance.current) return;
            isAutoScroll.current = false; // Disable auto-scroll logic
            const min = uPlotInstance.current.scales.x.min;
            const max = uPlotInstance.current.scales.x.max;
            if (min === undefined || max === undefined) return;

            const range = max - min;
            const center = min + range / 2;
            const newRange = range * 1.25; // Zoom out by 25%

            const newMin = center - newRange / 2;
            const newMax = center + newRange / 2;

            manualRange.current = { min: newMin, max: newMax };

            uPlotInstance.current.setScale('x', {
                min: newMin,
                max: newMax
            });
        },
        pan: (direction) => {
            if (!uPlotInstance.current) return;
            isAutoScroll.current = false; // Disable auto-scroll logic
            const min = uPlotInstance.current.scales.x.min;
            const max = uPlotInstance.current.scales.x.max;
            if (min === undefined || max === undefined) return;

            const range = max - min;
            const shift = range * 0.1; // Pan by 10%

            let newMin, newMax;

            if (direction === 'left') {
                newMin = min - shift;
                newMax = max - shift;
            } else {
                newMin = min + shift;
                newMax = max + shift;
            }

            manualRange.current = { min: newMin, max: newMax };

            uPlotInstance.current.setScale('x', { min: newMin, max: newMax });
        },
        reset: () => {
            if (!uPlotInstance.current) return;
            isAutoScroll.current = true; // Re-enable auto-scroll logic
            manualRange.current = null; // Clear manual override

            // Force jump to latest data
            const xData = uPlotInstance.current.data[0];
            if (xData && xData.length > 0) {
                const max = xData[xData.length - 1];
                const min = Math.max(xData[0], max - 13); // 13s window
                uPlotInstance.current.setScale('x', { min, max });
            } else {
                // @ts-ignore
                uPlotInstance.current.setScale('x', { min: null, max: null });
            }
        }
    }));

    useEffect(() => {
        if (!plotRef.current) return;

        const updateScrollbar = (u: uPlot) => {
            if (!thumbRef.current || !scrollbarRef.current) return;

            const min = u.scales.x.min;
            const max = u.scales.x.max;
            const xData = u.data[0];

            if (min === undefined || max === undefined || !xData || xData.length === 0) {
                thumbRef.current.style.width = '0%';
                thumbRef.current.style.left = '0%';
                return;
            }

            const dataMin = xData[0];
            const dataMax = xData[xData.length - 1];
            const dataRange = dataMax - dataMin;

            if (dataRange <= 0) {
                thumbRef.current.style.width = '100%';
                thumbRef.current.style.left = '0%';
                return;
            }

            // Calculate percentage
            // If dataMin > min (shouldn't happen often but possible), clamp

            // Allow view to be wider than data? uPlot usually clamps scale to data if range option allows.
            // But here we want the scrollbar to represent the VIEW relative to DATA.

            const pctLeft = ((min - dataMin) / dataRange) * 100;
            const pctWidth = ((max - min) / dataRange) * 100;

            thumbRef.current.style.left = `${Math.max(0, Math.min(100, pctLeft))}%`;
            thumbRef.current.style.width = `${Math.max(0, Math.min(100, pctWidth))}%`;
        };

        const updateLegend = (u: uPlot) => {
            const idx = u.cursor.idx;
            if (idx === null || idx === undefined) {
                setCursorValues(null);
                return;
            }

            // Helper to safely get value
            const getVal = (seriesIdx: number) => {
                const val = u.data[seriesIdx][idx];
                return val === undefined ? null : val;
            };

            setCursorValues({
                time: getVal(0),
                tx: getVal(1),
                sync: getVal(2),
                data: getVal(4), // Series 4 is Data
                valid: getVal(4), // Legacy/Unused
                stop: getVal(5),
                parity: getVal(6),
                error: getVal(3) // Series 3 is Error
            });
        };

        const defaultOptions: uPlot.Options = {
            title: "UART SIGNAL WAVEFORM",
            width: plotRef.current.clientWidth,
            height: plotRef.current.clientHeight,
            mode: 1,
            legend: { show: false }, // Disable default legend
            hooks: {
                draw: [updateScrollbar],
                setCursor: [updateLegend]
            },
            series: [
                {}, // Time
                {
                    // Series 1: TX Line (Cyan)
                    stroke: "#00F0FF",
                    width: 2,
                    spanGaps: false,
                    label: "TX",
                },
                {
                    // Series 2: Green Dots (Start Bit)
                    stroke: "#39FF14",
                    width: 0, // No line
                    paths: (() => null) as any,
                    points: {
                        show: true,
                        size: 10,
                        fill: "#39FF14"
                    },
                    label: "START"
                },
                {
                    // Series 3: Red Dots (ERROR)
                    stroke: "#FF003C",
                    width: 0,
                    paths: (() => null) as any,
                    points: {
                        show: true,
                        size: 10,
                        fill: "#FF003C"
                    },
                    label: "ERROR"
                },
                {
                    // Series 4: Yellow Dots (DATA / SAMPLE)
                    stroke: "#FFFF00",
                    width: 0,
                    paths: (() => null) as any,
                    points: {
                        show: true,
                        size: 8,
                        fill: "#FFFF00"
                    },
                    label: "DATA"
                },
                {
                    // Series 5: Purple Dots (Stop Bit)
                    stroke: "#BD00FF",
                    width: 0,
                    paths: (() => null) as any,
                    points: {
                        show: true,
                        size: 8,
                        fill: "#BD00FF"
                    },
                    label: "STOP"
                },
                {
                    // Series 6: Blue Dots (Parity Bit)
                    stroke: "#2E59FF",
                    width: 0,
                    paths: (() => null) as any,
                    points: {
                        show: true,
                        size: 8,
                        fill: "#2E59FF"
                    },
                    label: "PARITY"
                }
            ],
            axes: [
                {
                    font: "12px 'Fira Code'",
                    stroke: "#9CA3AF",
                    grid: { stroke: "#374151", width: 1 },
                    ticks: { stroke: "#374151", width: 1 },
                    size: 40 // Prevent text clipping
                },
                {
                    font: "12px 'Fira Code'",
                    stroke: "#9CA3AF",
                    grid: { stroke: "#374151", width: 1 },
                    ticks: { stroke: "#374151", width: 1 }
                }
            ],
            scales: {
                x: {
                    time: false,
                    // Sliding Window with Fixed Size
                    range: (_u, min, max) => {
                        if (!isAutoScroll.current && manualRange.current) {
                            return [manualRange.current.min, manualRange.current.max];
                        }
                        const windowSize = 13; // 5 Seconds fixed window
                        const range = max - min;

                        // If we have less data than the window size, show the full window starting from min
                        // This creates the "filling up" effect with empty space
                        if (range < windowSize) {
                            return [min, min + windowSize];
                        }

                        // Otherwise (range > windowSize), lock to the latest windowSize
                        // This creates the "sliding" effect
                        return [max - windowSize, max];
                    }
                },
                y: {
                    // Manual range to include the negative space for dots
                    auto: false,
                    range: [-0.5, 1.5]
                }
            },
            cursor: {
                drag: {
                    x: false, // Disable default zoom drag
                    y: false,
                    uni: 50
                }
            }
        };

        const finalOptions = { ...defaultOptions, ...options };

        if (uPlotInstance.current) {
            uPlotInstance.current.destroy();
        }

        uPlotInstance.current = new uPlot(finalOptions, data, plotRef.current);

        // Custom Drag-to-Pan Logic for Canvas
        let isDraggingCanvas = false;
        let startXCanvas = 0;
        let startMinCanvas = 0;
        let startMaxCanvas = 0;

        const handleCanvasMouseDown = (e: MouseEvent) => {
            if (e.button !== 0 || !uPlotInstance.current) return;
            isDraggingCanvas = true;
            startXCanvas = e.clientX;
            isAutoScroll.current = false;

            const xScale = uPlotInstance.current.scales.x;
            startMinCanvas = xScale.min!;
            startMaxCanvas = xScale.max!;

            plotRef.current!.style.cursor = 'grabbing';
            e.preventDefault();
        };

        const handleCanvasMouseMove = (e: MouseEvent) => {
            if (!isDraggingCanvas || !uPlotInstance.current) return;

            const dx = e.clientX - startXCanvas;
            const plotWidth = uPlotInstance.current.bbox.width;
            const timeRange = startMaxCanvas - startMinCanvas;

            const timeShift = (dx / plotWidth) * timeRange;

            let newMin = startMinCanvas - timeShift;
            let newMax = startMaxCanvas - timeShift;

            // Clamp: Don't allow scrolling before the start of data
            const xData = uPlotInstance.current.data[0];
            if (xData && xData.length > 0) {
                const dataMin = xData[0];
                const dataMax = xData[xData.length - 1];

                // Clamp Left
                if (newMin < dataMin) {
                    const diff = dataMin - newMin;
                    newMin += diff;
                    newMax += diff;
                }

                // Clamp Right (Future)
                if (newMax > dataMax) {
                    const diff = newMax - dataMax;
                    newMax -= diff;
                    newMin -= diff;
                }
            }

            manualRange.current = { min: newMin, max: newMax };

            uPlotInstance.current.setScale('x', {
                min: newMin,
                max: newMax
            });
        };

        const handleCanvasMouseUp = () => {
            if (isDraggingCanvas) {
                isDraggingCanvas = false;
                if (plotRef.current) plotRef.current.style.cursor = 'default';
            }
        };

        // Scrollbar Drag Logic
        let isDraggingScrollbar = false;
        let startXScroll = 0;

        // We also need the range data at start of drag to compute shifts accurately
        let scrollDataRange = 0;
        let scrollDataMin = 0;
        let scrollStartViewMin = 0;
        let scrollStartViewMax = 0;

        const handleScrollbarMouseDown = (e: MouseEvent) => {
            if (e.button !== 0 || !uPlotInstance.current || !thumbRef.current || !scrollbarRef.current) return;
            e.stopPropagation(); // Don't trigger other things
            e.preventDefault();

            isAutoScroll.current = false;
            isDraggingScrollbar = true;
            startXScroll = e.clientX;

            const xData = uPlotInstance.current.data[0];
            if (!xData || xData.length === 0) return;
            scrollDataMin = xData[0];
            const dataMax = xData[xData.length - 1];
            scrollDataRange = dataMax - scrollDataMin;

            scrollStartViewMin = uPlotInstance.current.scales.x.min!;
            scrollStartViewMax = uPlotInstance.current.scales.x.max!;

            thumbRef.current.style.cursor = 'grabbing';
            document.body.style.cursor = 'grabbing';
        };

        const handleScrollbarMouseMove = (e: MouseEvent) => {
            if (!isDraggingScrollbar || !uPlotInstance.current || !scrollbarRef.current) return;

            const dx = e.clientX - startXScroll;
            const trackWidth = scrollbarRef.current.clientWidth;

            // dx in pixels -> pct change -> Time change
            // pctChange = dx / trackWidth
            // timeChange = pctChange * totalDataRange

            const pctChange = dx / trackWidth;
            const timeShift = pctChange * scrollDataRange;

            // Moving scrollbar RIGHT means viewing LATER time.
            let newMin = scrollStartViewMin + timeShift;
            let newMax = scrollStartViewMax + timeShift;

            // Clamp Logic
            // 1. Min cannot be less than dataMin
            if (newMin < scrollDataMin) {
                const diff = scrollDataMin - newMin;
                newMin += diff;
                newMax += diff;
            }

            // 2. Limit dragging into the future (Max cannot exceed dataMax)
            const xData = uPlotInstance.current.data[0];
            if (xData && xData.length > 0) {
                const dataMax = xData[xData.length - 1];
                // Allow a small buffer (e.g. 1 second) or strict lock?
                // User said "limit on how much i can scroll in the future".
                // Strict lock to dataMax seems safest for "no empty space".
                if (newMax > dataMax) {
                    const diff = newMax - dataMax;
                    newMax -= diff;
                    newMin -= diff;
                }
            }

            manualRange.current = { min: newMin, max: newMax };
            uPlotInstance.current.setScale('x', { min: newMin, max: newMax });
        };

        const handleScrollbarMouseUp = () => {
            if (isDraggingScrollbar) {
                isDraggingScrollbar = false;
                if (thumbRef.current) thumbRef.current.style.cursor = 'grab';
                document.body.style.cursor = '';
            }
        };


        const plotDiv = plotRef.current;
        plotDiv.addEventListener('mousedown', handleCanvasMouseDown);
        window.addEventListener('mousemove', handleCanvasMouseMove);
        window.addEventListener('mouseup', handleCanvasMouseUp);

        // Scrollbar listeners
        const thumbDiv = thumbRef.current;
        if (thumbDiv) {
            thumbDiv.addEventListener('mousedown', handleScrollbarMouseDown);
            // Global move/up for scrollbar too
            window.addEventListener('mousemove', handleScrollbarMouseMove);
            window.addEventListener('mouseup', handleScrollbarMouseUp);
        }

        const resizeObserver = new ResizeObserver(() => {
            if (plotRef.current && uPlotInstance.current) {
                uPlotInstance.current.setSize({
                    width: plotRef.current.clientWidth,
                    height: plotRef.current.clientHeight
                });
            }
        });

        resizeObserver.observe(plotRef.current);

        return () => {
            resizeObserver.disconnect();
            plotDiv.removeEventListener('mousedown', handleCanvasMouseDown);
            window.removeEventListener('mousemove', handleCanvasMouseMove);
            window.removeEventListener('mouseup', handleCanvasMouseUp);

            if (thumbDiv) {
                thumbDiv.removeEventListener('mousedown', handleScrollbarMouseDown);
                window.removeEventListener('mousemove', handleScrollbarMouseMove);
                window.removeEventListener('mouseup', handleScrollbarMouseUp);
            }

            uPlotInstance.current?.destroy();
            uPlotInstance.current = null;
        };
    }, []); // Initial setup only

    // Update data efficiently
    useEffect(() => {
        if (uPlotInstance.current) {
            uPlotInstance.current.setData(data);
        }
    }, [data]);

    return (
        <div className="w-full h-full flex flex-col">
            <div ref={plotRef} className="flex-1 min-h-0 w-full mb-4" />

            {/* Cyber Scrollbar Track */}
            <div
                ref={scrollbarRef}
                className="h-5 w-full bg-cyber-dark-gray/20 border-t border-cyber-dark-gray/50 relative shrink-0 overflow-hidden group flex items-center"
            // Implement Click-to-Jump logic later if needed
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

            {/* Status Panel (Custom Legend) */}
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
        </div>
    );
});

ScopeGraph.displayName = 'ScopeGraph';
