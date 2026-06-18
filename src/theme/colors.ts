import { lightColors } from './palettes';

/** @deprecated Prefer useTheme().colors in components */
export const colors = lightColors;

export type Colors = typeof lightColors;

export { lightColors, darkColors, type AppColors } from './palettes';
