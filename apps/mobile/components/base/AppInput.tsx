import React, { useState, useRef } from 'react';
import {
    View,
    TextInput,
    TextInputProps,
    StyleSheet,
    Animated,
    StyleProp,
    ViewStyle,
    TextStyle,
    Pressable
} from 'react-native';
import Theme from '@/constants/Theme';
import { AppText } from './AppText';

interface AppInputProps extends TextInputProps {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    containerStyle?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
}

export const AppInput: React.FC<AppInputProps> = ({
    label,
    error,
    icon,
    containerStyle,
    inputStyle,
    onFocus,
    onBlur,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const handleFocus = (e: any) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        onBlur?.(e);
    };

    const handleContainerPress = () => {
        inputRef.current?.focus();
    };

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <AppText
                    variant="caption"
                    color="textSecondary"
                    style={styles.label}
                >
                    {label}
                </AppText>
            )}
            <Pressable
                onPress={handleContainerPress}
                style={[
                    styles.inputWrapper,
                    isFocused && styles.inputFocused,
                    !!error && styles.inputError,
                ]}
            >
                {icon && <View style={styles.icon}>{icon}</View>}
                <TextInput
                    ref={inputRef}
                    style={[styles.input, inputStyle]}
                    placeholderTextColor={Theme.Colors.textDisabled}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    {...props}
                />
            </Pressable>
            {error && (
                <AppText
                    variant="caption"
                    color="error"
                    style={styles.errorText}
                >
                    {error}
                </AppText>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Theme.Layout.elementGap,
    },
    label: {
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.Colors.surface,
        borderRadius: Theme.Radii.input,
        borderWidth: 1.5,
        borderColor: Theme.Colors.divider,
        minHeight: 56,
        paddingHorizontal: Theme.Spacing.md,
        paddingVertical: Theme.Spacing.sm,
    },
    inputFocused: {
        borderColor: Theme.Colors.primary,
        backgroundColor: Theme.Colors.surface,
        ...Theme.Shadows.floating,
    },
    inputError: {
        borderColor: Theme.Colors.error,
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: Theme.Colors.text,
        fontSize: Theme.Typography.Scale.body,
        fontWeight: Theme.Typography.Weight.medium as any,
    },
    errorText: {
        marginTop: 4,
        marginLeft: 4,
    },
});
