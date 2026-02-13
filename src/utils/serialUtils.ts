export const BAUD_RATES = [300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200];

export const DEFAULT_SPEED = 0.001;
export const DEFAULT_BAUD_RATE = 9600;
export const DEFAULT_WINDOW_SIZE = 0.005; // Default to 5ms (reasonable for 9600 baud)

export const getDisplayBaud = (val: number): number => {
    const index = Math.min(Math.floor(val) - 1, BAUD_RATES.length - 1);
    return BAUD_RATES[index] || 9600;
};

export const calculateWindowSize = (baudRate: number): number => {
    // Show approximately 5 UART frames (10 bits each for 8N1 configuration)
    const bitsPerFrame = 10;
    const numberOfFrames = 5;
    return (bitsPerFrame * numberOfFrames) / baudRate;
};
