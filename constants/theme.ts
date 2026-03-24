export const lightColors = {
  primary:        '#16A34A',
  primaryLight:   '#DCFCE7',
  primaryDark:    '#15803D',
  telegram:       '#2AABEE',
  pending:        '#F59E0B',
  pendingLight:   '#FEF3C7',
  confirmed:      '#16A34A',
  confirmedLight: '#DCFCE7',
  rejected:       '#EF4444',
  rejectedLight:  '#FEE2E2',
  completed:      '#6B7280',
  completedLight: '#F3F4F6',
  cancelled:      '#6B7280',
  cancelledLight: '#F3F4F6',
  bg:             '#F1F5F9',
  card:           '#FFFFFF',
  cardAlt:        '#F8FAFC',
  border:         '#E2E8F0',
  text:           '#0F172A',
  textSecondary:  '#64748B',
  textTertiary:   '#94A3B8',
  surface:        '#FFFFFF',
  overlay:        'rgba(0,0,0,0.5)',
};

export const darkColors = {
  primary:        '#22C55E',
  primaryLight:   '#14532D',
  primaryDark:    '#16A34A',
  telegram:       '#2AABEE',
  pending:        '#FBBF24',
  pendingLight:   '#451A03',
  confirmed:      '#22C55E',
  confirmedLight: '#14532D',
  rejected:       '#F87171',
  rejectedLight:  '#450A0A',
  completed:      '#94A3B8',
  completedLight: '#1E293B',
  cancelled:      '#94A3B8',
  cancelledLight: '#1E293B',
  bg:             '#0F172A',
  card:           '#1E293B',
  cardAlt:        '#162032',
  border:         '#334155',
  text:           '#F8FAFC',
  textSecondary:  '#94A3B8',
  textTertiary:   '#64748B',
  surface:        '#1E293B',
  overlay:        'rgba(0,0,0,0.7)',
};

export type Colors = typeof lightColors;

export const spacing = { xs:4, sm:8, md:12, lg:16, xl:20, xxl:24, xxxl:32 };
export const radius  = { sm:8, md:12, lg:16, xl:20, xxl:28, full:999 };

export const getShadow = (isDark: boolean) => ({
  sm: {
    boxShadow: `0px 1px 3px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(148,163,184,0.08)'}`,
    elevation: 2,
  },
  md: {
    boxShadow: `0px 4px 12px ${isDark ? 'rgba(0,0,0,0.4)' : 'rgba(148,163,184,0.12)'}`,
    elevation: 5,
  },
  lg: {
    boxShadow: `0px 8px 24px ${isDark ? 'rgba(0,0,0,0.5)' : 'rgba(100,116,139,0.15)'}`,
    elevation: 10,
  },
});

export const colors = lightColors;
export const shadow = {
  sm: { boxShadow: '0px 1px 3px rgba(148,163,184,0.08)', elevation: 2 },
  md: { boxShadow: '0px 4px 12px rgba(148,163,184,0.12)', elevation: 5 },
  lg: { boxShadow: '0px 8px 24px rgba(100,116,139,0.15)', elevation: 10 },
};
