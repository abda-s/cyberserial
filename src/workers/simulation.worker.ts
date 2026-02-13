/* eslint-disable no-restricted-globals */

// Simulation Worker
// Handles the high-speed logic for signal generation to avoid main thread jank.

const ctx: Worker = self as any;

let isRunning = false;
let intervalId: number | null = null;
let axisTime = 0; // Continuous time for x-axis

// Configurable parameters
let txBaud = 2; // Transmitter Baud Rate
let rxBaud = 2; // Receiver Baud Rate
let sampleRate = 60;

// UART Configuration
interface UartConfig {
    dataBits: 7 | 8;
    parity: 'none' | 'even' | 'odd';
    stopBits: 1 | 2;
    idleBits?: number;
}

let txConfig: UartConfig = {
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    idleBits: 0
};

let rxConfig: UartConfig = {
    dataBits: 8,
    parity: 'none',
    stopBits: 1
};

// Transmission Queue
const txQueue: number[] = [];
let isAutoMode = false; // If true, generates random data. If false, waits for queue.

// --- UART Transmitter Logic ---
type TxState = 'IDLE' | 'START' | 'DATA' | 'PARITY' | 'STOP';

class UartTransmitter {
    state: TxState = 'IDLE';
    bitIndex = 0;
    currentByte = 0;
    timeInState = 0;
    bitDuration = 0;

    txCompleteSent = false;

    constructor() {
        this.updateConfig();
    }

    updateConfig() {
        this.bitDuration = 1 / txBaud;
    }

    // Returns the current logic level (0 or 1)
    tick(deltaTime: number): number {
        // If IDLE, check if we should send a byte
        if (this.state === 'IDLE') {
            this.timeInState += deltaTime;

            // Check guard time / idle bits requirement
            const minIdleTime = (txConfig.idleBits || 0) * this.bitDuration;
            if (this.timeInState < minIdleTime) {
                return 1; // Not yet allowed to transmit
            }

            // Check queue first
            if (txQueue.length > 0) {
                // We've satisfied idle time, send immediately?
                // The original logic had a fixed delay. We replace it with configurable one.
                const charCode = txQueue.shift();
                if (charCode !== undefined) this.startTransmission(charCode);
                return 1;
            }

            // Auto mode fallback
            // Remove hardcoded delay. 'minIdleTime' check above already enforces the user setting.
            // If user sets 0 idle bits, we send back-to-back.
            if (isAutoMode) {
                const charCode = Math.floor(Math.random() * (126 - 33) + 33);
                this.startTransmission(charCode);
            }
            return 1; // Idle High
        }

        this.timeInState += deltaTime;

        if (this.timeInState >= this.bitDuration) {
            const overshoot = this.timeInState - this.bitDuration;
            this.timeInState = overshoot;
            this.advanceState();
        }

        return this.getOutputLevel();
    }

    stopBitCounter = 0;

    startTransmission(byte: number) {
        this.currentByte = byte;
        this.state = 'START';
        this.timeInState = 0;
        this.bitIndex = 0;
        this.stopBitCounter = 0;
        this.txCompleteSent = false;
    }

    advanceState() {
        switch (this.state) {
            case 'START':
                this.state = 'DATA';
                this.bitIndex = 0;
                break;
            case 'DATA':
                this.bitIndex++;
                if (this.bitIndex >= txConfig.dataBits) {
                    if (txConfig.parity !== 'none') {
                        this.state = 'PARITY';
                    } else {
                        this.state = 'STOP';
                        this.stopBitCounter = 0;
                    }
                }
                break;
            case 'PARITY':
                this.state = 'STOP';
                this.stopBitCounter = 0;
                break;
            case 'STOP':
                this.stopBitCounter++;
                if (this.stopBitCounter >= txConfig.stopBits) {
                    this.state = 'IDLE';
                    this.timeInState = 0; // Reset for IDLE
                } else {
                    // Stay in STOP for another bit duration
                    this.timeInState = 0; // Reset for next STOP bit
                }
                break;
        }
    }

