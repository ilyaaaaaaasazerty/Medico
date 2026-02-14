import React from 'react';
import { View, ViewProps, StyleSheet, TouchableOpacity } from 'react-native';
import Theme from '@/constants/Theme';

interface AppCardProps extends ViewProps {
    variant?: 'elevated' | 'outline' | 'glass';
    padding?: keyof typeof Theme.Spacing;
    onPress?: () => void;
}

export const AppCard: React.FC<AppCardProps> = ({
    variant = 'elevated',
    padding = 'md',
    onPress,
    style,
    children,
    ...props
}) => {
    const Component = (onPress ? TouchableOpacity : View) as any;

    return (
        <Component
            activeOpacity={onPress ? 0.9 : 1}
            onPress={onPress}
            style={[
                styles.base,
                styles[variant],
                { padding: Theme.Spacing[padding] },
                style,
            ]}
            {...props}
        >
            {children}
        </Component>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: Theme.Radii.card,
        overflow: 'hidden',
    },
    elevated: {
        backgroundColor: Theme.Colors.surface,
        borderWidth: 1.5,
        borderColor: Theme.Colors.divider,
        ...Theme.Shadows.card,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: Theme.Colors.divider,
    },
    glass: {
        backgroundColor: Theme.Colors.glass,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
});
