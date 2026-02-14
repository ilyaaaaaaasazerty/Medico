import React from 'react';
import {
    TouchableOpacity,
    TouchableOpacityProps,
    StyleSheet,
    ActivityIndicator,
    View,
    ViewStyle,
    TextStyle,
    StyleProp
} from 'react-native';

import Theme from '@/constants/Theme';
import { AppText } from './AppText';

interface AppButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'tonal';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}


export const AppButton: React.FC<AppButtonProps> = ({
    title,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    disabled = false,
    style,
    textStyle,
    ...props
}) => {
    const btnStyles = [
        styles.base,
        styles[variant],
        styles[size],
        (disabled || loading) && styles.disabled,
        style,
    ];

    const textColorMap = {
        primary: 'textInverted',
        secondary: 'primary',
        outline: 'primary',
        ghost: 'primary',
        success: 'textInverted',
        tonal: 'primary',
    } as const;

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            disabled={disabled || loading}
            style={btnStyles}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? Theme.Colors.textInverted : Theme.Colors.primary} />
            ) : (
                <>
                    {icon && <View style={styles.iconContainer}>{icon}</View>}
                    <AppText
                        variant={size === 'sm' ? 'caption' : 'body'}
                        color={textColorMap[variant]}
                        weight="bold"
                        style={[styles.text, textStyle]}
                    >
                        {title}
                    </AppText>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: Theme.Radii.button,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Theme.Spacing.lg,
    },
    primary: {
        backgroundColor: Theme.Colors.primary,
        ...Theme.Shadows.floating,
    },
    secondary: {
        backgroundColor: Theme.Colors.secondaryAlt,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: Theme.Colors.primary,
    },
    ghost: {
        backgroundColor: 'transparent',
    },
    success: {
        backgroundColor: Theme.Colors.success,
        ...Theme.Shadows.floating,
    },
    tonal: {
        backgroundColor: Theme.Colors.secondaryAlt,
    },
    // Sizes
    sm: { height: 36, paddingHorizontal: Theme.Spacing.md },
    md: { height: 54 },
    lg: { height: 64 },
    disabled: {
        backgroundColor: Theme.Colors.disabled,
        borderColor: Theme.Colors.disabled,
        opacity: 0.6,
    },
    text: {
        letterSpacing: 0.5,
    },
    iconContainer: {
        marginRight: Theme.Spacing.sm,
    },
});