    getOutputLevel(): number {
        switch (this.state) {
            case 'IDLE': return 1;
            case 'START': return 0;
            case 'DATA':
                return (this.currentByte >> this.bitIndex) & 1;
            case 'PARITY':
                return this.calculateParity(this.currentByte);
            case 'STOP': return 1;
            default: return 1;
        }
    }

    calculateParity(byte: number): number {
        let ones = 0;
        // Count set bits up to dataBits
        for (let i = 0; i < txConfig.dataBits; i++) {
            if ((byte >> i) & 1) ones++;
        }

        if (txConfig.parity === 'even') {
            return (ones % 2 === 0) ? 0 : 1;
        }
        else {
            return (ones % 2 !== 0) ? 0 : 1;
        }
    }

    shouldSignalComplete(): boolean {
        return !isAutoMode &&
            this.state === 'IDLE' &&
            txQueue.length === 0 &&
            this.timeInState > this.bitDuration * 5 &&
            !this.txCompleteSent;
    }
}

// --- UART Receiver Logic ---
class UartReceiver {
    state: 'HUNTING' | 'SAMPLING' = 'HUNTING';
    timeSinceStart = 0;
    lastRxLevel = 1;
    bitDuration = 1 / rxBaud; // Receiver's inferred baud rate

    rxEventQueue: { type: 'RX_DATA' | 'RX_ERROR', payload: any }[] = [];
    private rxBuffer: number = 0;
    private dataEmitted = false; // Flag to prevent double emission

    // Oversampling state
    private signalAccumulator = 0;
    private sampleCount = 0;

