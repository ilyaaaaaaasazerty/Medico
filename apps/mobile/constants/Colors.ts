const Colors = {
    // Oceanic Palette (kept for branding)
    oceanic900: '#0D5D56', // Deep teal
    oceanic700: '#157A71',
    oceanic500: '#2A9D8F',
    oceanic400: '#4ECDC4', // Vibrant teal for dark mode accents

    // Mint Palette (adjusted for dark mode)
    mint500: '#A7D7C5',
    mint200: '#D1EAE0',

    // Dark Mode Backgrounds
    dark900: '#0A0F14', // Deepest background
    dark800: '#121A21', // Card/surface background
    dark700: '#1A242D', // Elevated surfaces
    dark600: '#222F3A', // Subtle borders/dividers
    dark500: '#2D3D4A', // Lighter borders

    // Dark Mode Text
    textPrimary: '#F4F7FA',   // Primary text (near white)
    textSecondary: '#94A3B8', // Secondary text (muted)
    textTertiary: '#64748B',  // Tertiary/disabled text
    textMuted: '#475569',     // Very muted text

    // Functional (adjusted for dark mode)
    emerald: '#10B981',
    rose: '#F87171',    // Softer red for dark mode
    amber: '#FBBF24',   // Brighter amber for dark mode
    gold: '#D4A373',
    radiant: '#4ECDC4', // Professional teal accent

    white: '#FFFFFF',
    black: '#000000',

    // Transparent layers for dark mode
    glassLight: 'rgba(255, 255, 255, 0.08)',
    glassDark: 'rgba(0, 0, 0, 0.5)',
    glassAccent: 'rgba(78, 205, 196, 0.15)', // Teal glow

    // ============================================
    // BACKWARD COMPATIBILITY ALIASES
    // ============================================
    // These are referenced by older components
    primary: '#4ECDC4',
    secondary: '#2A9D8F',
    accent: '#4ECDC4',
    background: '#0A0F14',
    surface: '#121A21',
    card: '#121A21',
    text: '#F4F7FA',
    border: '#222F3A',
    divider: '#222F3A',
    error: '#F87171',
    success: '#10B981',
    warning: '#FBBF24',
    info: '#60A5FA',
    shadow: 'rgba(0, 0, 0, 0.3)',
};

export default Colors;

