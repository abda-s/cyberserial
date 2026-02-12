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
}

let txConfig: UartConfig = {
    dataBits: 8,
    parity: 'none',
    stopBits: 1
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

            // Check queue first
            if (txQueue.length > 0) {
                // Slight delay before next char to visualize separation?
                if (this.timeInState > this.bitDuration * 1) {
                    const charCode = txQueue.shift();
                    if (charCode !== undefined) this.startTransmission(charCode);
                }
                return 1;
            }

            // Auto mode fallback
            if (isAutoMode && this.timeInState > this.bitDuration * 4) {
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

    startTransmission(byte: number) {
        this.currentByte = byte;
        this.state = 'START';
        this.timeInState = 0;
        this.bitIndex = 0;
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
                    }
                }
                break;
            case 'PARITY':
                this.state = 'STOP';
                break;
            case 'STOP':
                this.state = 'IDLE';
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
        for (let i = 0; i < txConfig.dataBits; i++) {
            if ((byte >> i) & 1) ones++;
        }
        if (txConfig.parity === 'even') {
            return (ones % 2 === 0) ? 0 : 1;
        } else {
            return (ones % 2 !== 0) ? 0 : 1;
        }
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
    private parityCalculated: number = 0;

    // Returns dot type: 0=None, 1=Red(Start/Error), 2=Yellow(Data), 3=Green(Valid), 4=Purple(Stop), 5=Blue(Parity)
    tick(deltaTime: number, currentRxLevel: number): number {
        this.bitDuration = 1 / rxBaud;

        if (this.state === 'HUNTING') {
            // Detect falling edge (Start Bit)
            if (this.lastRxLevel === 1 && currentRxLevel === 0) {
                this.state = 'SAMPLING';
                this.timeSinceStart = 0;
                this.rxBuffer = 0;
                this.parityCalculated = 0; // Reset parity
            }
            this.lastRxLevel = currentRxLevel;
            return 0;
        }

        if (this.state === 'SAMPLING') {
            const prevTime = this.timeSinceStart;
            this.timeSinceStart += deltaTime;
            this.lastRxLevel = currentRxLevel;

            // Check for timeout / reset
            const totalBits = 1 + rxConfig.dataBits + (rxConfig.parity !== 'none' ? 1 : 0) + rxConfig.stopBits;
            if (this.timeSinceStart > (totalBits + 0.5) * this.bitDuration) {
                this.state = 'HUNTING';
                return 0;
            }

            // Boundary Crossing Detection
            // Sample points are at X.5 bit durations (0.5, 1.5, 2.5...)
            const prevBitPos = prevTime / this.bitDuration;
            const currBitPos = this.timeSinceStart / this.bitDuration;

            // Check if we crossed integer boundary in "shifted" space (bitPos - 0.5)
            // e.g. 0.4 -> 0.6 crosses 0.5. (0.4-0.5=-0.1, 0.6-0.5=0.1. Floor changes from -1 to 0)
            const prevSampleIndex = Math.floor(prevBitPos - 0.5);
            const currSampleIndex = Math.floor(currBitPos - 0.5);

            if (currSampleIndex > prevSampleIndex) {
                // We crossed a sampling point!
                const bitIndex = currSampleIndex; // 0=Start, 1=Data0...

                // Determine what kind of bit this is
                if (bitIndex === 0) return 1; // Start Bit (Red)

                if (bitIndex <= rxConfig.dataBits) {
                    const dataBitIndex = bitIndex - 1;
                    // LSB First
                    if (currentRxLevel === 1) {
                        this.rxBuffer |= (1 << dataBitIndex);
                        this.parityCalculated ^= 1; // Update calculated parity
                    }
                    return 3; // Green (Was 2/Yellow)
                }

                // Parity or Stop
                if (rxConfig.parity !== 'none') {
                    if (bitIndex === rxConfig.dataBits + 1) {
                        const expectedParity = rxConfig.parity === 'even' ? this.parityCalculated : (this.parityCalculated ^ 1);
                        const receivedParity = currentRxLevel;

                        if (receivedParity !== expectedParity) {
                            this.rxEventQueue.push({ type: 'RX_ERROR', payload: 'PARITY_ERROR' });
                            return 2; // Orange for Error
                        }
                        return 5; // Blue for Parity
                    }
                    if (bitIndex > rxConfig.dataBits + 1) {
                        // Stop Bit Logic
                        if (currentRxLevel !== 1) {
                            this.rxEventQueue.push({ type: 'RX_ERROR', payload: 'FRAMING_ERROR' });
                            return 2; // Orange for Error
                        }
                        // Emit Data ONCE
                        if (bitIndex === rxConfig.dataBits + 2) {
                            this.rxEventQueue.push({ type: 'RX_DATA', payload: String.fromCharCode(this.rxBuffer) });
                            return 4;
                        }
                        return 4;
                    }
                } else {
                    if (bitIndex > rxConfig.dataBits) {
                        // Stop Bit Logic (No Parity)
                        if (currentRxLevel !== 1) {
                            this.rxEventQueue.push({ type: 'RX_ERROR', payload: 'FRAMING_ERROR' });
                            return 2; // Orange for Error
                        }
                        // Emit Data ONCE
                        if (bitIndex === rxConfig.dataBits + 1) {
                            this.rxEventQueue.push({ type: 'RX_DATA', payload: String.fromCharCode(this.rxBuffer) });
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
            // Legacy support if needed, or remove? Keeping for now but unused by new code logic
            // if (payload.config) uartConfig = { ...uartConfig, ...payload.config }; 
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

        const dt = 1 / sampleRate;

        const chunk: (number | null)[][] = [[], [], [], [], [], [], []]; // [Time, TX, Start, Data, Valid, Stop, Parity]

        for (let i = 0; i < 4; i++) {
            axisTime += dt;

            const txLevel = transmitter.tick(dt);
            const dotType = receiver.tick(dt, txLevel);

            chunk[0].push(axisTime);
            chunk[1].push(txLevel);

            // Distribute dots to correct series
            const dotY = -0.2;

            chunk[2].push(dotType === 1 ? dotY : null); // Red (Start/Error)
            chunk[3].push(dotType === 2 ? dotY : null); // Yellow (Data)
            chunk[4].push(dotType === 3 ? dotY : null); // Green (Valid)
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

        // Check for Burst Completion
        if (!isAutoMode && txQueue.length === 0 && transmitter.state === 'IDLE' && transmitter.timeInState > transmitter.bitDuration * 5) {
            ctx.postMessage({ type: 'TX_COMPLETE' });
        }

    }, tickRate);
}

export { };
