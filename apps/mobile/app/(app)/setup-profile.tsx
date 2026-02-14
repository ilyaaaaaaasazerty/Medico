import { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { patientApi } from '@/services/patient.api';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppCard, AppInput, AppButton } from '@/components/base';
import { Ionicons } from '@expo/vector-icons';

const STEPS = ['Identity', 'Clinical', 'Lifestyle', 'Insurance', 'Review'];

export default function SetupProfileScreen() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Form Data
    const [data, setData] = useState({
        // 1. Identity
        firstName: '', lastName: '', dateOfBirth: '', gender: '',
        emergencyName: '', emergencyPhone: '', pharmacy: '',
        // 2. Clinical
        allergies: [], conditions: [], medications: [],
        // 3. Lifestyle
        smoking: 'NEVER', alcohol: 'NONE', diet: '',
        // 4. Insurance
        insuranceProvider: '', insurancePolicy: '', insuranceGroup: ''
    });

    const updateData = (key: string, value: any) => setData(prev => ({ ...prev, [key]: value }));

    const handleNext = async () => {
        if (step < STEPS.length - 1) {
            setStep(step + 1);
        } else {
            submitProfile();
        }
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
        else router.back();
    };

    const submitProfile = async () => {
        setLoading(true);
        try {
            const payload = {
                firstName: data.firstName,
                lastName: data.lastName,
                dateOfBirth: data.dateOfBirth,
                gender: (data.gender as 'MALE' | 'FEMALE' | 'OTHER') || 'OTHER',
                emergencyName: data.emergencyName,
                emergencyPhone: data.emergencyPhone,
                primaryPharmacy: data.pharmacy,
                smokingStatus: data.smoking as 'NEVER' | 'FORMER' | 'CURRENT',
                alcoholStatus: data.alcohol as 'NONE' | 'OCCASIONAL' | 'REGULAR',
                dietaryHabits: data.diet,
                insuranceProvider: data.insuranceProvider,
                insurancePolicyNumber: data.insurancePolicy,
                insuranceGroupNumber: data.insuranceGroup,
            };

            const res = await patientApi.createProfile(payload);
            if (res.success) {
                router.replace('/(app)/(tabs)');
            } else {
                Alert.alert('Error', res.error || 'Failed to create profile');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const renderIdentity = () => (
        <View style={styles.stepContainer}>
            <AppText variant="hero" color="primary">Who are you?</AppText>
            <AppText variant="body" color="textSecondary" style={{ marginBottom: Theme.Spacing.xl }}>
                Let's start with the basics.
            </AppText>

            <AppCard variant="elevated" padding="lg">
                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <AppInput
                            label="First Name"
                            placeholder="John"
                            value={data.firstName}
                            onChangeText={t => updateData('firstName', t)}
                        />
                    </View>
                    <View style={{ width: Theme.Spacing.md }} />
                    <View style={{ flex: 1 }}>
                        <AppInput
                            label="Last Name"
                            placeholder="Doe"
                            value={data.lastName}
                            onChangeText={t => updateData('lastName', t)}
                        />
                    </View>
                </View>

                <AppInput
                    label="Date of Birth"
                    placeholder="YYYY-MM-DD"
                    value={data.dateOfBirth}
                    onChangeText={t => updateData('dateOfBirth', t)}
                    icon={<Ionicons name="calendar-outline" size={20} color={Theme.Colors.textSecondary} />}
                />

                <AppText variant="caption" weight="bold" color="textSecondary" style={{ marginTop: Theme.Spacing.md, marginBottom: 8 }}>
                    Emergency Contact
                </AppText>
                <AppInput
                    label="Contact Name"
                    placeholder="e.g. Mary Doe"
                    value={data.emergencyName}
                    onChangeText={t => updateData('emergencyName', t)}
                    icon={<Ionicons name="person-outline" size={20} color={Theme.Colors.textSecondary} />}
                />
                <AppInput
                    label="Contact Phone"
                    placeholder="e.g. +213..."
                    value={data.emergencyPhone}
                    onChangeText={t => updateData('emergencyPhone', t)}
                    icon={<Ionicons name="call-outline" size={20} color={Theme.Colors.textSecondary} />}
                    keyboardType="phone-pad"
                />
            </AppCard>
        </View>
    );

    const renderClinical = () => (
        <View style={styles.stepContainer}>
            <AppText variant="hero" color="primary">Health Profile</AppText>
            <AppText variant="body" color="textSecondary" style={{ marginBottom: Theme.Spacing.xl }}>
                Help us keep you safe.
            </AppText>

            <AppCard variant="elevated" padding="lg">
                <AppInput
                    label="Known Allergies"
                    placeholder="e.g. Peanuts, Penicillin"
                    icon={<Ionicons name="alert-circle-outline" size={20} color={Theme.Colors.error} />}
                />

                <AppInput
                    label="Chronic Conditions"
                    placeholder="e.g. Asthma, Diabetes"
                    icon={<Ionicons name="heart-outline" size={20} color={Theme.Colors.primary} />}
                />

                <AppInput
                    label="Current Medications"
                    placeholder="e.g. Lisinopril 10mg"
                    icon={<Ionicons name="medical-outline" size={20} color={Theme.Colors.secondary} />}
                />
            </AppCard>
        </View>
    );

    const renderLifestyle = () => (
        <View style={styles.stepContainer}>
            <AppText variant="hero" color="primary">Lifestyle</AppText>
            <AppText variant="body" color="textSecondary" style={{ marginBottom: Theme.Spacing.xl }}>
                Your habits matter to your health.
            </AppText>

            <AppCard variant="elevated" padding="lg">
                <AppText variant="caption" weight="bold" color="textSecondary" style={{ marginBottom: 12 }}>
                    Smoking Status
                </AppText>
                <View style={styles.chipRow}>
                    {['NEVER', 'FORMER', 'CURRENT'].map(s => (
                        <TouchableOpacity
                            key={s}
                            onPress={() => updateData('smoking', s)}
                            style={[styles.chip, data.smoking === s && styles.chipActive]}
                        >
                            <AppText
                                variant="caption"
                                weight="bold"
                                color={data.smoking === s ? 'primary' : 'textSecondary'}
                            >
                                {s}
                            </AppText>
                        </TouchableOpacity>
                    ))}
                </View>

                <AppText variant="caption" weight="bold" color="textSecondary" style={{ marginVertical: 12 }}>
                    Alcohol Consumption
                </AppText>
                <View style={styles.chipRow}>
                    {['NONE', 'OCCASIONAL', 'REGULAR'].map(s => (
                        <TouchableOpacity
                            key={s}
                            onPress={() => updateData('alcohol', s)}
                            style={[styles.chip, data.alcohol === s && styles.chipActive]}
                        >
                            <AppText
                                variant="caption"
                                weight="bold"
                                color={data.alcohol === s ? 'primary' : 'textSecondary'}
                            >
                                {s}
                            </AppText>
                        </TouchableOpacity>
                    ))}
                </View>

                <AppInput
                    label="Dietary Restrictions"
                    placeholder="e.g. Vegetarian, Gluten-Free"
                    value={data.diet}
                    onChangeText={t => updateData('diet', t)}
                    icon={<Ionicons name="restaurant-outline" size={20} color={Theme.Colors.textSecondary} />}
                />
            </AppCard>
        </View>
    );

    const renderInsurance = () => (
        <View style={styles.stepContainer}>
            <AppText variant="hero" color="primary">Insurance</AppText>
            <AppText variant="body" color="textSecondary" style={{ marginBottom: Theme.Spacing.xl }}>
                Skip the paperwork later.
            </AppText>

            <AppCard variant="elevated" padding="lg">
                <TouchableOpacity style={styles.scanBtn}>
                    <Ionicons name="camera" size={24} color={Theme.Colors.primary} />
                    <AppText color="primary" weight="bold" style={{ marginLeft: 10 }}>
                        Scan Insurance Card
                    </AppText>
                </TouchableOpacity>

                <View style={styles.separator}>
                    <View style={styles.line} />
                    <AppText variant="caption" color="textDisabled" style={{ marginHorizontal: 10 }}>
                        OR ENTER MANUALLY
                    </AppText>
                    <View style={styles.line} />
                </View>

                <AppInput
                    label="Provider Name"
                    placeholder="e.g. BlueCross"
                    value={data.insuranceProvider}
                    onChangeText={t => updateData('insuranceProvider', t)}
                />
                <AppInput
                    label="Policy Number"
                    value={data.insurancePolicy}
                    onChangeText={t => updateData('insurancePolicy', t)}
                />
                <AppInput
                    label="Group Number (Optional)"
                    value={data.insuranceGroup}
                    onChangeText={t => updateData('insuranceGroup', t)}
                />
            </AppCard>
        </View>
    );

    const renderReview = () => (
        <View style={styles.stepContainer}>
            <AppText variant="hero" color="primary">All Set!</AppText>
            <AppText variant="body" color="textSecondary" style={{ marginBottom: Theme.Spacing.xl }}>
                Your Digital Medical Identity is ready.
            </AppText>

            <AppCard variant="elevated" padding="xl" style={styles.scoreCard}>
                <AppText variant="caption" weight="bold" color="textSecondary" style={{ letterSpacing: 1 }}>
                    HEALTH READINESS SCORE
                </AppText>
                <AppText variant="title" color="secondary" style={{ fontSize: 64, marginVertical: 16 }}>
                    85%
                </AppText>
                <View style={styles.scoreBarBg}>
                    <View style={[styles.scoreBarFill, { width: '85%' }]} />
                </View>
                <AppText variant="body" color="text" style={{ textAlign: 'center' }}>
                    Great job! You are ready for your visits.
                </AppText>
            </AppCard>

            <View style={styles.reviewList}>
                <View style={styles.reviewItem}>
                    <Ionicons name="shield-checkmark" size={24} color={Theme.Colors.secondary} />
                    <AppText weight="semiBold" style={{ marginLeft: 16 }}>Data encrypted & secure</AppText>
                </View>
                <View style={styles.reviewItem}>
                    <Ionicons name="cloud-done" size={24} color={Theme.Colors.primary} />
                    <AppText weight="semiBold" style={{ marginLeft: 16 }}>Synced with Medico Cloud</AppText>
                </View>
            </View>
        </View>
    );

    return (
        <AppScreen padding={false}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={Theme.Colors.primary} />
                    </TouchableOpacity>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
                        </View>
                        <AppText variant="caption" color="textSecondary" weight="bold">
                            Step {step + 1} of {STEPS.length}: {STEPS[step]}
                        </AppText>
                    </View>
                </View>

                <View style={styles.content}>
                    {step === 0 && renderIdentity()}
                    {step === 1 && renderClinical()}
                    {step === 2 && renderLifestyle()}
                    {step === 3 && renderInsurance()}
                    {step === 4 && renderReview()}
                </View>

                <View style={styles.footer}>
                    <AppButton
                        title={step === STEPS.length - 1 ? 'Finish Setup' : 'Continue'}
                        onPress={handleNext}
                        loading={loading}
                        size="lg"
                    />
                </View>
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Theme.Spacing.lg,
        paddingTop: Theme.Spacing.xl,
        paddingBottom: Theme.Spacing.md,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: Theme.Radii.md,
        backgroundColor: Theme.Colors.surfaceAlt,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Theme.Spacing.md,
    },
    progressContainer: {
        flex: 1,
    },
    progressBar: {
        height: 6,
        backgroundColor: Theme.Colors.divider,
        borderRadius: 3,
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: Theme.Colors.primary,
        borderRadius: 3,
    },
    content: {
        flex: 1,
        paddingHorizontal: Theme.Spacing.lg,
    },
    stepContainer: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
    },
    chipRow: {
        flexDirection: 'row',
        gap: Theme.Spacing.sm,
        marginBottom: Theme.Spacing.md,
    },
    chip: {
        paddingHorizontal: Theme.Spacing.md,
        paddingVertical: 10,
        borderRadius: Theme.Radii.full,
        backgroundColor: Theme.Colors.surfaceAlt,
        borderWidth: 1,
        borderColor: Theme.Colors.divider,
    },
    chipActive: {
        borderColor: Theme.Colors.primary,
        backgroundColor: Theme.Colors.surface,
        borderWidth: 2,
    },
    scanBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Theme.Spacing.lg,
        borderRadius: Theme.Radii.lg,
        backgroundColor: Theme.Colors.surfaceAlt,
        borderWidth: 2,
        borderColor: Theme.Colors.primary,
        borderStyle: 'dashed',
        marginBottom: Theme.Spacing.lg,
    },
    separator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Theme.Spacing.xl,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: Theme.Colors.divider,
    },
    scoreCard: {
        alignItems: 'center',
        marginBottom: Theme.Spacing.xl,
    },
    scoreBarBg: {
        width: '100%',
        height: 8,
        backgroundColor: Theme.Colors.divider,
        borderRadius: 4,
        marginBottom: Theme.Spacing.md,
    },
    scoreBarFill: {
        height: '100%',
        backgroundColor: Theme.Colors.secondary,
        borderRadius: 4,
    },
    reviewList: {
        gap: Theme.Spacing.md,
    },
    reviewItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.Colors.surfaceAlt,
        padding: Theme.Spacing.md,
        borderRadius: Theme.Radii.md,
        borderWidth: 1,
        borderColor: Theme.Colors.divider,
    },
    footer: {
        paddingHorizontal: Theme.Spacing.lg,
        paddingTop: Theme.Spacing.md,
        paddingBottom: Theme.Spacing.xxl,
        borderTopWidth: 1,
        borderTopColor: Theme.Colors.divider,
    },
});
