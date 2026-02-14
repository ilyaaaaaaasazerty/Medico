import { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { authApi } from '@/services/auth.api';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyOTPScreen() {
    const params = useLocalSearchParams<{ userId: string; phone: string }>();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    const handleChange = (value: string, index: number) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        if (newOtp.every((d) => d !== '')) {
            handleVerify(newOtp.join(''));
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (code: string) => {
        if (!params.userId) {
            Alert.alert('Error', 'Invalid verification session');
            return;
        }

        setIsLoading(true);
        try {
            await authApi.verifyOtp({
                userId: params.userId,
                code,
                type: 'PHONE',
            });

            Alert.alert('Success', 'Your account has been verified!', [
                { text: 'OK', onPress: () => router.replace('/(auth)/login') },
            ]);
        } catch (error: any) {
            const message = error.response?.data?.error || 'Verification failed';
            Alert.alert('Error', message);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend || !params.userId) return;

        try {
            await authApi.resendOtp(params.userId, 'PHONE');
            setCountdown(60);
            setCanResend(false);
            Alert.alert('Success', 'A new OTP has been sent to your phone');
        } catch (error: any) {
            Alert.alert('Error', 'Failed to resend OTP');
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
                        <AppText variant="hero" color="primary">Verify Phone</AppText>
                        <AppText variant="body" color="textSecondary" style={{ marginTop: 4 }}>
                            Enter the 6-digit code sent to{'\n'}
                            <AppText color="text" weight="bold">{params.phone || 'your phone'}</AppText>
                        </AppText>
                    </View>

                    <AppCard variant="elevated" padding="lg" style={styles.card}>
                        <View style={styles.otpContainer}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => { inputRefs.current[index] = ref; }}
                                    style={[
                                        styles.otpInput,
                                        digit && styles.otpInputFilled
                                    ]}
                                    value={digit}
                                    onChangeText={(v) => handleChange(v, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    selectTextOnFocus
                                    placeholder="-"
                                    placeholderTextColor={Theme.Colors.textDisabled}
                                />
                            ))}
                        </View>

                        <AppButton
                            title={isLoading ? 'Verifying...' : 'Verify'}
                            onPress={() => handleVerify(otp.join(''))}
                            disabled={otp.some((d) => !d)}
                            loading={isLoading}
                            size="lg"
                        />

                        <View style={styles.resendRow}>
                            <AppText color="textSecondary">Didn't receive code? </AppText>
                            {canResend ? (
                                <TouchableOpacity onPress={handleResend}>
                                    <AppText color="primary" weight="bold">Resend</AppText>
                                </TouchableOpacity>
                            ) : (
                                <AppText color="textSecondary" weight="semiBold">
                                    Resend in {countdown}s
                                </AppText>
                            )}
                        </View>
                    </AppCard>

                    <AppText color="textSecondary" style={styles.devHint}>
                        💡 Check the backend console for the OTP code
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
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Theme.Spacing.xl,
    },
    otpInput: {
        width: 45,
        height: 55,
        backgroundColor: Theme.Colors.surfaceAlt,
        borderRadius: Theme.Radii.md,
        borderWidth: 2,
        borderColor: Theme.Colors.divider,
        color: Theme.Colors.text,
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    otpInputFilled: {
        borderColor: Theme.Colors.secondary,
        backgroundColor: Theme.Colors.surface,
    },
    resendRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: Theme.Spacing.lg,
    },
    devHint: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: Theme.Spacing.xxl,
        opacity: 0.6,
    },
});

