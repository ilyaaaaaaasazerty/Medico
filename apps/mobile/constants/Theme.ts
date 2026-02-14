import { Platform } from 'react-native';
import Colors from './Colors';

const Theme = {
    Colors: {
        // Core Branding (teal accents pop on dark)
        primary: Colors.oceanic400,      // Vibrant teal as primary
        primaryAlt: Colors.oceanic500,
        secondary: Colors.mint500,
        secondaryAlt: Colors.mint200,
        accent: Colors.gold,

        // Dark Mode Surfaces
        background: Colors.dark900,      // Deepest background
        surface: Colors.dark800,         // Cards, modals
        surfaceAlt: Colors.dark700,      // Elevated surfaces
        surfaceSubtle: Colors.dark600,   // Subtle elevation

        // Text (light on dark)
        text: Colors.textPrimary,        // Primary text
        textSecondary: Colors.textSecondary,
        textTertiary: Colors.textTertiary,
        textInverted: Colors.dark900,    // For buttons with light bg
        textDisabled: Colors.textMuted,

        // Interactions & Feedback
        overlayPrimary: Colors.glassAccent,    // Teal glow
        overlaySubtle: 'rgba(255, 255, 255, 0.04)',
        overlayPressed: 'rgba(255, 255, 255, 0.08)',

        focus: Colors.oceanic400,
        disabled: Colors.dark500,
        divider: Colors.dark600,

        outline: 'rgba(78, 205, 196, 0.3)',    // Teal outline
        focusOutline: Colors.oceanic400,

        // Semantic Messaging
        success: Colors.radiant,
        error: Colors.rose,
        warning: Colors.amber,

        // Overlays
        glass: Colors.glassLight,
        glow: Colors.oceanic400,

        // Backward Compatibility Aliases
        card: Colors.dark800,
        white: Colors.white,
        black: Colors.black,
    },

    Spacing: {
        // Primitive scale for ad-hoc spacing
        none: 0,
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },

    Radii: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        xxl: 32,
        card: 32,
        button: 18,
        input: 16,
        chip: 12,
        full: 9999,
    },

    Shadows: {
        card: {
            ...Platform.select({
                ios: {
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                },
                android: { elevation: 4 },
            }),
        },
        floating: {
            ...Platform.select({
                ios: {
                    shadowColor: '#4ECDC4', // Teal glow
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.25,
                    shadowRadius: 20,
                },
                android: { elevation: 8 },
            }),
        },
        soft: {
            ...Platform.select({
                ios: {
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 6,
                },
                android: { elevation: 2 },
            }),
        },
        primary: {
            ...Platform.select({
                ios: {
                    shadowColor: '#4ECDC4', // Teal glow for primary elements
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 16,
                },
                android: { elevation: 6 },
            }),
        },
        md: {
            ...Platform.select({
                ios: {
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                },
                android: { elevation: 3 },
            }),
        },
        medium: {
            ...Platform.select({
                ios: {
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                },
                android: { elevation: 3 },
            }),
        },
        small: {
            ...Platform.select({
                ios: {
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                },
                android: { elevation: 1 },
            }),
        },
        large: {
            ...Platform.select({
                ios: {
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.3,
                    shadowRadius: 20,
                },
                android: { elevation: 10 },
            }),
        },

    },



    Typography: {
        Scale: {
            hero: 34,
            title: 26,
            h1: 28,
            h2: 22,
            h3: 20,
            body: 16,
            caption: 12,
            small: 10,
        },
        Weight: {
            black: '900' as const,
            bold: '800' as const,
            semiBold: '700' as const,
            medium: '600' as const,
            regular: '500' as const,
        },
        Presets: {
            hero: {
                fontSize: 34,
                fontWeight: '900' as const,
                letterSpacing: -1,
                // Color is NOT set here, but applied as a style property in components
            },
            title: {
                fontSize: 26,
                fontWeight: '900' as const,
                letterSpacing: -0.5,
            },
            h1: {
                fontSize: 28,
                fontWeight: '900' as const,
                letterSpacing: -0.5,
            },
            h2: {
                fontSize: 22,
                fontWeight: '800' as const,
                letterSpacing: -0.5,
            },
            h3: {
                fontSize: 20,
                fontWeight: '800' as const,
                letterSpacing: -0.5,
            },
            body: {
                fontSize: 16,
                fontWeight: '600' as const,
                lineHeight: 24,
            },
            caption: {
                fontSize: 12,
                fontWeight: '800' as const,
                textTransform: 'uppercase' as const,
                letterSpacing: 1,
            },
        },

    },

    Layout: {
        screenPadding: 24,
        elementGap: 16,
        sectionGap: 32,
        headerHeight: Platform.OS === 'ios' ? 120 : 100,
        headerTopPadding: Platform.OS === 'ios' ? 50 : 30, // Safe area-aware top padding for headers
        bottomTabHeight: Platform.OS === 'ios' ? 90 : 70,
        contentMaxWidth: 600,
    }
};

export default Theme;
