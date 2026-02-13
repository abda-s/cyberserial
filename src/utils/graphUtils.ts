export const clampViewRange = (
    newMin: number,
    newMax: number,
    dataMin: number,
    dataMax: number
): { min: number, max: number } => {
    let clampedMin = newMin;
    let clampedMax = newMax;

    // 1. Min cannot be less than dataMin
    if (clampedMin < dataMin) {
        const diff = dataMin - clampedMin;
        clampedMin += diff;
        clampedMax += diff;
    }

    // 2. Max: Strict clamp to dataMax, UNLESS data is smaller than window
    const currentWindow = clampedMax - clampedMin;
    const limit = Math.max(dataMax, currentWindow);

    if (clampedMax > limit) {
        const diff = clampedMax - limit;
        clampedMax -= diff;
        clampedMin -= diff;
    }

    return { min: clampedMin, max: clampedMax };
};
