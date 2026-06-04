export const typography = {
  headlineXl: {
    fontFamily: 'Be Vietnam Pro',
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.64,
  },
  headlineLg: {
    fontFamily: 'Be Vietnam Pro',
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  headlineMd: {
    fontFamily: 'Be Vietnam Pro',
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  bodyLg: {
    fontFamily: 'Be Vietnam Pro',
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMd: {
    fontFamily: 'Be Vietnam Pro',
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  labelMd: {
    fontFamily: 'Be Vietnam Pro',
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0.6,
  },
  headlineLgMobile: {
    fontFamily: 'Be Vietnam Pro',
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
  },
};

export type Typography = typeof typography;
