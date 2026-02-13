import { useEffect, useRef, useState, useCallback } from 'react';
import uPlot from 'uplot';

// Import worker using Vite's syntax
import SimulationWorker from '../workers/simulation.worker?worker';

export function useSimulation() {
    const workerRef = useRef<Worker | null>(null);
    // Initialize with 7 arrays: [Time, TX, Start, Data, Valid, Stop, Parity]
    const [data, setData] = useState<uPlot.AlignedData>([[], [], [], [], [], [], []]);
    const [isRunning, setIsRunning] = useState(false);
    const [rxLog, setRxLog] = useState<{ char: string; error: boolean }[]>([]);
    const [rxError, setRxError] = useState<string | null>(null);

    // Buffer to hold data before flushing to state (optional optimization)
    // For now we just append to state for simplicity in Phase 1
    // But growing arrays indefinitely is bad. We need a rolling window.
    const MAX_POINTS = 50000;

    useEffect(() => {
        workerRef.current = new SimulationWorker();

        workerRef.current.onmessage = (e) => {
            const { type, payload } = e.data;
            if (type === 'DATA') {
                const [newTimes, newValues, newRed, newYellow, newGreen, newPurple, newBlue] = payload;

                setData(prev => {
                    // Ensure previous state has 7 arrays, fallback if not
                    const prevTimes = prev[0] || [];
                    const prevValues = prev[1] || [];
                    const prevRed = prev[2] || [];
                    const prevYellow = prev[3] || [];
                    const prevGreen = prev[4] || [];
                    const prevPurple = prev[5] || [];
                    const prevBlue = prev[6] || [];

                    // Simple rolling buffer
                    const combinedTimes = [...prevTimes, ...newTimes];
                    const combinedValues = [...prevValues, ...newValues];
                    const combinedRed = [...prevRed, ...newRed];
                    const combinedYellow = [...prevYellow, ...newYellow];
                    const combinedGreen = [...prevGreen, ...newGreen];
                    const combinedPurple = [...prevPurple, ...newPurple];
                    const combinedBlue = [...prevBlue, ...newBlue];

                    if (combinedTimes.length > MAX_POINTS) {
                        return [
                            combinedTimes.slice(combinedTimes.length - MAX_POINTS),
                            combinedValues.slice(combinedValues.length - MAX_POINTS),
                            combinedRed.slice(combinedRed.length - MAX_POINTS),
                            combinedYellow.slice(combinedYellow.length - MAX_POINTS),
                            combinedGreen.slice(combinedGreen.length - MAX_POINTS),
                            combinedPurple.slice(combinedPurple.length - MAX_POINTS),
                            combinedBlue.slice(combinedBlue.length - MAX_POINTS)
                        ];
                    }
                    return [combinedTimes, combinedValues, combinedRed, combinedYellow, combinedGreen, combinedPurple, combinedBlue];
                });
            } else if (type === 'TX_COMPLETE') {
                // Auto-stop when transmission is done
                workerRef.current?.postMessage({ type: 'STOP' });
                setIsRunning(false);
            } else if (type === 'RX_DATA') {
                const entry = typeof payload === 'string' ? { char: payload, error: false } : payload;
                setRxLog(prev => {
                    // Keep a larger history (e.g. 2000 chars) instead of just 30
                    const newLog = [...prev, entry];
                    if (newLog.length > 2000) return newLog.slice(newLog.length - 2000);
                    return newLog;
                });
            } else if (type === 'RX_ERROR') {
                setRxError(payload);
                // Clear error after 1s
                setTimeout(() => setRxError(null), 1000);
            }
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    const start = useCallback(() => {
        workerRef.current?.postMessage({ type: 'START' });
        setIsRunning(true);
    }, []);

    const stop = useCallback(() => {
        workerRef.current?.postMessage({ type: 'STOP' });
        setIsRunning(false);
    }, []);

    const reset = useCallback(() => {
        setData([[], [], [], [], [], [], []]);
    }, []);


    const transmit = useCallback((char: string | number) => {
        workerRef.current?.postMessage({ type: 'TRANSMIT', payload: { char } });
    }, []);

    const configure = useCallback((config: { txBaud?: number; rxBaud?: number; config?: any; txConfig?: any; rxConfig?: any }) => {
        workerRef.current?.postMessage({ type: 'CONFIGURE', payload: config });
    }, []);

    const setAutoMode = useCallback((enabled: boolean) => {
        workerRef.current?.postMessage({ type: 'SET_AUTO', payload: { enabled } });
    }, []);

    const setSpeed = useCallback((speed: number) => {
        workerRef.current?.postMessage({ type: 'SET_SPEED', payload: { speed } });
    }, []);

    return { data, start, stop, reset, transmit, configure, setAutoMode, setSpeed, isRunning, rxLog, rxError };
}
