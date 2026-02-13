export const BAUD_RATES = [300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200];

export const getDisplayBaud = (val: number): number => {
    const index = Math.min(Math.floor(val) - 1, BAUD_RATES.length - 1);
    return BAUD_RATES[index] || 9600;
};
