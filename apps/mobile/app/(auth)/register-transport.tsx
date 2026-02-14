import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppCard, AppInput, AppButton } from '@/components/base';
import { authApi } from '@/services/auth.api';

export default function RegisterTransportScreen() {
    const [companyName, setCompanyName] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [transportType, setTransportType] = useState<'AMBULANCE' | 'NON_EMERGENCY'>('AMBULANCE');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async () => {
        if (!companyName || !licenseNumber || !email || !phone || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        if (password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);
        try {
            const response = await authApi.registerTransport({
                email,
                phone,
                password,
                companyName,
                licenseNumber,
                type: transportType,
            });

            if (response.success) {
                Alert.alert(
                    'Registration Successful',
                    'Please verify your phone number to complete registration.',
                    [{ text: 'OK', onPress: () => router.push({ pathname: '/(auth)/verify-otp', params: { userId: response.data?.id } }) }]
                );
            } else {
                Alert.alert('Error', response.error || 'Registration failed');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppScreen padding={false} scrollable={true}>
            <View style={styles.container}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>

                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.iconBox}>
                            <Ionicons name="car" size={40} color={Theme.Colors.primary} />
                        </View>
                        <AppText variant="h2" weight="black" style={styles.headerTitle}>Transport Registration</AppText>
                        <AppText variant="body" color="textSecondary" align="center">Join as a taxi or ambulance service provider</AppText>
                    </View>

                    <AppCard style={styles.card} padding="lg">
                        <AppText variant="caption" color="textSecondary" weight="bold" style={styles.sectionLabel}>SERVICE TYPE</AppText>
                        
                        <View style={styles.typeRow}>
                            <TouchableOpacity
                                style={[styles.typeOption, transportType === 'AMBULANCE' && styles.typeActive]}
                                onPress={() => setTransportType('AMBULANCE')}
                            >
                                <Ionicons name="medkit" size={24} color={transportType === 'AMBULANCE' ? Theme.Colors.primary : Theme.Colors.textSecondary} />
                                <AppText variant="caption" weight="bold" color={transportType === 'AMBULANCE' ? 'primary' : 'textSecondary'}>Ambulance</AppText>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.typeOption, transportType === 'NON_EMERGENCY' && styles.typeActive]}
                                onPress={() => setTransportType('NON_EMERGENCY')}
                            >
                                <Ionicons name="car" size={24} color={transportType === 'NON_EMERGENCY' ? Theme.Colors.primary : Theme.Colors.textSecondary} />
                                <AppText variant="caption" weight="bold" color={transportType === 'NON_EMERGENCY' ? 'primary' : 'textSecondary'}>Medical Taxi</AppText>
                            </TouchableOpacity>
                        </View>

                        <AppInput
                            label="Company / Driver Name"
                            placeholder="Your company or full name"
                            value={companyName}
                            onChangeText={setCompanyName}
                            icon={<Ionicons name="business-outline" size={20} color={Theme.Colors.textSecondary} />}
                        />

                        <AppInput
                            label="License Number"
                            placeholder="e.g. DZ-12345678"
                            value={licenseNumber}
                            onChangeText={setLicenseNumber}
                            icon={<Ionicons name="card-outline" size={20} color={Theme.Colors.textSecondary} />}
                        />

                        <AppInput
                            label="Email"
                            placeholder="your@email.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            icon={<Ionicons name="mail-outline" size={20} color={Theme.Colors.textSecondary} />}
                        />

                        <AppInput
                            label="Phone"
                            placeholder="+213 555 123 456"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            icon={<Ionicons name="call-outline" size={20} color={Theme.Colors.textSecondary} />}
                        />

                        <AppInput
                            label="Password"
                            placeholder="Min 8 characters"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            icon={<Ionicons name="lock-closed-outline" size={20} color={Theme.Colors.textSecondary} />}
                        />

                        <AppInput
                            label="Confirm Password"
                            placeholder="Repeat password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            icon={<Ionicons name="lock-closed-outline" size={20} color={Theme.Colors.textSecondary} />}
                        />

                        <AppButton
                            title={isLoading ? 'Creating Account...' : 'Register as Provider'}
                            onPress={handleRegister}
                            disabled={isLoading}
                            style={styles.submitBtn}
                        />
                    </AppCard>

                    <View style={styles.footer}>
                        <AppText variant="body" color="textSecondary">Already have an account? </AppText>
                        <Link href="/(auth)/login" asChild>
                            <TouchableOpacity>
                                <AppText variant="body" color="primary" weight="bold">Sign In</AppText>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    backButton: { position: 'absolute', top: 20, left: 20, zIndex: 10, width: 44, height: 44, borderRadius: 14, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 80 },
    header: { alignItems: 'center', marginBottom: 32 },
    headerTitle: { marginTop: 16, marginBottom: 8 },
    iconBox: { width: 80, height: 80, borderRadius: 24, backgroundColor: Theme.Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
    card: { borderWidth: 1, borderColor: Theme.Colors.divider },
    sectionLabel: { marginBottom: 12 },
    typeRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    typeOption: { flex: 1, padding: 16, borderRadius: 16, backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider, alignItems: 'center', gap: 8 },
    typeActive: { borderColor: Theme.Colors.primary, backgroundColor: Theme.Colors.primary + '10' },
    submitBtn: { marginTop: 16 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, marginBottom: 40 },
});