    // Returns dot type: 0=None, 1=Green(Start), 2=Red(Error), 3=Yellow(Data), 4=Purple(Stop), 5=Blue(Parity)
    tick(deltaTime: number, currentRxLevel: number): number {
        // REMOVED: this.bitDuration = 1 / rxBaud; 
        // We lock it when we detect the start bit!

        if (this.state === 'HUNTING') {
            // Detect falling edge (Start Bit)
            if (this.lastRxLevel === 1 && currentRxLevel === 0) {
                this.state = 'SAMPLING';
                this.bitDuration = 1 / rxBaud; // Lock baud rate HERE for the frame
                this.timeSinceStart = 0.0; // Align exactly with edge
                this.rxBuffer = 0;
                this.dataEmitted = false; // Reset emission flag

                // Reset sampling
                this.signalAccumulator = 0;
                this.sampleCount = 0;
            }
            this.lastRxLevel = currentRxLevel;
            return 0;
        }

        if (this.state === 'SAMPLING') {
            const prevTime = Math.max(0, this.timeSinceStart);
            this.timeSinceStart += deltaTime;
            this.lastRxLevel = currentRxLevel;

            // Standardize phase calculation using modulo
            const currentPhase = (this.timeSinceStart % this.bitDuration) / this.bitDuration;
            const prevPhase = (prevTime % this.bitDuration) / this.bitDuration;

            // Reset accumulator when crossing into the sampling window (phase 0.2)
            if (prevPhase < 0.2 && currentPhase >= 0.2) {
                this.signalAccumulator = 0;
                this.sampleCount = 0;
            }

            // Accumulate signal for majority vote / integration
            // We ignore the first 20% and last 20% of the bit time to avoid edge jitter
            if (currentPhase > 0.2 && currentPhase < 0.8) {
                this.signalAccumulator += currentRxLevel;
                this.sampleCount++;
            }

            // Check for timeout / reset
            const totalBits = 1 + rxConfig.dataBits + (rxConfig.parity !== 'none' ? 1 : 0) + rxConfig.stopBits;
            if (this.timeSinceStart > (totalBits + 0.5) * this.bitDuration) {
                // If line is still low after a full frame duration, it's a BREAK condition
                if (currentRxLevel === 0) {
                    this.rxEventQueue.push({ type: 'RX_ERROR', payload: 'BREAK' });
                }
                this.state = 'HUNTING';
                return 0;
            }

            // Boundary Crossing Detection for Decision (Center Sampling at 0.5)
            const prevBitPos = prevTime / this.bitDuration;
            const currBitPos = this.timeSinceStart / this.bitDuration;

            const prevSampleIndex = Math.floor(prevBitPos - 0.5);
            const currSampleIndex = Math.floor(currBitPos - 0.5);

            if (currSampleIndex > prevSampleIndex) {
                // We just crossed the center point (X.5)
                const bitIndex = currSampleIndex; // 0=Start, 1=Data0...

                // Determine bit value using majority vote of accumulated samples
                // Fallback to current level if no samples (shouldn't happen with high sample rate)
                let sampledBit = currentRxLevel;
                if (this.sampleCount > 0) {
                    sampledBit = (this.signalAccumulator / this.sampleCount) >= 0.5 ? 1 : 0;
                }

                // Don't reset accumulator here, we do it at window start now.

                // Determine what kind of bit this is
                if (bitIndex === 0) return 1; // Start Bit (Green)

                if (bitIndex <= rxConfig.dataBits) {
                    const dataBitIndex = bitIndex - 1;
                    // LSB First
                    if (sampledBit === 1) {
                        this.rxBuffer |= (1 << dataBitIndex);
                    }
                    return 3; // Yellow (Data)
                }

                // Parity or Stop
                if (rxConfig.parity !== 'none') {
                    if (bitIndex === rxConfig.dataBits + 1) {
                        // Calculate expected parity from the buffer we just built
                        let ones = 0;
                        for (let i = 0; i < rxConfig.dataBits; i++) {
                            if ((this.rxBuffer >> i) & 1) ones++;
                        }

                        const expectedParity = rxConfig.parity === 'even' ? (ones % 2 === 0 ? 0 : 1) : (ones % 2 !== 0 ? 0 : 1);
                        const receivedParity = sampledBit;

                        if (receivedParity !== expectedParity) {
                            // Emit corrupted data anyway
                            if (!this.dataEmitted) {
                                this.rxEventQueue.push({ type: 'RX_DATA', payload: { char: String.fromCharCode(this.rxBuffer), error: true } });
                                this.dataEmitted = true;
                            }
                            this.rxEventQueue.push({ type: 'RX_ERROR', payload: 'PARITY_ERROR' });
                            return 2; // Red (Error)
                        }
                        return 5; // Blue (Parity)
                    }
                    if (bitIndex > rxConfig.dataBits + 1) {
                        // Stop Bit Logic
                        if (sampledBit !== 1) {
                            // Emit corrupted data anyway
                            if (!this.dataEmitted) {
                                this.rxEventQueue.push({ type: 'RX_DATA', payload: { char: String.fromCharCode(this.rxBuffer), error: true } });
                                this.dataEmitted = true;
                            }
                            this.rxEventQueue.push({ type: 'RX_ERROR', payload: 'FRAMING_ERROR' });
                            // Should we go to HUNTING immediately on error?
                            // Yes, to try to resync.
                            this.state = 'HUNTING';
                            return 2; // Red (Error)
                        }
                        // Emit Data ONCE at the last stop bit
                        const lastBitIndex = rxConfig.dataBits + 1 + rxConfig.stopBits;
                        if (bitIndex === lastBitIndex) {
                            if (!this.dataEmitted) {
                                this.rxEventQueue.push({ type: 'RX_DATA', payload: { char: String.fromCharCode(this.rxBuffer), error: false } });
                                this.dataEmitted = true;
                            }

                            // CRITICAL FIX: Return to HUNTING immediately to catch the next Start Bit
                            this.state = 'HUNTING';
                            return 4;
                        }
                        return 4;
                    }
                } else {
                    if (bitIndex > rxConfig.dataBits) {
                        // Stop Bit Logic (No Parity)
                        if (sampledBit !== 1) {
                            // Emit corrupted data anyway
                            if (!this.dataEmitted) {
                                this.rxEventQueue.push({ type: 'RX_DATA', payload: { char: String.fromCharCode(this.rxBuffer), error: true } });
                                this.dataEmitted = true;
                            }
                            this.rxEventQueue.push({ type: 'RX_ERROR', payload: 'FRAMING_ERROR' });
                            this.state = 'HUNTING';
                            return 2; // Red (Error)
                        }
                        // Emit Data ONCE at the last stop bit
                        const lastBitIndex = rxConfig.dataBits + rxConfig.stopBits;
                        if (bitIndex === lastBitIndex) {
                            if (!this.dataEmitted) {
                                this.rxEventQueue.push({ type: 'RX_DATA', payload: { char: String.fromCharCode(this.rxBuffer), error: false } });
                                this.dataEmitted = true;
                            }

                            // CRITICAL FIX: Back-to-back support
                            this.state = 'HUNTING';
                            return 4;
                        }
                        return 4; // Purple
                    }
                }
            }
            return 0;
        }

        return 0;
    }
}

