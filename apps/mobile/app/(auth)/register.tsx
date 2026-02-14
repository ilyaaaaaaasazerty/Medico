import { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { authApi } from '@/services/auth.api';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppCard, AppInput, AppButton } from '@/components/base';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!phone) {
            newErrors.phone = 'Phone is required';
        } else if (!/^\+?[0-9]{10,15}$/.test(phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Invalid phone format';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            newErrors.password = 'Password must contain uppercase, lowercase, and number';
        }

        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const result = await authApi.register({
                email,
                phone: phone.startsWith('+') ? phone : `+${phone}`,
                password,
                role: 'PATIENT',
            });

            if (result.data?.id) {
                router.push({
                    pathname: '/(auth)/verify-otp',
                    params: { userId: result.data.id, phone },
                });
            } else {
                Alert.alert('Error', 'Registration successful but ID missing.');
            }
        } catch (error: any) {
            const message = error.response?.data?.error || 'Registration failed';
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
                        <AppText variant="hero" color="primary">Join Medico</AppText>
                        <AppText variant="body" color="textSecondary" style={{ marginTop: 4 }}>
                            Start your health journey today.
                        </AppText>
                    </View>

                    <AppCard variant="elevated" padding="lg" style={styles.card}>
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

                        <AppInput
                            label="Phone Number"
                            placeholder="+213XXXXXXXXX"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            error={errors.phone}
                            icon={<Ionicons name="call-outline" size={20} color={Theme.Colors.textSecondary} />}
                        />

                        <AppInput
                            label="Password"
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
                            title={isLoading ? 'Creating Account...' : 'Create Account'}
                            onPress={handleSubmit}
                            loading={isLoading}
                            size="lg"
                            style={{ marginTop: Theme.Spacing.md }}
                        />
                    </AppCard>

                    <View style={styles.footer}>
                        <AppText color="textSecondary">Already have an account? </AppText>
                        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                            <AppText color="primary" weight="bold">Sign in</AppText>
                        </TouchableOpacity>
                    </View>
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
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: Theme.Spacing.md,
        paddingBottom: Theme.Spacing.xl,
    },
});

