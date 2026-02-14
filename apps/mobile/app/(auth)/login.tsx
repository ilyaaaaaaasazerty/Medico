import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Link, router } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppCard, AppInput, AppButton } from '@/components/base';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            const userData = await login(email, password);
            // Route based on user role
            if (userData?.role === 'TRANSPORT_PROVIDER') {
                router.replace('/(transport)');
            } else if (userData?.role === 'DOCTOR') {
                router.replace('/(app)/(doctor-tabs)');
            } else if (userData?.role === 'CLINIC_ADMIN') {
                router.replace('/(app)/clinic-dashboard');
            } else if (userData?.role === 'LAB_ADMIN') {
                router.replace('/(app)/lab-dashboard');
            } else {
                router.replace('/(app)/(tabs)');
            }
        } catch (error: any) {
            console.log('Login error:', error);
            // Show the actual error message
            let message = 'Login failed';
            if (error.response?.data?.error) {
                message = error.response.data.error;
            } else if (error.message) {
                message = error.message;
            }
            Alert.alert('Login Failed', message);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <AppScreen padding={false} scrollable={true}>
            <View style={styles.container}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>

                <View style={styles.content}>
                    <View style={styles.header}>
                        <AppText variant="hero" color="primary">Welcome back</AppText>
                        <AppText variant="body" color="textSecondary" style={{ marginTop: 4 }}>
                            Sign in to your account
                        </AppText>
                    </View>

                    <AppCard variant="elevated" padding="lg" style={styles.card}>
                        <AppInput
                            label="Email"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            icon={<Ionicons name="mail-outline" size={20} color={Theme.Colors.textSecondary} />}
                        />

                        <AppInput
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            icon={<Ionicons name="lock-closed-outline" size={20} color={Theme.Colors.textSecondary} />}
                        />

                        <Link href="/(auth)/forgot-password" asChild>
                            <TouchableOpacity style={styles.forgotBtn}>
                                <AppText color="primary" weight="bold" style={{ fontSize: 14 }}>
                                    Forgot password?
                                </AppText>
                            </TouchableOpacity>
                        </Link>

                        <AppButton
                            title={isLoading ? 'Signing in...' : 'Sign In'}
                            onPress={handleLogin}
                            loading={isLoading}
                            size="lg"
                            style={{ marginTop: Theme.Spacing.md }}
                        />
                    </AppCard>
                </View>

                <View style={styles.footer}>
                    <AppText color="textSecondary">Don't have an account? </AppText>
                    <Link href="/(auth)/register" asChild>
                        <TouchableOpacity>
                            <AppText color="primary" weight="bold">Sign up</AppText>
                        </TouchableOpacity>
                    </Link>
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
    forgotBtn: {
        alignSelf: 'flex-end',
        marginBottom: Theme.Spacing.lg,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 'auto',
    },
});
