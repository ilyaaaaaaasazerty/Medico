import { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

interface Theme {
    colors: {
        primary: string;
        background: string;
        card: string;
        text: string;
        textSecondary: string;
        border: string;
        error: string;
        success: string;
        warning: string;
    };
    isDark: boolean;
}

const darkTheme: Theme = {
    colors: {
        primary: '#0A84FF',
        background: '#000000',
        card: '#1C1C1E',
        text: '#FFFFFF',
        textSecondary: '#8E8E93',
        border: '#38383A',
        error: '#FF453A',
        success: '#32D74B',
        warning: '#FF9F0A',
    },
    isDark: true,
};

const lightTheme: Theme = {
    colors: {
        primary: '#007AFF',
        background: '#F2F2F7',
        card: '#FFFFFF',
        text: '#000000',
        textSecondary: '#6C6C70',
        border: '#C6C6C8',
        error: '#FF3B30',
        success: '#34C759',
        warning: '#FF9500',
    },
    isDark: false,
};

const ThemeContext = createContext<Theme>(darkTheme);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

    return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    return useContext(ThemeContext);
}
