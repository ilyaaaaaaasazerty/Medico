import { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { authApi } from '@/services/auth.api';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppCard, AppInput, AppButton } from '@/components/base';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
    const [step, setStep] = useState<'email' | 'reset'>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateEmail = () => {
        const newErrors: Record<string, string> = {};
        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Invalid email format';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateReset = () => {
        const newErrors: Record<string, string> = {};
        if (!code || code.length !== 6) {
            newErrors.code = 'Enter the 6-digit code';
        }
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }
        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSendCode = async () => {
        if (!validateEmail()) return;

        setIsLoading(true);
        try {
            await authApi.forgotPassword(email);
            setStep('reset');
            Alert.alert('Code Sent', 'Check your email for the reset code.');
        } catch (error: any) {
            setStep('reset');
            Alert.alert('Code Sent', 'If the email exists, a reset code has been sent.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!validateReset()) return;

        setIsLoading(true);
        try {
            await authApi.resetPassword({ email, code, password });
            Alert.alert('Success', 'Your password has been reset!', [
                { text: 'OK', onPress: () => router.replace('/(auth)/login') },
            ]);
        } catch (error: any) {
            const message = error.response?.data?.error || 'Password reset failed';
            Alert.alert('Error', message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.container}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>

                <View style={styles.content}>
                    <View style={styles.header}>
                        <AppText variant="hero" color="primary">Reset Password</AppText>
                        <AppText variant="body" color="textSecondary" style={{ marginTop: 4 }}>
                            {step === 'email'
                                ? 'Enter your email to receive a reset code'
                                : 'Enter the code and your new password'}
                        </AppText>
                    </View>

                    <AppCard variant="elevated" padding="lg" style={styles.card}>
                        {step === 'email' ? (
                            <View style={styles.form}>
                                <AppInput
                                    label="Email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    error={errors.email}
                                    icon={<Ionicons name="mail-outline" size={20} color={Theme.Colors.textSecondary} />}
                                />

                                <AppButton
                                    title={isLoading ? 'Sending...' : 'Send Reset Code'}
                                    onPress={handleSendCode}
                                    loading={isLoading}
                                    size="lg"
                                />
                            </View>
                        ) : (
                            <View style={styles.form}>
                                <AppInput
                                    label="Reset Code"
                                    placeholder="6-digit code"
                                    value={code}
                                    onChangeText={setCode}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    error={errors.code}
                                    icon={<Ionicons name="keypad-outline" size={20} color={Theme.Colors.textSecondary} />}
                                />

                                <AppInput
                                    label="New Password"
                                    placeholder="Min 8 characters"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    error={errors.password}
                                    icon={<Ionicons name="lock-closed-outline" size={20} color={Theme.Colors.textSecondary} />}
                                />

                                <AppInput
                                    label="Confirm Password"
                                    placeholder="Re-enter password"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                    error={errors.confirmPassword}
                                    icon={<Ionicons name="checkmark-circle-outline" size={20} color={Theme.Colors.textSecondary} />}
                                />

                                <AppButton
                                    title={isLoading ? 'Resetting...' : 'Reset Password'}
                                    onPress={handleResetPassword}
                                    loading={isLoading}
                                    size="lg"
                                />

                                <TouchableOpacity onPress={handleSendCode} style={styles.resendBtn}>
                                    <AppText color="primary" weight="bold">Resend Code</AppText>
                                </TouchableOpacity>
                            </View>
                        )}
                    </AppCard>

                    <AppText color="textSecondary" style={styles.devHint}>
                        💡 Check the backend console for the reset code
                    </AppText>
                </View>
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: Theme.Spacing.lg,
        paddingTop: Theme.Spacing.xl,
        paddingBottom: Theme.Spacing.xxl,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: Theme.Radii.md,
        backgroundColor: Theme.Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Theme.Spacing.xl,
        borderWidth: 1,
        borderColor: Theme.Colors.divider,
    },
    content: {
        flex: 1,
    },
    header: {
        marginBottom: Theme.Spacing.xxl,
    },
    card: {
        marginBottom: Theme.Spacing.xl,
    },
    form: {
        gap: Theme.Spacing.md,
    },
    resendBtn: {
        alignItems: 'center',
        marginTop: Theme.Spacing.sm,
    },
    devHint: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: Theme.Spacing.xxl,
        opacity: 0.6,
    },
});

