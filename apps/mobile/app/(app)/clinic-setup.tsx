import { useState } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { clinicApi } from '@/services/clinic.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppInput, AppButton } from '@/components/base';
import Theme from '@/constants/Theme';

export default function ClinicSetupScreen() {
    const router = useRouter();
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: 'Algeria',
        postalCode: '',
        description: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!form.name.trim()) newErrors.name = 'Practice name is required';
        if (!form.email.trim() || !form.email.includes('@')) newErrors.email = 'Valid corporate email required';
        if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
        if (!form.address.trim()) newErrors.address = 'Primary address is required';
        if (!form.city.trim()) newErrors.city = 'City is required';
        if (!form.state.trim()) newErrors.state = 'State is required';
        if (!form.postalCode.trim()) newErrors.postalCode = 'Postal code is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setIsLoading(true);
        try {
            const result = await clinicApi.registerClinic({
                ...form,
                description: form.description.trim() || undefined,
            });

            if (result.success) {
                Alert.alert('Registration Successful', 'Your medical practice has been registered on the platform.', [
                    {
                        text: 'Go to Dashboard',
                        onPress: () => router.replace('/(app)/clinic-dashboard')
                    },
                ]);
            } else {
                Alert.alert('Registration Failed', result.error || 'Check fields and try again.');
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'An unexpected error occurred during registration.');
        } finally {
            setIsLoading(false);
        }
    };

    const updateForm = (key: string, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
        if (errors[key]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[key];
                return newErrors;
            });
        }
    };

    return (
        <AppScreen padding={false} scrollable>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <AppButton
                        variant="tonal"
                        size="sm"
                        onPress={() => router.back()}
                        style={styles.backBtn}
                        title="BACK"
                        icon={<Ionicons name="arrow-back" size={20} color={Theme.Colors.primary} />}
                    />

                    <View style={styles.headerText}>
                        <AppText variant="h2" weight="black">Practice Registration</AppText>
                        <AppText variant="body" color="textSecondary">Facility credentialing & setup</AppText>
                    </View>
                </View>

                <View style={styles.content}>
                    <View style={styles.section}>
                        <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Identity</AppText>
                        <AppInput
                            label="Official Practice Name"
                            placeholder="e.g., Al-Amal Medical Center"
                            value={form.name}
                            onChangeText={(v) => updateForm('name', v)}
                            error={errors.name}
                        />
                        <View style={styles.row}>
                            <View style={{ flex: 1.2 }}>
                                <AppInput
                                    label="Corporate Email"
                                    placeholder="contact@practice.com"
                                    value={form.email}
                                    onChangeText={(v) => updateForm('email', v)}
                                    error={errors.email}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <AppInput
                                    label="Contact Phone"
                                    placeholder="+213..."
                                    value={form.phone}
                                    onChangeText={(v) => updateForm('phone', v)}
                                    error={errors.phone}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Location</AppText>
                        <AppInput
                            label="Primary Street Address"
                            placeholder="Building number, Street name"
                            value={form.address}
                            onChangeText={(v) => updateForm('address', v)}
                            error={errors.address}
                        />
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <AppInput
                                    label="City"
                                    placeholder="Algiers"
                                    value={form.city}
                                    onChangeText={(v) => updateForm('city', v)}
                                    error={errors.city}
                                />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <AppInput
                                    label="Wilaya / State"
                                    placeholder="Algiers"
                                    value={form.state}
                                    onChangeText={(v) => updateForm('state', v)}
                                    error={errors.state}
                                />
                            </View>
                        </View>
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <AppInput
                                    label="Country"
                                    value={form.country}
                                    editable={false}
                                />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <AppInput
                                    label="Postal Code"
                                    placeholder="16000"
                                    value={form.postalCode}
                                    onChangeText={(v) => updateForm('postalCode', v)}
                                    error={errors.postalCode}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Operations</AppText>
                        <AppInput
                            label="Operational Summary"
                            placeholder="Briefly describe the clinical specialties and services provided..."
                            value={form.description}
                            onChangeText={(v) => updateForm('description', v)}
                            multiline
                            numberOfLines={4}
                            style={{ height: 120, textAlignVertical: 'top' }}
                        />
                    </View>

                    <AppButton
                        title="Initialize Practice"
                        onPress={handleSubmit}
                        loading={isLoading}
                        style={styles.submitBtn}
                    />

                    <View style={{ height: 60 }} />
                </View>
            </KeyboardAvoidingView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { paddingHorizontal: 24, paddingVertical: 24, paddingTop: 60, flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
    backBtn: { width: 44, height: 44, borderRadius: 14, paddingHorizontal: 0 },
    headerText: { flex: 1 },
    content: { paddingHorizontal: 24 },
    section: { marginBottom: 32 },
    sectionTitle: { marginBottom: 16, letterSpacing: 1 },
    row: { flexDirection: 'row' },
    submitBtn: { marginTop: 8, height: 64, borderRadius: 24 },
});
