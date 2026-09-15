const HEX_COLOR = /^#([\da-f]{3}|[\da-f]{6})$/i;

// WCAG 2.2 relative luminance of an sRGB color.
export function relativeLuminance(color: string): number {
    const digits = HEX_COLOR.exec(color)?.[1];
    if (!digits) {
        throw new Error(`relativeLuminance: expected a #rgb or #rrggbb color, received ${color}`);
    }
    const hex = digits.length === 3 ? [...digits].map((digit) => digit + digit).join('') : digits;
    const channel = (start: number): number => {
        const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };

    return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

export function contrastRatio(first: string, second: string): number {
    const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort(
        (a, b) => b - a
    ) as [number, number];

    return (lighter + 0.05) / (darker + 0.05);
}
