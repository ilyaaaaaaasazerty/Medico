import { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { patientApi } from '@/services/patient.api';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppCard, AppInput, AppButton } from '@/components/base';
import { Ionicons } from '@expo/vector-icons';

type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export default function ProfileSetupScreen() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState<Gender>('MALE');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const genders: { key: Gender; label: string; icon: string }[] = [
        { key: 'MALE', label: 'Male', icon: 'male' },
        { key: 'FEMALE', label: 'Female', icon: 'female' },
        { key: 'OTHER', label: 'Other', icon: 'person' },
    ];

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }
        if (!lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }
        if (!dateOfBirth) {
            newErrors.dateOfBirth = 'Date of birth is required';
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
            newErrors.dateOfBirth = 'Use format: YYYY-MM-DD';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setIsLoading(true);
        try {
            const result = await patientApi.createProfile({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                dateOfBirth,
                gender,
                height: height ? parseFloat(height) : undefined,
                weight: weight ? parseFloat(weight) : undefined,
            });

            if (result.success) {
                Alert.alert('Success', 'Profile created!', [
                    { text: 'OK', onPress: () => router.replace('/(app)/(tabs)') },
                ]);
            } else {
                Alert.alert('Error', result.error || 'Failed to create profile');
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to create profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <AppText variant="hero" color="primary">Complete Profile</AppText>
                    <AppText variant="body" color="textSecondary" style={{ marginTop: 4 }}>
                        Help us personalize your experience
                    </AppText>
                </View>

                <View style={styles.form}>
                    <AppCard variant="elevated" padding="lg" style={styles.card}>
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <AppInput
                                    label="First Name *"
                                    placeholder="John"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    autoCapitalize="words"
                                    error={errors.firstName}
                                />
                            </View>
                            <View style={{ width: Theme.Spacing.md }} />
                            <View style={{ flex: 1 }}>
                                <AppInput
                                    label="Last Name *"
                                    placeholder="Doe"
                                    value={lastName}
                                    onChangeText={setLastName}
                                    autoCapitalize="words"
                                    error={errors.lastName}
                                />
                            </View>
                        </View>

                        <AppInput
                            label="Date of Birth *"
                            placeholder="YYYY-MM-DD"
                            value={dateOfBirth}
                            onChangeText={setDateOfBirth}
                            keyboardType="numbers-and-punctuation"
                            error={errors.dateOfBirth}
                            icon={<Ionicons name="calendar-outline" size={20} color={Theme.Colors.textSecondary} />}
                        />

                        <View style={styles.inputGroup}>
                            <AppText variant="caption" weight="bold" color="textSecondary" style={{ marginBottom: 8 }}>
                                Gender *
                            </AppText>
                            <View style={styles.genderRow}>
                                {genders.map((g) => (
                                    <TouchableOpacity
                                        key={g.key}
                                        style={[
                                            styles.genderOption,
                                            gender === g.key && styles.genderOptionSelected
                                        ]}
                                        onPress={() => setGender(g.key)}
                                    >
                                        <Ionicons
                                            name={g.icon as any}
                                            size={20}
                                            color={gender === g.key ? Theme.Colors.primary : Theme.Colors.textSecondary}
                                        />
                                        <AppText
                                            variant="caption"
                                            color={gender === g.key ? 'primary' : 'textSecondary'}
                                            weight={gender === g.key ? 'bold' : 'semiBold'}
                                            style={{ marginTop: 4 }}
                                        >
                                            {g.label}
                                        </AppText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <AppInput
                                    label="Height (cm)"
                                    placeholder="175"
                                    value={height}
                                    onChangeText={setHeight}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                            <View style={{ width: Theme.Spacing.md }} />
                            <View style={{ flex: 1 }}>
                                <AppInput
                                    label="Weight (kg)"
                                    placeholder="70"
                                    value={weight}
                                    onChangeText={setWeight}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>

                        <AppButton
                            title={isLoading ? 'Saving...' : 'Save Profile'}
                            onPress={handleSubmit}
                            loading={isLoading}
                            size="lg"
                            style={{ marginTop: Theme.Spacing.md }}
                        />
                    </AppCard>

                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={() => router.replace('/(app)/(tabs)')}
                    >
                        <AppText color="primary" weight="bold">Skip for now</AppText>
                    </TouchableOpacity>
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
    header: {
        marginBottom: Theme.Spacing.xxl,
    },
    form: {
        flex: 1,
    },
    card: {
        marginBottom: Theme.Spacing.xl,
    },
    row: {
        flexDirection: 'row',
    },
    inputGroup: {
        marginBottom: Theme.Spacing.md,
    },
    genderRow: {
        flexDirection: 'row',
        gap: Theme.Spacing.sm,
    },
    genderOption: {
        flex: 1,
        backgroundColor: Theme.Colors.surfaceAlt,
        borderRadius: Theme.Radii.md,
        padding: Theme.Spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.Colors.divider,
    },
    genderOptionSelected: {
        borderColor: Theme.Colors.primary,
        backgroundColor: Theme.Colors.surface,
        borderWidth: 2,
    },
    skipButton: {
        alignItems: 'center',
        paddingVertical: Theme.Spacing.md,
    },
});
