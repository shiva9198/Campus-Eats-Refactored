import { Platform } from 'react-native';
import { scale, vScale, mScale, normalize } from '../utils/responsive';

export const theme = {
    colors: {
        // Brand
        primary: '#FF6B00',        // Campus Orange
        primarySoft: 'rgba(255, 107, 0, 0.15)', // Active chip bg / Glow base

        // Backgrounds
        background: '#121212',     // Deepest Dark (Main bg)
        surface: '#1E1E1E',        // Card/Modal bg
        surfaceLight: '#2C2C2C',   // Lighter surface for contrast

        // Text
        text: '#FFFFFF',           // Primary text
        textSecondary: '#BBBBBB',  // Secondary text

        // Functional
        success: '#4CAF50',        // Mint Green
        error: '#F44336',          // Chilli Red
        warning: '#FFC107',        // Amber

        // UI Elements
        border: '#2E2E2E',         // Subtle borders
        divider: '#2A2A2A',

        // Components
        cardBorder: 'rgba(255, 107, 0, 0.1)', // Subtle orange tint on borders
        inputBg: '#252525',
    },
    spacing: {
        xs: scale(4),
        s: scale(8),
        m: scale(16),
        l: scale(24),
        xl: scale(32),
        xxl: scale(40),
    },
    borderRadius: {
        s: scale(8),
        m: scale(12),
        l: scale(16),
        xl: scale(20),
        round: 999,
    },
    shadows: {
        small: Platform.select({
            web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.3)' },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: vScale(2) },
                shadowOpacity: 0.3,
                shadowRadius: scale(4),
                elevation: 3,
            }
        }),
        medium: Platform.select({
            web: { boxShadow: '0px 4px 8px rgba(0,0,0,0.4)' },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: vScale(4) },
                shadowOpacity: 0.4,
                shadowRadius: scale(8),
                elevation: 6,
            }
        }),
        glow: Platform.select({
            web: { boxShadow: '0px 0px 10px rgba(255,107,0,0.4)' },
            default: {
                shadowColor: '#FF6B00',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: scale(10),
                elevation: 8,
            }
        }),
        glowPhant: Platform.select({
            web: { boxShadow: '0px 2px 12px rgba(255,107,0,0.6)' },
            default: {
                shadowColor: '#FF6B00',
                shadowOffset: { width: 0, height: vScale(2) },
                shadowOpacity: 0.6,
                shadowRadius: scale(12),
                elevation: 10,
            }
        })
    },
    typography: {
        header: {
            fontSize: normalize(28),
            fontWeight: '700',
            color: '#FFFFFF',
            letterSpacing: 0.5,
        },
        subheader: {
            fontSize: normalize(20),
            fontWeight: '600',
            color: '#E0E0E0',
            letterSpacing: 0.25,
        },
        body: {
            fontSize: normalize(16),
            lineHeight: vScale(24),
            color: '#E0E0E0',
        },
        caption: {
            fontSize: normalize(14),
            lineHeight: vScale(20),
            color: '#BBBBBB',
        },
        button: {
            fontSize: normalize(16),
            fontWeight: '700',
            color: '#FFFFFF',
            letterSpacing: 0.8,
            textTransform: 'uppercase',
        }
    }
};
