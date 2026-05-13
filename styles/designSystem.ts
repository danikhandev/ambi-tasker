// Central design system constants for AmbiTasker

export const COLORS = {
  PRIMARY: '#0F62FE', // brand blue
  SECONDARY: '#00BFA6',
  BACKGROUND: '#F7F9FC',
  CARD: '#FFFFFF',
  TEXT: '#0B1220',
  TEXT_MUTED: '#6B7280',
  BORDER: '#E6E9EF',
  DANGER: '#E11D48'
};

export const TYPOGRAPHY = {
  FONT_FAMILY_BASE: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
  H1: { size: '28px', weight: 700, lineHeight: 1.2 },
  H2: { size: '22px', weight: 700, lineHeight: 1.3 },
  H3: { size: '18px', weight: 600, lineHeight: 1.4 },
  BODY: { size: '14px', weight: 400, lineHeight: 1.5 },
  SMALL: { size: '12px', weight: 400, lineHeight: 1.3 },
};

export const SPACING = (multiplier = 1) => `${8 * multiplier}px`;

export const BORDER_RADIUS = '12px';
export const SHADOW = '0 6px 18px rgba(9, 30, 66, 0.08)';

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOW,
};
