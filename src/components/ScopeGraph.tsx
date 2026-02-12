import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
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

    useImperativeHandle(ref, () => ({
        zoomIn: () => {
            if (!uPlotInstance.current) return;
            const min = uPlotInstance.current.scales.x.min;
            const max = uPlotInstance.current.scales.x.max;
            if (min === undefined || max === undefined) return;

            const range = max - min;
            const center = min + range / 2;
            const newRange = range * 0.8; // Zoom in by 20%

            uPlotInstance.current.setScale('x', {
                min: center - newRange / 2,
                max: center + newRange / 2
            });
        },
        zoomOut: () => {
            if (!uPlotInstance.current) return;
            const min = uPlotInstance.current.scales.x.min;
            const max = uPlotInstance.current.scales.x.max;
            if (min === undefined || max === undefined) return;

            const range = max - min;
            const center = min + range / 2;
            const newRange = range * 1.25; // Zoom out by 25%

            uPlotInstance.current.setScale('x', {
                min: center - newRange / 2,
                max: center + newRange / 2
            });
        },
        pan: (direction) => {
            if (!uPlotInstance.current) return;
            const min = uPlotInstance.current.scales.x.min;
            const max = uPlotInstance.current.scales.x.max;
            if (min === undefined || max === undefined) return;

            const range = max - min;
            const shift = range * 0.1; // Pan by 10%

            if (direction === 'left') {
                uPlotInstance.current.setScale('x', { min: min - shift, max: max - shift });
            } else {
                uPlotInstance.current.setScale('x', { min: min + shift, max: max + shift });
            }
        },
        reset: () => {
            if (!uPlotInstance.current) return;
            // Let uPlot auto-scale by setting to null? Or just reset to full data range
            // For streaming data, we usually want to verify the latest window.
            // Setting min/max to undefined forces auto-scale on next draw
            // @ts-ignore
            uPlotInstance.current.setScale('x', { min: null, max: null });
        }
    }));

    useEffect(() => {
        if (!plotRef.current) return;

        const defaultOptions: uPlot.Options = {
            title: "UART SIGNAL WAVEFORM",
            width: plotRef.current.clientWidth,
            height: plotRef.current.clientHeight,
            mode: 1,
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
                    // Series 2: Red Dots (Start/Stop/Error)
                    stroke: "#FF003C",
                    width: 0, // No line
                    paths: (() => null) as any,
                    points: {
                        show: true,
                        size: 10,
                        fill: "#FF003C"
                    },
                    label: "SYNC/ERR"
                },
                {
                    // Series 3: Yellow Dots (Data)
                    stroke: "#FCEE0A",
                    width: 0,
                    paths: (() => null) as any,
                    points: {
                        show: true,
                        size: 8,
                        fill: "#FCEE0A"
                    },
                    label: "DATA"
                },
                {
                    // Series 4: Green Dots (Valid)
                    stroke: "#39FF14",
                    width: 0,
                    paths: (() => null) as any,
                    points: {
                        show: true,
                        size: 8,
                        fill: "#39FF14"
                    },
                    label: "VALID"
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
                    ticks: { stroke: "#374151", width: 1 }
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
                    // Prevent initial stretching by enforcing a minimum range
                    range: (_u, min, max) => {
                        const range = max - min;
                        if (range < 5) {
                            return [min, min + 5];
                        }
                        return [min, max];
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
                    x: true,
                    y: true,
                    uni: 50
                }
            }
        };

        const finalOptions = { ...defaultOptions, ...options };

        if (uPlotInstance.current) {
            uPlotInstance.current.destroy();
        }

        uPlotInstance.current = new uPlot(finalOptions, data, plotRef.current);

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
        <div ref={plotRef} className="w-full h-full" />
    );
});

ScopeGraph.displayName = 'ScopeGraph';