const transmitter = new UartTransmitter();
const receiver = new UartReceiver();

ctx.onmessage = (event) => {
    const { type, payload } = event.data;

    switch (type) {
        case 'START':
            if (!isRunning) {
                isRunning = true;
                startSimulation();
            }
            break;
        case 'STOP':
            isRunning = false;
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
            break;
        case 'CONFIGURE':
            if (payload.txBaud) {
                txBaud = payload.txBaud;
                transmitter.updateConfig();
            }
            if (payload.rxBaud) {
                rxBaud = payload.rxBaud;
            }
            // Support updating separate TX/RX configs
            if (payload.txConfig) txConfig = { ...txConfig, ...payload.txConfig };
            if (payload.rxConfig) rxConfig = { ...rxConfig, ...payload.rxConfig };
            break;
        case 'TRANSMIT':
            if (payload.char) {
                const code = typeof payload.char === 'string' ? payload.char.charCodeAt(0) : payload.char;
                txQueue.push(code);
            }
            break;
        case 'SET_AUTO':
            if (payload.enabled !== undefined) isAutoMode = payload.enabled;
            break;
        default:
            break;
    }
};

function startSimulation() {
    const tickRate = 1000 / 60;

    intervalId = self.setInterval(() => {
        if (!isRunning) return;

        // Dynamic Sample Rate
        // Ensure we sample at least 10x the fastest baud rate to catch edges and bits accurately
        const maxBaud = Math.max(txBaud, rxBaud);
        const targetSampleRate = Math.max(60, maxBaud * 10);
        sampleRate = targetSampleRate;

        const dt = 1 / sampleRate;

        const chunk: (number | null)[][] = [[], [], [], [], [], [], []]; // [Time, TX, Start, Data, Valid, Stop, Parity]

        // Number of steps to simulate per frame to keep up with real-time
        // We want to simulate 'tickRate' ms worth of time.
        // steps = (tickRate_sec) / dt = (1/60) / (1/sampleRate) = sampleRate / 60
        const stepsPerFrame = Math.ceil(sampleRate / 60);

        for (let i = 0; i < stepsPerFrame; i++) {
            axisTime += dt;

            const txLevel = transmitter.tick(dt);
            const dotType = receiver.tick(dt, txLevel);

            chunk[0].push(axisTime);
            chunk[1].push(txLevel);

            // Distribute dots to correct series
            const dotY = -0.2;

            chunk[2].push(dotType === 1 ? dotY : null); // Green (Start)
            chunk[3].push(dotType === 2 ? dotY : null); // Red (Error)
            chunk[4].push(dotType === 3 ? dotY : null); // Yellow (Data)
            chunk[5].push(dotType === 4 ? dotY : null); // Purple (Stop)
            chunk[6].push(dotType === 5 ? dotY : null); // Blue (Parity)
        }

        ctx.postMessage({ type: 'DATA', payload: chunk });

        // Dispatch RX Events
        while (receiver.rxEventQueue.length > 0) {
            const event = receiver.rxEventQueue.shift();
            if (event) {
                ctx.postMessage(event);
            }
        }

        // Check for Burst Completion - Fix Race Condition
        if (transmitter.shouldSignalComplete()) {
            ctx.postMessage({ type: 'TX_COMPLETE' });
            transmitter.txCompleteSent = true;
        }

    }, tickRate);
}

export { };
