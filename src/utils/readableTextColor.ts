import { contrastRatio } from './contrastRatio';

// Design 3.1 bounds every silk color against these bib text colors.
export const DARK_TEXT = '#151515';
export const LIGHT_TEXT = '#f5f5f5';

export function readableTextColor(background: string): typeof DARK_TEXT | typeof LIGHT_TEXT {
    return contrastRatio(background, DARK_TEXT) >= contrastRatio(background, LIGHT_TEXT)
        ? DARK_TEXT
        : LIGHT_TEXT;
}
