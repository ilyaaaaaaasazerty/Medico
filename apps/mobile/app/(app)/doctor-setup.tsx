import { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { doctorApi } from '@/services/doctor.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppInput, AppButton, AppCard } from '@/components/base';
import Theme from '@/constants/Theme';

const { width } = Dimensions.get('window');
type Step = 'basic' | 'professional' | 'education' | 'review';

interface Specialty {
    id: string;
    name: string;
}

export default function DoctorSetupScreen() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('basic');
    const [isLoading, setIsLoading] = useState(false);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Form data
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [licenseExpiry, setLicenseExpiry] = useState('');
    const [yearsExperience, setYearsExperience] = useState('');
    const [bio, setBio] = useState('');
    const [consultationFee, setConsultationFee] = useState('');
    const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

    // Education
    const [degree, setDegree] = useState('');
    const [institution, setInstitution] = useState('');
    const [graduationYear, setGraduationYear] = useState('');

    useEffect(() => {
        loadSpecialties();
    }, []);

    const loadSpecialties = async () => {
        try {
            const result = await doctorApi.getAllSpecialties();
            if (result.success && result.data) {
                setSpecialties(result.data);
            }
        } catch (error) {
            console.error('Error loading specialties:', error);
        }
    };

    const validateBasic = () => {
        const newErrors: Record<string, string> = {};
        if (!firstName.trim()) newErrors.firstName = 'Legal first name is required';
        if (!lastName.trim()) newErrors.lastName = 'Legal last name is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateProfessional = () => {
        const newErrors: Record<string, string> = {};
        if (!licenseNumber.trim()) newErrors.licenseNumber = 'Professional license ID is required';
        if (!licenseExpiry.trim()) newErrors.licenseExpiry = 'Expiry date is required';
        if (selectedSpecialties.length === 0) newErrors.specialties = 'Specify at least one specialty';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (step === 'basic' && validateBasic()) {
            setStep('professional');
        } else if (step === 'professional' && validateProfessional()) {
            setStep('education');
        } else if (step === 'education') {
            setStep('review');
        }
    };

    const handleBack = () => {
        if (step === 'professional') setStep('basic');
        else if (step === 'education') setStep('professional');
        else if (step === 'review') setStep('education');
    };

    const toggleSpecialty = (id: string) => {
        if (selectedSpecialties.includes(id)) {
            setSelectedSpecialties(selectedSpecialties.filter((s) => s !== id));
        } else {
            setSelectedSpecialties([...selectedSpecialties, id]);
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const profileResult = await doctorApi.createProfile({
                firstName,
                lastName,
                licenseNumber,
                licenseExpiry,
                yearsExperience: yearsExperience ? parseInt(yearsExperience) : undefined,
                bio: bio || undefined,
                consultationFee: consultationFee ? parseFloat(consultationFee) : undefined,
            });

            if (!profileResult.success) {
                Alert.alert('Registration Error', profileResult.error || 'Unable to initialize profile.');
                return;
            }

            for (const specialtyId of selectedSpecialties) {
                await doctorApi.addSpecialty(specialtyId);
            }

            if (degree && institution && graduationYear) {
                await doctorApi.addEducation({
                    degree,
                    institution,
                    year: parseInt(graduationYear),
                });
            }

            Alert.alert('Welcome to Medico', 'Your professional credentials have been submitted for verification.', [
                { text: 'Go to Console', onPress: () => router.replace('/(app)/(doctor-tabs)') },
            ]);
        } catch (error: any) {
            Alert.alert('System Error', error.response?.data?.error || 'Connection to health network failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const steps: Step[] = ['basic', 'professional', 'education', 'review'];
    const currentIndex = steps.indexOf(step);

    return (
        <AppScreen padding={false}>
            {/* Header with Progress */}
            <View style={styles.header}>
                <View style={styles.progressBar}>
                    {steps.map((s, i) => (
                        <View
                            key={s}
                            style={[
                                styles.progressSegment,
                                i < currentIndex && styles.segmentComplete,
                                i === currentIndex && styles.segmentActive
                            ]}
                        />
                    ))}
                </View>
                <AppText variant="caption" weight="bold" color="textSecondary" align="center" style={{ marginTop: 16, textTransform: 'uppercase' }}>
                    Step {currentIndex + 1} of 4 • {step}
                </AppText>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {step === 'basic' && (
                    <View>
                        <AppText variant="h2" weight="black" style={{ marginBottom: 8 }}>Who are you?</AppText>
                        <AppText variant="body" color="textSecondary" style={{ marginBottom: 32 }}>Enter your legal name as it appears on your medical license.</AppText>

                        <AppInput
                            label="Legal First Name"
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="e.g. Marie"
                            error={errors.firstName}
                            containerStyle={{ marginBottom: 16 }}
                        />
                        <AppInput
                            label="Legal Last Name"
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="e.g. Curie"
                            error={errors.lastName}
                            containerStyle={{ marginBottom: 16 }}
                        />
                        <AppInput
                            label="Professional Bio"
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Briefly describe your clinical focus..."
                            multiline
                            numberOfLines={4}
                            containerStyle={{ marginBottom: 16 }}
                        />
                    </View>
                )}

                {step === 'professional' && (
                    <View>
                        <AppText variant="h2" weight="black" style={{ marginBottom: 8 }}>Credentialing</AppText>
                        <AppText variant="body" color="textSecondary" style={{ marginBottom: 32 }}>Verification data for patient safety.</AppText>

                        <AppInput
                            label="License ID"
                            value={licenseNumber}
                            onChangeText={setLicenseNumber}
                            placeholder="e.g. MS-99021-AL"
                            error={errors.licenseNumber}
                            containerStyle={{ marginBottom: 16 }}
                        />
                        <AppInput
                            label="Expiration Date (YYYY-MM-DD)"
                            value={licenseExpiry}
                            onChangeText={setLicenseExpiry}
                            placeholder="2028-12-31"
                            error={errors.licenseExpiry}
                            containerStyle={{ marginBottom: 16 }}
                        />

                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                            <View style={{ flex: 1 }}>
                                <AppInput
                                    label="Years Exp."
                                    value={yearsExperience}
                                    onChangeText={setYearsExperience}
                                    placeholder="5"
                                    keyboardType="number-pad"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <AppInput
                                    label="Fee (DZD)"
                                    value={consultationFee}
                                    onChangeText={setConsultationFee}
                                    placeholder="2500"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <AppText variant="body" weight="bold" style={{ marginBottom: 12 }}>
                            Primary Specialties {errors.specialties && <AppText variant="caption" color="error">({errors.specialties})</AppText>}
                        </AppText>
                        <View style={styles.chipGrid}>
                            {specialties.slice(0, 16).map((s) => (
                                <TouchableOpacity
                                    key={s.id}
                                    style={[styles.chip, selectedSpecialties.includes(s.id) && styles.chipActive]}
                                    onPress={() => toggleSpecialty(s.id)}
                                >
                                    <AppText
                                        variant="caption"
                                        weight="bold"
                                        color={selectedSpecialties.includes(s.id) ? 'primary' : 'textSecondary'}
                                    >
                                        {s.name}
                                    </AppText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {step === 'education' && (
                    <View>
                        <AppText variant="h2" weight="black" style={{ marginBottom: 8 }}>Education</AppText>
                        <AppText variant="body" color="textSecondary" style={{ marginBottom: 32 }}>Where did you train?</AppText>

                        <AppInput
                            label="Primary Degree"
                            value={degree}
                            onChangeText={setDegree}
                            placeholder="e.g. Doctor of Medicine"
                            containerStyle={{ marginBottom: 16 }}
                        />
                        <AppInput
                            label="Institution"
                            value={institution}
                            onChangeText={setInstitution}
                            placeholder="e.g. University of Algiers"
                            containerStyle={{ marginBottom: 16 }}
                        />
                        <AppInput
                            label="Graduation Year"
                            value={graduationYear}
                            onChangeText={setGraduationYear}
                            placeholder="2018"
                            keyboardType="number-pad"
                            containerStyle={{ marginBottom: 16 }}
                        />
                    </View>
                )}

                {step === 'review' && (
                    <View>
                        <AppText variant="h2" weight="black" style={{ marginBottom: 8 }}>Confirm Data</AppText>
                        <AppText variant="body" color="textSecondary" style={{ marginBottom: 32 }}>Review your profile before submission.</AppText>

                        <AppCard padding="lg" style={{ marginBottom: 24 }}>
                            <View style={{ gap: 16 }}>
                                <View>
                                    <AppText variant="caption" color="textSecondary" weight="bold">PROVIDER NAME</AppText>
                                    <AppText variant="h3" weight="bold">Dr. {firstName} {lastName}</AppText>
                                </View>
                                <View style={styles.divider} />
                                <View>
                                    <AppText variant="caption" color="textSecondary" weight="bold">CREDENTIALS</AppText>
                                    <AppText variant="body" weight="bold">{licenseNumber}</AppText>
                                    <AppText variant="caption" color="textSecondary">Expires: {licenseExpiry}</AppText>
                                </View>
                                <View style={styles.divider} />
                                <View>
                                    <AppText variant="caption" color="textSecondary" weight="bold">SPECIALTIES</AppText>
                                    <AppText variant="body">
                                        {specialties.filter((s) => selectedSpecialties.includes(s.id)).map((s) => s.name).join(', ')}
                                    </AppText>
                                </View>
                            </View>
                        </AppCard>

                        <View style={styles.legalBox}>
                            <Ionicons name="shield-checkmark" size={24} color={Theme.Colors.primary} />
                            <AppText variant="caption" color="textSecondary" style={{ flex: 1, marginLeft: 12 }}>
                                By submitting, you certify that you are a licensed medical professional. Fraudulent applications are subject to legal action.
                            </AppText>
                        </View>
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                {step !== 'basic' && (
                    <AppButton
                        title="Back"
                        variant="ghost"
                        onPress={handleBack}
                        style={{ flex: 1 }}
                    />
                )}
                <AppButton
                    title={step === 'review' ? 'Submit Profile' : 'Continue'}
                    onPress={step === 'review' ? handleSubmit : handleNext}
                    loading={isLoading}
                    style={{ flex: 2 }}
                    icon={step !== 'review' ? <Ionicons name="arrow-forward" size={20} color={Theme.Colors.textInverted} /> : undefined}
                />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
    progressBar: { flexDirection: 'row', gap: 6, height: 4 },
    progressSegment: { flex: 1, height: '100%', borderRadius: 2, backgroundColor: Theme.Colors.divider },
    segmentActive: { backgroundColor: Theme.Colors.primary },
    segmentComplete: { backgroundColor: Theme.Colors.primary + '80' },

    content: { padding: 24 },

    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider },
    chipActive: { backgroundColor: Theme.Colors.primary + '10', borderColor: Theme.Colors.primary },

    divider: { height: 1, backgroundColor: Theme.Colors.divider, marginVertical: 4 },
    legalBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Theme.Colors.primary + '05', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Theme.Colors.primary + '10' },

    footer: { flexDirection: 'row', gap: 16, padding: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
});
