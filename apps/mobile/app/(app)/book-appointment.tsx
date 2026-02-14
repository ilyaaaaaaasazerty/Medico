import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, Platform, TextStyle, ViewStyle, StyleProp } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { searchApi } from '@/services/availability.api';
import { appointmentApi } from '@/services/appointment.api';
import { patientApi } from '@/services/patient.api';
import { useAuth } from '@/providers/AuthProvider';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';
import Theme from '@/constants/Theme';



export default function BookAppointmentScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const doctorId = params.doctorId as string;
    const date = params.date as string;
    const time = params.time as string;

    const [doctor, setDoctor] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE' | 'WALLET'>('CASH');

    const [services, setServices] = useState<any[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState<string>('');
    const [reason, setReason] = useState('');
    const [type, setType] = useState<'IN_PERSON' | 'VIDEO_CALL'>('IN_PERSON');
    const [notes, setNotes] = useState('');
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

    useEffect(() => {
        loadData();
    }, [doctorId]);

    const loadData = async () => {
        try {
            const [docRes, servRes] = await Promise.all([
                searchApi.getDoctorProfile(doctorId),
                appointmentApi.getServices(doctorId),
            ]);

            if (docRes.success && docRes.data) {
                setDoctor(docRes.data);
            }

            if (servRes.success && servRes.data) {
                setServices(servRes.data);
                if (servRes.data.length > 0) setSelectedServiceId(servRes.data[0].id);
            }

        } catch (error) {
            console.error('Failed to load details', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSelectedFile(result.assets[0]);
            }
        } catch (error) {
            console.error('Error picking document', error);
        }
    };

    const selectedService = services.find(s => s.id === selectedServiceId);
    const price = selectedService?.price || 0;

    const handleConfirm = async () => {
        if (!reason.trim()) {
            Alert.alert('Selection Required', 'Please specify the reason for your clinical visit.');
            return;
        }

        if (!selectedServiceId) {
            Alert.alert('Configuration Error', 'No medical service selected. Please try again.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await appointmentApi.bookAppointment({
                doctorId,
                date,
                time,
                type,
                reason,
                notes,
                serviceId: selectedServiceId,
                paymentMethod,
            });

            if (res.success && res.data) {
                const appointmentId = res.data.id;
                if (selectedFile) {
                    try {
                        const formData = new FormData();
                        formData.append('file', {
                            uri: selectedFile.uri,
                            type: selectedFile.mimeType || 'application/octet-stream',
                            name: selectedFile.name,
                        } as any);
                        await appointmentApi.uploadAttachment(appointmentId, formData);
                    } catch (uploadError) {
                        console.error('Failed to upload attachment', uploadError);
                    }
                }
                router.replace({
                    pathname: '/(app)/booking-success',
                    params: { doctorName: `${doctor?.firstName} ${doctor?.lastName}` }
                });
            } else {
                Alert.alert('Scheduling Restricted', res.error || 'The selected slot became unavailable. Please choose another interval.');
            }
        } catch (error) {
            Alert.alert('Network Error', 'The synchronization with the medical network failed.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    return (
        <AppScreen safeArea padding={false} style={{ backgroundColor: Theme.Colors.background }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3">Confirm Booking</AppText>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <AppCard style={styles.summaryCard} padding="lg">
                    <View style={styles.drProfile}>
                        {doctor?.avatarUrl ? (
                            <Image source={{ uri: doctor.avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <AppText weight="black" style={{ color: Theme.Colors.primary, fontSize: 24 }}>
                                    {doctor?.firstName?.[0]}{doctor?.lastName?.[0]}
                                </AppText>
                            </View>
                        )}
                        <View style={styles.drText}>
                            <AppText variant="title">Dr. {doctor?.firstName} {doctor?.lastName}</AppText>
                            <AppText variant="caption" color="textSecondary" weight="bold">
                                {doctor?.specialties?.map((s: any) => s.name).join(' • ')}
                            </AppText>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoGrid}>
                        <View style={styles.infoBox}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="calendar-outline" size={20} color={Theme.Colors.primary} />
                            </View>
                            <View>
                                <AppText variant="caption" color="textSecondary" weight="black">Date</AppText>
                                <AppText variant="body" weight="black">
                                    {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </AppText>
                            </View>
                        </View>
                        <View style={styles.infoBox}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="time-outline" size={20} color={Theme.Colors.primary} />
                            </View>
                            <View>
                                <AppText variant="caption" color="textSecondary" weight="black">Interval</AppText>
                                <AppText variant="body" weight="black">{time}</AppText>
                            </View>
                        </View>
                    </View>

                    <View style={styles.serviceRow}>
                        <View style={styles.serviceInfo}>
                            <AppText variant="body" weight="bold">{selectedService?.name || 'Standard Consultation'}</AppText>
                            <AppText variant="body" weight="black" style={{ color: Theme.Colors.primary }}>{price} DZD</AppText>
                        </View>
                        <View style={styles.typeBadge}>
                            <Ionicons
                                name={type === 'IN_PERSON' ? 'business-outline' : 'videocam-outline'}
                                size={14}
                                color={Theme.Colors.primary}
                            />
                            <AppText variant="caption" weight="bold">{type === 'IN_PERSON' ? 'Clinic' : 'Tele-Health'}</AppText>
                        </View>
                    </View>
                </AppCard>


                <View style={styles.formSection}>
                    <AppText variant="title" style={{ marginBottom: 24 }}>Selection Requirements</AppText>

                    <AppText variant="caption" color="textSecondary" weight="black" style={styles.inputLabel}>Transactional Pathway</AppText>
                    <View style={styles.toggleRow}>
                        <TouchableOpacity
                            style={[styles.toggleBtn, paymentMethod === 'CASH' && styles.toggleActive]}
                            onPress={() => setPaymentMethod('CASH')}
                        >
                            <Ionicons name="cash-outline" size={20} color={paymentMethod === 'CASH' ? Theme.Colors.textInverted : Theme.Colors.textSecondary} />
                            <AppText weight="bold" color={paymentMethod === 'CASH' ? 'textInverted' : 'textSecondary'}>Physical Cash</AppText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleBtn, paymentMethod === 'ONLINE' && styles.toggleActive]}
                            onPress={() => setPaymentMethod('ONLINE')}
                        >
                            <Ionicons name="card-outline" size={20} color={paymentMethod === 'ONLINE' ? Theme.Colors.textInverted : Theme.Colors.textSecondary} />
                            <AppText weight="bold" color={paymentMethod === 'ONLINE' ? 'textInverted' : 'textSecondary'}>CIB / Card</AppText>
                        </TouchableOpacity>
                    </View>

                    <AppText variant="caption" color="textSecondary" weight="black" style={styles.inputLabel}>Encounter Modality</AppText>
                    <View style={styles.toggleRow}>
                        <TouchableOpacity
                            style={[styles.toggleBtn, type === 'IN_PERSON' && styles.toggleActive]}
                            onPress={() => setType('IN_PERSON')}
                        >
                            <Ionicons name="location-outline" size={20} color={type === 'IN_PERSON' ? Theme.Colors.textInverted : Theme.Colors.textSecondary} />
                            <AppText weight="bold" color={type === 'IN_PERSON' ? 'textInverted' : 'textSecondary'}>In-Clinic</AppText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleBtn, type === 'VIDEO_CALL' && styles.toggleActive]}
                            onPress={() => setType('VIDEO_CALL')}
                        >
                            <Ionicons name="videocam-outline" size={20} color={type === 'VIDEO_CALL' ? Theme.Colors.textInverted : Theme.Colors.textSecondary} />
                            <AppText weight="bold" color={type === 'VIDEO_CALL' ? 'textInverted' : 'textSecondary'}>Remote</AppText>
                        </TouchableOpacity>
                    </View>

                    <AppInput
                        label="Reason for Encounter *"
                        placeholder="Specify symptoms or focus of consultation..."
                        value={reason}
                        multiline
                        onChangeText={setReason}
                        containerStyle={{ marginBottom: 32 }}
                    />

                    <AppText variant="caption" color="textSecondary" weight="black" style={styles.inputLabel}>Diagnostic History / Attachments</AppText>
                    <TouchableOpacity style={styles.uploadSurface} onPress={handlePickDocument}>
                        {selectedFile ? (
                            <View style={styles.fileRow}>
                                <Ionicons name="document-attach" size={24} color={Theme.Colors.primary} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <AppText variant="body" weight="black" numberOfLines={1}>{selectedFile.name}</AppText>
                                    <AppText variant="caption" color="textSecondary" weight="bold">
                                        {selectedFile.size ? (selectedFile.size / 1024).toFixed(1) + ' KB' : 'Digital Record'}
                                    </AppText>
                                </View>
                                <TouchableOpacity onPress={() => setSelectedFile(null)}>
                                    <Ionicons name="close-circle" size={24} color={Theme.Colors.error} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.uploadPrompt}>
                                <Ionicons name="cloud-upload-outline" size={28} color={Theme.Colors.primary} />
                                <AppText variant="body" weight="black">Verify with Clinical Files</AppText>
                                <AppText variant="caption" color="textSecondary" align="center" style={{ paddingHorizontal: 20 }}>
                                    Attach relevant reports or previous diagnostic indices
                                </AppText>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            <View style={styles.footer}>
                <LinearGradient
                    colors={['rgba(255,255,255,0)', Theme.Colors.background]}
                    style={styles.footerGradient}
                    pointerEvents="none"
                />
                <AppButton
                    title="Authorize Engagement"
                    onPress={handleConfirm}
                    loading={submitting}
                    disabled={submitting}
                    icon={<Ionicons name="shield-checkmark" size={20} color={Theme.Colors.textInverted} />}
                    style={styles.primaryAction}
                />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Theme.Colors.background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Theme.Spacing.lg,
        paddingTop: Theme.Spacing.sm,
        paddingBottom: Theme.Spacing.lg,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: Theme.Radii.full,
        backgroundColor: Theme.Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.Colors.divider,
        ...Theme.Shadows.floating,
    },

    scrollContent: {
        paddingHorizontal: Theme.Spacing.lg,
        paddingTop: Theme.Spacing.xs,
        paddingBottom: 150
    },
    summaryCard: {
        marginBottom: Theme.Spacing.xl,
        borderWidth: 1,
        borderColor: Theme.Colors.divider,
    },
    drProfile: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    avatar: {
        width: 68,
        height: 68,
        borderRadius: Theme.Radii.lg
    },
    avatarPlaceholder: {
        width: 68,
        height: 68,
        borderRadius: Theme.Radii.lg,
        backgroundColor: Theme.Colors.overlayPrimary,
        justifyContent: 'center',
        alignItems: 'center'
    },
    drText: {
        marginLeft: Theme.Spacing.md,
        flex: 1
    },

    divider: {
        height: 1,
        backgroundColor: Theme.Colors.divider,
        marginVertical: Theme.Spacing.xl,
        opacity: 0.5
    },

    infoGrid: {
        flexDirection: 'row',
        gap: Theme.Spacing.md,
        marginBottom: Theme.Spacing.xl
    },
    infoBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.Spacing.sm,
        backgroundColor: Theme.Colors.surfaceAlt,
        padding: Theme.Spacing.md,
        borderRadius: Theme.Radii.xl,
        borderWidth: 1,
        borderColor: Theme.Colors.divider
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: Theme.Radii.md,
        backgroundColor: Theme.Colors.overlayPrimary,
        justifyContent: 'center',
        alignItems: 'center'
    },

    serviceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Theme.Colors.overlayPrimary,
        padding: Theme.Spacing.md,
        borderRadius: Theme.Radii.xl,
        borderWidth: 1,
        borderColor: Theme.Colors.divider
    },
    serviceInfo: {
        flex: 1
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Theme.Colors.surface,
        paddingHorizontal: Theme.Spacing.md,
        paddingVertical: Theme.Spacing.xs,
        borderRadius: Theme.Radii.md,
        borderWidth: 1,
        borderColor: Theme.Colors.divider
    },

    formSection: {
        marginTop: Theme.Spacing.xxl
    },
    inputLabel: {
        marginBottom: Theme.Spacing.sm,
        marginLeft: 4,
        letterSpacing: 1
    },

    toggleRow: {
        flexDirection: 'row',
        gap: Theme.Spacing.md,
        marginBottom: Theme.Spacing.xl
    },
    toggleBtn: {
        flex: 1,
        height: 60,
        borderRadius: Theme.Radii.lg,
        backgroundColor: Theme.Colors.surface,
        borderWidth: 1.5,
        borderColor: Theme.Colors.divider,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Theme.Spacing.sm,
        ...Theme.Shadows.floating,
    },
    toggleActive: {
        backgroundColor: Theme.Colors.primary,
        borderColor: Theme.Colors.primary,
        ...Theme.Shadows.card,
    },

    uploadSurface: {
        backgroundColor: Theme.Colors.surface,
        borderRadius: Theme.Radii.xl,
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: Theme.Colors.divider,
        padding: Theme.Spacing.xl,
        alignItems: 'center',
        ...Theme.Shadows.floating,
    },
    uploadPrompt: {
        alignItems: 'center',
        gap: Theme.Spacing.xs
    },
    fileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%'
    },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: Theme.Spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20
    },
    footerGradient: {
        height: 140,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0
    },
    primaryAction: {
        height: 64,
        ...Theme.Shadows.card,
    },
});
