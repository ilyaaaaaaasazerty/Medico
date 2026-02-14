import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import Theme from '@/constants/Theme';

interface AppTextProps extends TextProps {
    variant?: keyof typeof Theme.Typography.Presets;
    color?: keyof typeof Theme.Colors;
    align?: 'left' | 'center' | 'right';
    weight?: keyof typeof Theme.Typography.Weight;
    uppercase?: boolean;
    italic?: boolean;
}

export const AppText: React.FC<AppTextProps> = ({
    variant = 'body',
    color = 'text',
    align = 'left',
    weight,
    uppercase,
    italic,
    style,
    children,
    ...props
}) => {
    const preset = Theme.Typography.Presets[variant];
    const textColor = Theme.Colors[color];
    const fontWeight = weight ? Theme.Typography.Weight[weight] : preset.fontWeight;

    return (
        <RNText
            style={[
                styles.base,
                preset,
                {
                    color: textColor,
                    textAlign: align,
                    fontWeight,
                    textTransform: uppercase ? 'uppercase' : 'none',
                    fontStyle: italic ? 'italic' : 'normal',
                },
                style,
            ]}
            {...props}
        >
            {children}
        </RNText>
    );
};

const styles = StyleSheet.create({
    base: {
        // Any global text defaults
    },
});
