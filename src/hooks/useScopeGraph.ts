import { useEffect, useRef, useImperativeHandle, useState, useCallback } from 'react';
import uPlot from 'uplot';
import type { ScopeScrollbarHandle } from '../components/graph/ScopeScrollbar';
import { clampViewRange } from '../utils/graphUtils';
import { DEFAULT_WINDOW_SIZE, calculateWindowSize } from '../utils/serialUtils';

export interface ScopeGraphHandle {
    zoomIn: () => void;
    zoomOut: () => void;
    pan: (direction: 'left' | 'right') => void;
    reset: () => void;
    scrollToEnd: () => void;
}

export const useScopeGraph = (
    data: uPlot.AlignedData,
    ref: React.Ref<ScopeGraphHandle>,
    options?: Partial<uPlot.Options>,
    txBaud?: number
) => {
    const plotRef = useRef<HTMLDivElement>(null);
    const uPlotInstance = useRef<uPlot | null>(null);
    const isAutoScroll = useRef(true);
    const currentWindowSize = useRef(DEFAULT_WINDOW_SIZE);
    const manualRange = useRef<{ min: number, max: number } | null>(null);
    const scrollbarHandleRef = useRef<ScopeScrollbarHandle>(null);

    // Update window size based on baud rate (only when no data)
    useEffect(() => {
        if (txBaud && data[0].length === 0) {
            currentWindowSize.current = calculateWindowSize(txBaud);
        }
    }, [txBaud, data]);

    // State for cursor values
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

    const forceUpdateScrollbar = (min: number, max: number) => {
        if (!uPlotInstance.current || !scrollbarHandleRef.current) return;
        const xData = uPlotInstance.current.data[0];
        if (!xData || xData.length === 0) return;
        const dataMin = xData[0];
        const dataMax = xData[xData.length - 1];
        scrollbarHandleRef.current.update(min, max, dataMin, dataMax);
    };

    useImperativeHandle(ref, () => ({
        zoomIn: () => {
            if (!uPlotInstance.current) return;
            isAutoScroll.current = false;
            const min = uPlotInstance.current.scales.x.min;
            const max = uPlotInstance.current.scales.x.max;
            if (min === undefined || max === undefined) return;

            const range = max - min;
            const center = min + range / 2;
            const newRange = range * 0.8;
            currentWindowSize.current = newRange;

            let newMin = center - newRange / 2;
            let newMax = center + newRange / 2;

            // Check clamping after zoom
            const xData = uPlotInstance.current.data[0];
            if (xData && xData.length > 0) {
                const dataMin = xData[0];
                const dataMax = xData[xData.length - 1];
                const clamped = clampViewRange(newMin, newMax, dataMin, dataMax);
                newMin = clamped.min;
                newMax = clamped.max;
            }

            if (isAutoScroll.current && uPlotInstance.current.data[0]) {
                const xData = uPlotInstance.current.data[0];
                if (xData.length > 0) {
                    const dataMax = xData[xData.length - 1];
                    const newMin = dataMax - currentWindowSize.current;
                    uPlotInstance.current.setScale('x', { min: newMin, max: dataMax });
                    forceUpdateScrollbar(newMin, dataMax);
                    return;
                }
            }

            manualRange.current = { min: newMin, max: newMax };
            uPlotInstance.current.setScale('x', { min: newMin, max: newMax });
            forceUpdateScrollbar(newMin, newMax);
        },
        zoomOut: () => {
            if (!uPlotInstance.current) return;
            isAutoScroll.current = false;
            const min = uPlotInstance.current.scales.x.min;
            const max = uPlotInstance.current.scales.x.max;
            if (min === undefined || max === undefined) return;

            const range = max - min;
            const center = min + range / 2;
            const newRange = range * 1.25;
            currentWindowSize.current = newRange;

            let newMin = center - newRange / 2;
            let newMax = center + newRange / 2;

            // Check clamping after zoom
            const xData = uPlotInstance.current.data[0];
            if (xData && xData.length > 0) {
                const dataMin = xData[0];
                const dataMax = xData[xData.length - 1];
                const clamped = clampViewRange(newMin, newMax, dataMin, dataMax);
                newMin = clamped.min;
                newMax = clamped.max;
            }

            if (isAutoScroll.current && uPlotInstance.current.data[0]) {
                const xData = uPlotInstance.current.data[0];
                if (xData.length > 0) {
                    const dataMax = xData[xData.length - 1];
                    const newMin = dataMax - currentWindowSize.current;
                    uPlotInstance.current.setScale('x', { min: newMin, max: dataMax });
                    forceUpdateScrollbar(newMin, dataMax);
                    return;
                }
            }

            manualRange.current = { min: newMin, max: newMax };
            uPlotInstance.current.setScale('x', { min: newMin, max: newMax });
            forceUpdateScrollbar(newMin, newMax);
        },
        pan: (direction) => {
            if (!uPlotInstance.current) return;
            isAutoScroll.current = false;
            const min = uPlotInstance.current.scales.x.min;
            const max = uPlotInstance.current.scales.x.max;
            if (min === undefined || max === undefined) return;

            const range = max - min;
            const shift = range * 0.1;

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
            forceUpdateScrollbar(newMin, newMax);
        },
        reset: () => {
            if (!uPlotInstance.current) return;
            isAutoScroll.current = true;
            manualRange.current = null;
            const newWindowSize = txBaud ? calculateWindowSize(txBaud) : DEFAULT_WINDOW_SIZE;
            currentWindowSize.current = newWindowSize;

            const xData = uPlotInstance.current.data[0];
            if (xData && xData.length > 0) {
                const max = xData[xData.length - 1];
                const min = Math.max(xData[0], max - newWindowSize);
                uPlotInstance.current.setScale('x', { min, max });
                forceUpdateScrollbar(min, max);
            } else {
                // @ts-ignore
                uPlotInstance.current.setScale('x', { min: null, max: null });
            }
        },
        scrollToEnd: () => {
            if (!uPlotInstance.current) return;
            isAutoScroll.current = true;
            manualRange.current = null;

            const xData = uPlotInstance.current.data[0];
            if (xData && xData.length > 0) {
                const dataMin = xData[0];
                const dataMax = xData[xData.length - 1];
                const windowSize = currentWindowSize.current;

                let min, max;
                if (dataMax - dataMin < windowSize) {
                    // Data fits in window: Anchor to Left (Start)
                    min = dataMin;
                    max = dataMin + windowSize;
                } else {
                    // Data exceeds window: Anchor to Right (End)
                    min = dataMax - windowSize;
                    max = dataMax;
                }

                uPlotInstance.current.setScale('x', { min, max });
                forceUpdateScrollbar(min, max);
            }
        }
    }));

    // Callback for scrollbar user interaction
    const handleUserScroll = useCallback((newMin: number, newMax: number) => {
        if (!uPlotInstance.current) return;
        isAutoScroll.current = false;
        manualRange.current = { min: newMin, max: newMax };
        uPlotInstance.current.setScale('x', { min: newMin, max: newMax });
    }, []);

    useEffect(() => {
        if (!plotRef.current) return;

        const updateScrollbar = (u: uPlot) => {
            if (!scrollbarHandleRef.current) return;

            const min = u.scales.x.min;
            const max = u.scales.x.max;
            const xData = u.data[0];

            if (min === undefined || max === undefined || !xData || xData.length === 0) {
                scrollbarHandleRef.current.update(0, 0, 0, 0);
                return;
            }

            const dataMin = xData[0];
            const dataMax = xData[xData.length - 1];

            scrollbarHandleRef.current.update(min, max, dataMin, dataMax);
        };

        const updateLegend = (u: uPlot) => {
            const idx = u.cursor.idx;
            if (idx === null || idx === undefined) {
                setCursorValues(null);
                return;
            }

            const getVal = (seriesIdx: number) => {
                const val = u.data[seriesIdx][idx];
                return val === undefined ? null : val;
            };

            setCursorValues({
                time: getVal(0),
                tx: getVal(1),
                sync: getVal(2),
                error: getVal(3),
                data: getVal(4),
                stop: getVal(5),
                parity: getVal(6),
                valid: null // unused
            });
        };

        const defaultOptions: uPlot.Options = {
            title: "UART SIGNAL WAVEFORM",
            width: plotRef.current.clientWidth,
            height: plotRef.current.clientHeight,
            mode: 1,
            legend: { show: false },
            hooks: {
                draw: [updateScrollbar],
                setCursor: [updateLegend]
            },
            series: [
                {}, // Time
                { stroke: "#00F0FF", width: 2, spanGaps: false, label: "TX" },
                { stroke: "#39FF14", width: 0, points: { show: true, size: 10, fill: "#39FF14" }, label: "START" },
                { stroke: "#FF003C", width: 0, points: { show: true, size: 10, fill: "#FF003C" }, label: "ERROR" },
                { stroke: "#FFFF00", width: 0, points: { show: true, size: 8, fill: "#FFFF00" }, label: "DATA" },
                { stroke: "#BD00FF", width: 0, points: { show: true, size: 8, fill: "#BD00FF" }, label: "STOP" },
                { stroke: "#2E59FF", width: 0, points: { show: true, size: 8, fill: "#2E59FF" }, label: "PARITY" }
            ],
            axes: [
                {
                    font: "12px 'Fira Code'",
                    stroke: "#9CA3AF",
                    grid: { stroke: "#374151", width: 1 },
                    ticks: { stroke: "#374151", width: 1 },
                    size: 40
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
                    range: (_u, min, max) => {
                        if (!isAutoScroll.current && manualRange.current) {
                            return [manualRange.current.min, manualRange.current.max];
                        }
                        const windowSize = currentWindowSize.current;

                        // Default to [0, windowSize] if no data or invalid range
                        if (min === undefined || max === undefined || min === null || max === null || isNaN(min) || isNaN(max)) {
                            return [0, windowSize];
                        }

                        const range = max - min;
                        if (range < windowSize) {
                            // Data fits in window: Anchor to Left (Start = min)
                            return [min, min + windowSize];
                        }
                        // Data exceeds window: Anchor to Right (End = max)
                        return [max - windowSize, max];
                    }
                },
                y: { auto: false, range: [-0.5, 1.5] }
            },
            cursor: {
                drag: { x: false, y: false, uni: 50 }
            }
        };

        const finalOptions = { ...defaultOptions, ...options };

        if (uPlotInstance.current) {
            uPlotInstance.current.destroy();
        }

        uPlotInstance.current = new uPlot(finalOptions, data, plotRef.current);

        // Custom Drag-to-Pan Logic for Canvas (Main plot area)
        const plotDiv = plotRef.current;
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
            plotDiv.style.cursor = 'grabbing';
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

            const xData = uPlotInstance.current.data[0];
            if (xData && xData.length > 0) {
                const dataMin = xData[0];
                const dataMax = xData[xData.length - 1];
                const clamped = clampViewRange(newMin, newMax, dataMin, dataMax);
                newMin = clamped.min;
                newMax = clamped.max;
            }
            manualRange.current = { min: newMin, max: newMax };
            uPlotInstance.current.setScale('x', { min: newMin, max: newMax });
        };

        const handleCanvasMouseUp = () => {
            if (isDraggingCanvas) {
                isDraggingCanvas = false;
                plotDiv.style.cursor = 'default';
            }
        };

        plotDiv.addEventListener('mousedown', handleCanvasMouseDown);
        window.addEventListener('mousemove', handleCanvasMouseMove);
        window.addEventListener('mouseup', handleCanvasMouseUp);

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
            uPlotInstance.current?.destroy();
            uPlotInstance.current = null;
        };
    }, []); // Initial setup

    // Update data
    useEffect(() => {
        if (uPlotInstance.current) {
            uPlotInstance.current.setData(data);
        }
    }, [data]);

    return { plotRef, scrollbarHandleRef, cursorValues, handleUserScroll };
};
